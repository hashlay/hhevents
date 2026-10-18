import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface AuthSession {
  token: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
  createdAt: number;
  expiresAt: number;
}

const activeSessions = new Map<string, AuthSession>();

// Rate limiter tracking for login attempts by IP
interface RateLimitEntry {
  failedAttempts: number;
  lockedUntil: number;
  firstAttemptTime: number;
}

const loginRateLimits = new Map<string, RateLimitEntry>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_DURATION_MS = 15 * 60 * 1000;  // 15 minutes window

/**
 * Derives a cryptographic hash using Node.js scrypt with a random 16-byte salt.
 * Format: "scrypt:<salt_hex>:<derived_key_hex>"
 */
export function hashPassword(password: string, saltHex?: string): string {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(password.normalize('NFKC'), salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return `scrypt:${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

/**
 * Timing-safe verification of plaintext password against stored scrypt hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return false;
    }
    const salt = Buffer.from(parts[1], 'hex');
    const expectedKey = Buffer.from(parts[2], 'hex');
    const derivedKey = crypto.scryptSync(password.normalize('NFKC'), salt, expectedKey.length, {
      N: 16384,
      r: 8,
      p: 1,
    });
    return crypto.timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}

// Predefined Manager / Owner Credentials on Server (stored as salted scrypt)
const INITIAL_PASSWORD_HASH = hashPassword(process.env.MANAGER_PASSWORD || 'HHEvents@Manager2026');

const SERVER_AUTH_CONFIG = {
  email: (process.env.MANAGER_EMAIL || 'hheventsconvention@gmail.com').trim().toLowerCase(),
  phone: process.env.MANAGER_PHONE || '9448133378',
  passwordHash: process.env.MANAGER_PASSWORD_HASH || INITIAL_PASSWORD_HASH,
  name: 'Venue General Manager',
  role: 'owner' as const,
};

function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.trim().replace(/\D/g, '');
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Checks if client IP is currently rate-limited.
 */
export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = loginRateLimits.get(ip);

  if (!entry) return { allowed: true };

  // If currently locked out
  if (entry.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Reset if window has elapsed
  if (now - entry.firstAttemptTime > WINDOW_DURATION_MS) {
    loginRateLimits.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Records failed login attempt for rate limiting.
 */
export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = loginRateLimits.get(ip) || {
    failedAttempts: 0,
    lockedUntil: 0,
    firstAttemptTime: now,
  };

  entry.failedAttempts += 1;

  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  loginRateLimits.set(ip, entry);
}

/**
 * Resets rate limit for IP on successful login.
 */
export function resetLoginRateLimit(ip: string): void {
  loginRateLimits.delete(ip);
}

export function verifyCredentials(email: string, phone: string, pass: string): boolean {
  if (!email || !phone || !pass) return false;

  const cleanEmail = email.trim().toLowerCase();
  const targetEmail = SERVER_AUTH_CONFIG.email;

  const cleanPhone = normalizePhone(phone);
  const targetPhone = normalizePhone(SERVER_AUTH_CONFIG.phone);

  const cleanPassword = pass.trim();

  const emailMatch = timingSafeStringEqual(cleanEmail, targetEmail);
  const phoneMatch =
    timingSafeStringEqual(cleanPhone, targetPhone) ||
    (cleanPhone.length >= 10 && cleanPhone.endsWith(targetPhone)) ||
    (targetPhone.length >= 10 && targetPhone.endsWith(cleanPhone));
  const passwordMatch = verifyPassword(cleanPassword, SERVER_AUTH_CONFIG.passwordHash);

  return emailMatch && phoneMatch && passwordMatch;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'hh_events_manager_secret_hmac_2026_salt_9448133378';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days Remembered Session
const revokedTokens = new Set<string>();

/**
 * Signs a stateless HMAC-SHA256 session token for resilient authentication
 * across server restarts and Vercel serverless cold boots.
 */
export function signToken(data: {
  email: string;
  name: string;
  role: string;
  createdAt: number;
  expiresAt: number;
}): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `mng_sec_${payload}.${signature}`;
}

export function verifyToken(token: string): AuthSession | null {
  if (!token || !token.startsWith('mng_sec_')) return null;
  if (revokedTokens.has(token)) return null;

  const raw = token.slice('mng_sec_'.length);
  const dotIndex = raw.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const payload = raw.slice(0, dotIndex);
  const signature = raw.slice(dotIndex + 1);
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');

  const bufSig = Buffer.from(signature);
  const bufExpected = Buffer.from(expectedSig);
  if (bufSig.length !== bufExpected.length || !crypto.timingSafeEqual(bufSig, bufExpected)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.expiresAt || Date.now() > data.expiresAt) {
      return null;
    }
    return {
      token,
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  } catch {
    return null;
  }
}

export function createSession(): AuthSession {
  const now = Date.now();
  const sessionData = {
    email: SERVER_AUTH_CONFIG.email,
    name: SERVER_AUTH_CONFIG.name,
    role: SERVER_AUTH_CONFIG.role,
    createdAt: now,
    expiresAt: now + SEVEN_DAYS_MS, // 7 days session
  };

  const token = signToken(sessionData);
  const session: AuthSession = {
    token,
    ...sessionData,
  };

  activeSessions.set(token, session);
  return session;
}

export function getSession(token?: string): AuthSession | null {
  if (!token) return null;
  if (revokedTokens.has(token)) return null;

  const session = activeSessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return null;
    }
    return session;
  }

  // Stateless verification fallback (resilient to serverless cold starts & server reboots)
  const verified = verifyToken(token);
  if (verified) {
    activeSessions.set(token, verified);
    return verified;
  }

  return null;
}

export function revokeSession(token: string): void {
  activeSessions.delete(token);
  revokedTokens.add(token);
}

/**
 * Express middleware to enforce admin/manager authentication on all protected endpoints.
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-admin-token']) {
    token = String(req.headers['x-admin-token']).trim();
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired administrative session' });
  }

  (req as any).adminSession = session;
  next();
}
