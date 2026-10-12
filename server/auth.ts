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

// Predefined Manager / Owner Credentials on Server
const SERVER_AUTH_CONFIG = {
  email: process.env.MANAGER_EMAIL || 'hheventsconvention@gmail.com',
  phone: process.env.MANAGER_PHONE || '9448133378',
  password: process.env.MANAGER_PASSWORD || 'HHEvents@Manager2026',
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

export function verifyCredentials(email: string, phone: string, pass: string): boolean {
  if (!email || !phone || !pass) return false;

  const cleanEmail = email.trim().toLowerCase();
  const targetEmail = SERVER_AUTH_CONFIG.email.trim().toLowerCase();

  const cleanPhone = normalizePhone(phone);
  const targetPhone = normalizePhone(SERVER_AUTH_CONFIG.phone);

  const cleanPassword = pass.trim();
  const targetPassword = SERVER_AUTH_CONFIG.password.trim();

  const emailMatch = cleanEmail === targetEmail;
  const phoneMatch =
    cleanPhone === targetPhone ||
    (cleanPhone.length >= 10 && cleanPhone.endsWith(targetPhone)) ||
    (targetPhone.length >= 10 && targetPhone.endsWith(cleanPhone));
  const passwordMatch = cleanPassword === targetPassword;

  return emailMatch && phoneMatch && passwordMatch;
}

export function createSession(): AuthSession {
  const token = `mng_sec_${crypto.randomBytes(32).toString('hex')}`;
  const now = Date.now();
  const session: AuthSession = {
    token,
    email: SERVER_AUTH_CONFIG.email,
    name: SERVER_AUTH_CONFIG.name,
    role: SERVER_AUTH_CONFIG.role,
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
  };
  activeSessions.set(token, session);
  return session;
}

export function getSession(token?: string): AuthSession | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return session;
}

export function revokeSession(token: string): void {
  activeSessions.delete(token);
}

/**
 * Express middleware to enforce admin/manager authentication.
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
