// server/app.ts
import dotenv2 from "dotenv";
import express, { Router } from "express";
import path2 from "path";
import fs2 from "fs";

// server/db.ts
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
dotenv.config();
var PHYSICAL_RESOURCES = [
  { id: "gents_hall", name: "Gents Hall (Hall 1)", category: "hall", capacity: 600 },
  { id: "ladies_hall", name: "Ladies Hall (Hall 2)", category: "hall", capacity: 600 },
  { id: "dining_1", name: "Dining Section 1 (Gents Dining)", category: "dining", capacity: 350 },
  { id: "dining_2", name: "Dining Section 2 (Ladies Dining)", category: "dining", capacity: 350 },
  { id: "kitchen", name: "Commercial Catering Kitchen", category: "kitchen", capacity: 50 }
];
var INITIAL_PACKAGES = [
  {
    id: "full-ac-hall",
    name: "Full AC Hall",
    displayName: "Full AC Hall (Gents & Ladies Hall)",
    details: "Gents & Ladies Hall + Gents & Ladies Dining + Kitchen with Centralized Air Conditioning",
    rent: 65e3,
    rentFormatted: "65,000.00",
    acType: "AC",
    requiredResources: ["gents_hall", "ladies_hall", "dining_1", "dining_2", "kitchen"],
    inclusions: [
      "Gents & Ladies Convention Hall Wings",
      "Dual Gents & Ladies Dining Wings",
      "Full Central Air Conditioning (AC)",
      "Equipped Catering Kitchen Facility",
      "Main Stage & Processional Aisle",
      "Backup Generator Power Supply"
    ],
    capacityText: "Up to 3,000 Persons (Floating) / 1,200 Seated",
    active: true,
    displayOrder: 1
  },
  {
    id: "full-non-ac-hall",
    name: "Full Non AC Hall",
    displayName: "Full Non AC Hall (Gents & Ladies Hall)",
    details: "Gents & Ladies Hall + Gents & Ladies Dining + Kitchen (Natural High Ventilation)",
    rent: 45e3,
    rentFormatted: "45,000.00",
    acType: "Non AC",
    requiredResources: ["gents_hall", "ladies_hall", "dining_1", "dining_2", "kitchen"],
    inclusions: [
      "Gents & Ladies Convention Hall Wings",
      "Dual Gents & Ladies Dining Wings",
      "High-Ceiling Ventilation & Air Circulators",
      "Equipped Catering Kitchen Facility",
      "Main Stage & Processional Aisle",
      "Backup Generator Power Supply"
    ],
    capacityText: "Up to 3,000 Persons (Floating) / 1,200 Seated",
    active: true,
    displayOrder: 2
  },
  {
    id: "single-ac-hall",
    name: "Single AC Hall",
    displayName: "Single AC Hall (Hall 1 / Hall 2)",
    details: "Single Hall + Single Dining + Kitchen with Air Conditioning",
    rent: 3e4,
    rentFormatted: "30,000.00",
    acType: "AC",
    requiredResources: ["gents_hall", "dining_1", "kitchen"],
    inclusions: [
      "Single Independent Hall Wing (AC)",
      "Dedicated Single Dining Wing",
      "Equipped Catering Kitchen Facility",
      "Stage Platform with Acoustic Lighting",
      "Independent Entrance & Restroom Amenities"
    ],
    capacityText: "Up to 600 Persons (Floating) / 400 Seated",
    active: true,
    displayOrder: 3
  },
  {
    id: "single-ac-hall-ii",
    name: "Single AC Hall-II",
    displayName: "Single AC Hall-II (Double Dining)",
    details: "Single Hall + Double Dining + Kitchen with Air Conditioning",
    rent: 45e3,
    rentFormatted: "45,000.00",
    acType: "AC",
    requiredResources: ["gents_hall", "dining_1", "dining_2", "kitchen"],
    inclusions: [
      "Single Independent Hall Wing (AC)",
      "Dual Dining Wings (Double Dining Turnout)",
      "Equipped Catering Kitchen Facility",
      "Ideal for heavy dining turnouts with single stage program"
    ],
    capacityText: "Up to 1,000 Persons (Floating) / 500 Seated",
    active: true,
    displayOrder: 4
  },
  {
    id: "single-non-ac-hall",
    name: "Single Non AC Hall",
    displayName: "Single Non AC Hall (Hall 1 / Hall 2)",
    details: "Single Hall + Single Dining + Kitchen (Natural Ventilation)",
    rent: 25e3,
    rentFormatted: "25,000.00",
    acType: "Non AC",
    requiredResources: ["gents_hall", "dining_1", "kitchen"],
    inclusions: [
      "Single Independent Hall Wing (Non-AC)",
      "Dedicated Single Dining Wing",
      "Equipped Catering Kitchen Facility",
      "Ceiling Circulators & Ambient Lighting"
    ],
    capacityText: "Up to 600 Persons (Floating) / 400 Seated",
    active: true,
    displayOrder: 5
  },
  {
    id: "single-non-ac-hall-ii",
    name: "Single Non AC Hall -II",
    displayName: "Single Non AC Hall-II (Double Dining)",
    details: "Single Hall + Double Dining + Kitchen (Natural Ventilation)",
    rent: 3e4,
    rentFormatted: "30,000.00",
    acType: "Non AC",
    requiredResources: ["gents_hall", "dining_1", "dining_2", "kitchen"],
    inclusions: [
      "Single Independent Hall Wing (Non-AC)",
      "Dual Dining Wings (Double Dining)",
      "Equipped Catering Kitchen Facility"
    ],
    capacityText: "Up to 1,000 Persons (Floating) / 500 Seated",
    active: true,
    displayOrder: 6
  },
  {
    id: "single-dining",
    name: "Single Dining",
    displayName: "Single Dining + Kitchen",
    details: "Single Dining + Kitchen for intimate lunch/dinner feasts or catering preparation",
    rent: 15e3,
    rentFormatted: "15,000.00",
    acType: "Dining Only",
    requiredResources: ["dining_1", "kitchen"],
    inclusions: [
      "Single Dining Wing Access",
      "Equipped Catering Kitchen Facility",
      "Sanitation & Dining Table Setup"
    ],
    capacityText: "Up to 350 Persons Dining Turnover",
    active: true,
    displayOrder: 7
  },
  {
    id: "double-dining",
    name: "Double Dining",
    displayName: "Double Dining + Kitchen",
    details: "Double Dining + Kitchen for expansive banquets, community feasts, or iftar gatherings",
    rent: 2e4,
    rentFormatted: "20,000.00",
    acType: "Dining Only",
    requiredResources: ["dining_1", "dining_2", "kitchen"],
    inclusions: [
      "Both Dining Wings (Gents & Ladies Dining)",
      "Equipped Catering Kitchen Facility",
      "High Volume Banquet Table Setup"
    ],
    capacityText: "Up to 700 Persons Simultaneous Dining",
    active: true,
    displayOrder: 8
  }
];
var DB_DIR = path.join(process.cwd(), "data");
var DB_FILE = path.join(DB_DIR, "store.json");
var mongoClient = null;
var mongoDb = null;
var isMongoConnecting = false;
async function getMongoDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (mongoDb) return mongoDb;
  if (isMongoConnecting) {
    while (isMongoConnecting) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return mongoDb;
  }
  try {
    isMongoConnecting = true;
    const dbName = process.env.MONGODB_DB_NAME || "hhevents";
    mongoClient = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5e3
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);
    console.log(`[Database] MongoDB Atlas connected (${dbName})`);
    return mongoDb;
  } catch (err) {
    console.error(`[Database] MongoDB connection warning: ${err.message}. Resilient local storage active.`);
    return null;
  } finally {
    isMongoConnecting = false;
  }
}
function getDatabaseBackendStatus() {
  return {
    type: mongoDb ? "mongodb_atlas" : "local_store",
    connected: true
  };
}
var dbCache = null;
var writeLock = Promise.resolve();
function getInitialDatabase() {
  return {
    bookings: [],
    packages: INITIAL_PACKAGES,
    availabilityBlackouts: [],
    maintenance: [],
    auditLogs: [
      {
        id: `LOG-INIT-MONGODB`,
        action: "MONGODB_CLUSTER_INIT",
        performedBy: "system",
        targetEntity: "database",
        targetId: "cluster0-hhevents",
        details: "Shared persistent database initialized on MongoDB Atlas with 8 official packages and 0 customer bookings.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    ],
    settings: {
      name: "H H Events & Conventions",
      tagline: "Premier Convention, Wedding & Grand Event Destination",
      address: "Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal, Karnataka 574231",
      primaryPhone: "9448151878",
      secondaryPhone: "9448133378",
      whatsappPhone: "9741575078",
      googleMapsUrl: "https://maps.app.goo.gl/JxfruJVzpVDhxUhx6?g_st=ac",
      daySlotHours: "10:00 AM \u2013 3:00 PM",
      eveningSlotHours: "6:00 PM \u2013 10:00 PM",
      paymentNotice: "Payment and final booking arrangements are handled directly with the management. Please contact management for advance token confirmation.",
      gstNumber: "",
      panNumber: "",
      termsAndConditions: "Standard venue guidelines apply. Advance deposit is required to confirm the reservation.",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    coupons: [],
    inquiries: [],
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function writeLocalMirror(data) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const content = JSON.stringify(data, null, 2);
    const tempFile = path.join(DB_DIR, `store.json.tmp.${Date.now()}`);
    await fs.promises.writeFile(tempFile, content, "utf-8");
    await fs.promises.rename(tempFile, DB_FILE);
  } catch (err) {
    console.error("[Database] Failed writing local mirror:", err);
  }
}
async function getDb() {
  if (dbCache) {
    if (!dbCache.coupons) dbCache.coupons = [];
    if (!dbCache.inquiries) dbCache.inquiries = [];
    return dbCache;
  }
  try {
    const mongo = await getMongoDb();
    if (mongo) {
      const collection = mongo.collection("app_state");
      const doc = await collection.findOne({ _id: "master_store" });
      if (doc) {
        const { _id, ...rest } = doc;
        dbCache = rest;
        if (!dbCache.packages || dbCache.packages.length === 0) {
          dbCache.packages = INITIAL_PACKAGES;
        }
        if (!dbCache.coupons) {
          dbCache.coupons = [];
        }
        if (!dbCache.inquiries) {
          dbCache.inquiries = [];
        }
        await writeLocalMirror(dbCache);
        return dbCache;
      } else {
        console.log("[Database] Initializing fresh state in MongoDB Atlas...");
        dbCache = getInitialDatabase();
        await persistDb();
        return dbCache;
      }
    }
  } catch (err) {
    console.error("[Database] Failed to read from MongoDB Atlas:", err.message);
  }
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = await fs.promises.readFile(DB_FILE, "utf-8");
      dbCache = JSON.parse(raw);
      if (!dbCache.packages || dbCache.packages.length === 0) {
        dbCache.packages = INITIAL_PACKAGES;
      }
      if (!dbCache.coupons) {
        dbCache.coupons = [];
      }
      if (!dbCache.inquiries) {
        dbCache.inquiries = [];
      }
      return dbCache;
    }
  } catch (err) {
    console.error("Error reading store.json, re-initializing default schema:", err);
  }
  dbCache = getInitialDatabase();
  await persistDb();
  return dbCache;
}
async function persistDb() {
  if (!dbCache) return;
  writeLock = writeLock.then(async () => {
    try {
      dbCache.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
      try {
        const mongo = await getMongoDb();
        if (mongo) {
          const collection = mongo.collection("app_state");
          await collection.replaceOne(
            { _id: "master_store" },
            { ...dbCache },
            { upsert: true }
          );
        }
      } catch (mErr) {
        console.error("[Database] Error persisting to MongoDB Atlas:", mErr.message);
      }
      await writeLocalMirror(dbCache);
    } catch (err) {
      console.error("Failed to write database state:", err);
    }
  });
  return writeLock;
}
async function logAudit(action, performedBy, targetEntity, targetId, details) {
  const db = await getDb();
  const newLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
    action,
    performedBy,
    targetEntity,
    targetId,
    details,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.auditLogs.unshift(newLog);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  await persistDb();
}

// server/conflictEngine.ts
function resolveRequiredResources(packageId, hallSelection, packagesList) {
  if (packageId && packagesList) {
    const pkg = packagesList.find((p) => p.id === packageId);
    if (pkg && pkg.requiredResources && pkg.requiredResources.length > 0) {
      if (hallSelection === "hall_2") {
        return pkg.requiredResources.map((r) => {
          if (r === "gents_hall") return "ladies_hall";
          if (r === "dining_1") return "dining_2";
          return r;
        });
      }
      return [...pkg.requiredResources];
    }
  }
  if (hallSelection === "both") {
    return ["gents_hall", "ladies_hall", "dining_1", "dining_2", "kitchen"];
  } else if (hallSelection === "hall_2") {
    return ["ladies_hall", "dining_2", "kitchen"];
  }
  return ["gents_hall", "dining_1", "kitchen"];
}
function checkResourceConflict(db, date, slot, requiredResources, ignoreBookingId, onlyConfirmed) {
  for (const block of db.availabilityBlackouts) {
    if (block.date === date) {
      if (block.slot === "full_day" || block.slot === slot) {
        if (block.resources.includes("all")) {
          return {
            available: false,
            conflictReason: `Date is marked unavailable by venue management: ${block.reason || "Management Block"}`
          };
        }
        const hasOverlap = requiredResources.some((r) => block.resources.includes(r));
        if (hasOverlap) {
          return {
            available: false,
            conflictReason: `Required hall space is reserved/blacked out on ${date} (${slot}): ${block.reason || "Manager Blackout"}`
          };
        }
      }
    }
  }
  for (const m of db.maintenance) {
    if (m.status !== "cancelled" && m.status !== "completed") {
      if (date >= m.startDate && date <= m.endDate) {
        if (m.slot === "full_day" || m.slot === slot) {
          const hasOverlap = requiredResources.some((r) => m.resources.includes(r) || m.resources.includes("all"));
          if (hasOverlap) {
            return {
              available: false,
              conflictReason: `Facility is undergoing scheduled maintenance: ${m.title}`
            };
          }
        }
      }
    }
  }
  const activeBookings = db.bookings.filter((b) => {
    if (ignoreBookingId && b.id === ignoreBookingId) return false;
    if (onlyConfirmed) {
      return b.status === "APPROVED" || b.status === "CONFIRMED";
    }
    return b.status === "APPROVED" || b.status === "CONFIRMED" || b.status === "PENDING";
  });
  for (const b of activeBookings) {
    if (b.date === date && b.slot === slot) {
      const overlapping = requiredResources.filter(
        (r) => b.occupiedResources.includes(r)
      );
      if (overlapping.length > 0) {
        const resourceNames = overlapping.map((rId) => PHYSICAL_RESOURCES.find((pr) => pr.id === rId)?.name || rId).join(", ");
        const isPending = b.status === "PENDING";
        const msg = isPending ? `A reservation request (${b.id}) is already pending review for ${resourceNames} on this session.` : `Space conflict: ${resourceNames} is already booked on ${date} (${slot === "day" ? "Day Session" : "Evening Session"}).`;
        return {
          available: false,
          conflictReason: msg,
          conflictingBookingId: b.id,
          conflictingResources: overlapping
        };
      }
    }
  }
  return { available: true };
}

// server/auth.ts
import crypto from "crypto";
var activeSessions = /* @__PURE__ */ new Map();
var loginRateLimits = /* @__PURE__ */ new Map();
var MAX_FAILED_ATTEMPTS = 5;
var LOCKOUT_DURATION_MS = 15 * 60 * 1e3;
var WINDOW_DURATION_MS = 15 * 60 * 1e3;
function hashPassword(password, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, "hex") : crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 8,
    p: 1
  });
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}
function verifyPassword(password, storedHash) {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
      return false;
    }
    const salt = Buffer.from(parts[1], "hex");
    const expectedKey = Buffer.from(parts[2], "hex");
    const derivedKey = crypto.scryptSync(password.normalize("NFKC"), salt, expectedKey.length, {
      N: 16384,
      r: 8,
      p: 1
    });
    return crypto.timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}
var INITIAL_PASSWORD_HASH = hashPassword(process.env.MANAGER_PASSWORD || "HHEvents@Manager2026");
var SERVER_AUTH_CONFIG = {
  email: (process.env.MANAGER_EMAIL || "hheventsconvention@gmail.com").trim().toLowerCase(),
  phone: process.env.MANAGER_PHONE || "9448151878",
  passwordHash: process.env.MANAGER_PASSWORD_HASH || INITIAL_PASSWORD_HASH,
  name: "Venue General Manager",
  role: "owner"
};
function normalizePhone(rawPhone) {
  if (!rawPhone) return "";
  const digits = rawPhone.trim().replace(/\D/g, "");
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}
function timingSafeStringEqual(a, b) {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}
function checkLoginRateLimit(ip) {
  const now = Date.now();
  const entry = loginRateLimits.get(ip);
  if (!entry) return { allowed: true };
  if (entry.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1e3);
    return { allowed: false, retryAfterSeconds };
  }
  if (now - entry.firstAttemptTime > WINDOW_DURATION_MS) {
    loginRateLimits.delete(ip);
    return { allowed: true };
  }
  return { allowed: true };
}
function recordFailedLogin(ip) {
  const now = Date.now();
  const entry = loginRateLimits.get(ip) || {
    failedAttempts: 0,
    lockedUntil: 0,
    firstAttemptTime: now
  };
  entry.failedAttempts += 1;
  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  loginRateLimits.set(ip, entry);
}
function resetLoginRateLimit(ip) {
  loginRateLimits.delete(ip);
}
function verifyCredentials(email, phone, pass) {
  if (!email || !phone || !pass) return false;
  const cleanEmail = email.trim().toLowerCase();
  const targetEmail = SERVER_AUTH_CONFIG.email;
  const cleanPhone = normalizePhone(phone);
  const targetPhone = normalizePhone(SERVER_AUTH_CONFIG.phone);
  const cleanPassword = pass.trim();
  const emailMatch = timingSafeStringEqual(cleanEmail, targetEmail);
  const allowedPhones = [
    targetPhone,
    "9448151878",
    "9448133378",
    "9741575078"
  ];
  const phoneMatch = allowedPhones.some(
    (tp) => timingSafeStringEqual(cleanPhone, tp) || cleanPhone.length >= 10 && cleanPhone.endsWith(tp) || tp.length >= 10 && tp.endsWith(cleanPhone)
  );
  const passwordMatch = verifyPassword(cleanPassword, SERVER_AUTH_CONFIG.passwordHash);
  return emailMatch && phoneMatch && passwordMatch;
}
var SESSION_SECRET = process.env.SESSION_SECRET || "hh_events_manager_secret_hmac_2026_salt_9448133378";
var SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1e3;
var revokedTokens = /* @__PURE__ */ new Set();
function signToken(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `mng_sec_${payload}.${signature}`;
}
function verifyToken(token) {
  if (!token || !token.startsWith("mng_sec_")) return null;
  if (revokedTokens.has(token)) return null;
  const raw = token.slice("mng_sec_".length);
  const dotIndex = raw.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const payload = raw.slice(0, dotIndex);
  const signature = raw.slice(dotIndex + 1);
  const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  const bufSig = Buffer.from(signature);
  const bufExpected = Buffer.from(expectedSig);
  if (bufSig.length !== bufExpected.length || !crypto.timingSafeEqual(bufSig, bufExpected)) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.expiresAt || Date.now() > data.expiresAt) {
      return null;
    }
    return {
      token,
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt
    };
  } catch {
    return null;
  }
}
function createSession() {
  const now = Date.now();
  const sessionData = {
    email: SERVER_AUTH_CONFIG.email,
    name: SERVER_AUTH_CONFIG.name,
    role: SERVER_AUTH_CONFIG.role,
    createdAt: now,
    expiresAt: now + SEVEN_DAYS_MS
    // 7 days session
  };
  const token = signToken(sessionData);
  const session = {
    token,
    ...sessionData
  };
  activeSessions.set(token, session);
  return session;
}
function getSession(token) {
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
  const verified = verifyToken(token);
  if (verified) {
    activeSessions.set(token, verified);
    return verified;
  }
  return null;
}
function revokeSession(token) {
  activeSessions.delete(token);
  revokedTokens.add(token);
}
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.headers["x-admin-token"]) {
    token = String(req.headers["x-admin-token"]).trim();
  }
  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired administrative session" });
  }
  req.adminSession = session;
  next();
}

// server/app.ts
dotenv2.config();
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
var photosDir = path2.join(process.cwd(), "public", "assets", "venue", "photos");
var manifestPath = path2.join(photosDir, "manifest.json");
try {
  if (!fs2.existsSync(photosDir)) {
    fs2.mkdirSync(photosDir, { recursive: true });
  }
} catch (err) {
}
var apiRouter = Router();
apiRouter.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "H H Events & Conventions API",
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
apiRouter.get("/health", async (req, res) => {
  try {
    const db = await getDb();
    res.json({
      status: "ok",
      venue: db.settings.name,
      location: db.settings.address,
      packagesCount: db.packages.length,
      bookingsCount: db.bookings.length,
      database: getDatabaseBackendStatus(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});
apiRouter.post("/auth/login", async (req, res) => {
  const clientIp = String(req.ip || req.socket.remoteAddress || "127.0.0.1");
  const rateCheck = checkLoginRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Too many failed login attempts. Access temporarily locked for ${rateCheck.retryAfterSeconds} seconds.`,
      retryAfterSeconds: rateCheck.retryAfterSeconds
    });
  }
  const { email, phone, password } = req.body;
  if (!email || !phone || !password) {
    return res.status(400).json({ error: "Email, phone number, and password are required." });
  }
  const isValid = verifyCredentials(email, phone, password);
  if (!isValid) {
    recordFailedLogin(clientIp);
    await logAudit("LOGIN_FAILED", String(email || "unknown"), "auth", "login", `Failed login attempt from IP ${clientIp}`);
    return res.status(401).json({ error: "Invalid administrative credentials." });
  }
  resetLoginRateLimit(clientIp);
  const session = createSession();
  await logAudit("LOGIN_SUCCESS", session.email, "auth", session.email, "Administrative console login succeeded.");
  res.json({
    success: true,
    token: session.token,
    user: {
      email: session.email,
      name: session.name,
      role: session.role
    }
  });
});
apiRouter.get("/auth/session", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : String(req.headers["x-admin-token"] || "").trim();
  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    user: {
      email: session.email,
      name: session.name,
      role: session.role
    }
  });
});
apiRouter.post("/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : String(req.headers["x-admin-token"] || "").trim();
  if (token) {
    const session = getSession(token);
    if (session) {
      await logAudit("LOGOUT", session.email, "auth", session.email, "Administrative session terminated.");
      revokeSession(token);
    }
  }
  res.json({ success: true });
});
apiRouter.get("/packages", async (req, res) => {
  try {
    const db = await getDb();
    const packagesList = db && Array.isArray(db.packages) && db.packages.length > 0 ? db.packages : INITIAL_PACKAGES;
    const sorted = [...packagesList].sort((a, b) => a.displayOrder - b.displayOrder);
    res.json(sorted);
  } catch (err) {
    console.warn("[API] Failed to fetch packages from DB, serving INITIAL_PACKAGES fallback:", err?.message);
    res.json(INITIAL_PACKAGES);
  }
});
apiRouter.put("/packages", requireAdminAuth, async (req, res) => {
  const { packages } = req.body;
  if (!Array.isArray(packages)) {
    return res.status(400).json({ error: "Packages list array expected" });
  }
  const db = await getDb();
  db.packages = packages;
  await persistDb();
  const admin = req.adminSession;
  await logAudit("PACKAGES_UPDATED", admin.email, "packages", "all", `Updated ${packages.length} packages.`);
  res.json({ success: true, packages: db.packages });
});
apiRouter.post("/packages", requireAdminAuth, async (req, res) => {
  const { name, displayName, details, rent, acType, requiredResources, inclusions, capacityText } = req.body;
  if (!name || !rent) {
    return res.status(400).json({ error: "Package name and rent are required" });
  }
  const db = await getDb();
  const pkgId = req.body.id || `pkg-${Date.now()}`;
  const newPkg = {
    id: pkgId,
    name,
    displayName: displayName || name,
    details: details || "",
    rent: Number(rent),
    rentFormatted: Number(rent).toLocaleString("en-IN") + ".00",
    acType: acType || "AC",
    requiredResources: Array.isArray(requiredResources) ? requiredResources : ["gents_hall", "dining_1", "kitchen"],
    inclusions: Array.isArray(inclusions) ? inclusions : ["Convention Hall Wing", "Dining Wing", "Catering Kitchen Facility"],
    capacityText: capacityText || "Up to 600 Persons",
    active: true,
    displayOrder: (db.packages || []).length + 1
  };
  if (!db.packages) db.packages = [];
  db.packages.push(newPkg);
  await persistDb();
  const admin = req.adminSession;
  await logAudit("PACKAGE_CREATED", admin.email, "packages", pkgId, `Created package ${newPkg.name}`);
  res.status(201).json({ success: true, package: newPkg, packages: db.packages });
});
apiRouter.delete("/packages/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const index = (db.packages || []).findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Package not found" });
  }
  const deleted = db.packages.splice(index, 1)[0];
  await persistDb();
  const admin = req.adminSession;
  await logAudit("PACKAGE_DELETED", admin.email, "packages", id, `Deleted package ${deleted.name}`);
  res.json({ success: true, deletedId: id, packages: db.packages });
});
apiRouter.get("/availability", async (req, res) => {
  const db = await getDb();
  const activeBookings = db.bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "APPROVED" || b.status === "PENDING"
  );
  res.json({
    bookings: activeBookings.map((b) => ({
      id: b.id,
      date: b.date,
      slot: b.slot,
      occupiedResources: b.occupiedResources,
      hallSelection: b.hallSelection,
      status: b.status
    })),
    blackouts: db.availabilityBlackouts,
    maintenance: db.maintenance.filter((m) => m.status !== "cancelled" && m.status !== "completed")
  });
});
apiRouter.post("/availability/blackout", requireAdminAuth, async (req, res) => {
  const { date, slot, resources, reason } = req.body;
  if (!date || !slot) {
    return res.status(400).json({ error: "Date and slot are required" });
  }
  const db = await getDb();
  const admin = req.adminSession;
  const newBlock = {
    id: `BLK-${Date.now()}`,
    date,
    slot: slot || "full_day",
    resources: resources || ["all"],
    reason: reason || "Manager unavailable date blackout",
    blockedBy: admin.email,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.availabilityBlackouts.push(newBlock);
  await persistDb();
  await logAudit("BLACKOUT_ADDED", admin.email, "availability", date, `Blocked ${date} (${slot}): ${reason}`);
  res.json({ success: true, blackout: newBlock });
});
apiRouter.delete("/availability/blackout/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const admin = req.adminSession;
  const idx = db.availabilityBlackouts.findIndex((b) => b.id === id);
  if (idx !== -1) {
    const removed = db.availabilityBlackouts.splice(idx, 1)[0];
    await persistDb();
    await logAudit("BLACKOUT_REMOVED", admin.email, "availability", removed.date, `Removed blackout for ${removed.date}`);
  }
  res.json({ success: true });
});
apiRouter.post("/bookings", async (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      packageId,
      hallSelection = "hall_1",
      acOption = "ac",
      date,
      slot,
      expectedAttendees,
      additionalInfo,
      eventType
    } = req.body;
    if (!customerName || !phone || !date || !slot) {
      return res.status(400).json({ error: "Customer name, phone, date, and session slot are mandatory." });
    }
    const db = await getDb();
    const requiredResources = resolveRequiredResources(packageId, hallSelection, db.packages);
    const authHeader = req.headers.authorization;
    const adminSessionToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.headers["x-admin-token"];
    const isAdmin = !!(adminSessionToken && getSession(adminSessionToken));
    const conflict = checkResourceConflict(db, date, slot, requiredResources, void 0, isAdmin);
    if (!conflict.available) {
      return res.status(409).json({
        error: conflict.conflictReason || "Conflict detected: Requested hall space is already reserved for this session.",
        conflictingResources: conflict.conflictingResources
      });
    }
    const matchedPkg = db.packages.find((p) => p.id === packageId);
    const pkgRent = matchedPkg ? matchedPkg.rent : hallSelection === "both" ? 65e3 : 3e4;
    const pkgName = matchedPkg ? matchedPkg.name : hallSelection === "both" ? "Full Hall" : "Single Hall";
    const randomNum = Math.floor(1e5 + Math.random() * 9e5);
    const bookingId = `HH-2026-${randomNum}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let discountAmount = 0;
    let appliedCoupon = null;
    if (req.body.couponCode && typeof req.body.couponCode === "string") {
      const codeUpper = req.body.couponCode.trim().toUpperCase();
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const coupon = (db.coupons || []).find((c) => c.code === codeUpper);
      if (coupon && coupon.isActive) {
        const notExpired = !coupon.expiryDate || coupon.expiryDate >= today;
        const underLimit = !coupon.usageLimit || coupon.usageLimit === 0 || coupon.usedCount < coupon.usageLimit;
        let clientEligible = true;
        if (coupon.category === "client_exclusive" && coupon.specificCustomerPhone) {
          const rawClient = coupon.specificCustomerPhone.replace(/\D/g, "");
          const rawPhone = phone.trim().replace(/\D/g, "");
          clientEligible = rawPhone.length >= 10 && rawClient.length >= 10 && (rawPhone.endsWith(rawClient) || rawClient.endsWith(rawPhone));
        }
        const minAmountMet = !coupon.minBookingAmount || pkgRent >= coupon.minBookingAmount;
        const customerUses = (coupon.usedBy || []).filter((u) => {
          const rawU = u.customerPhone.replace(/\D/g, "");
          const rawP = phone.trim().replace(/\D/g, "");
          return rawU.length >= 10 && rawP.length >= 10 && (rawU.endsWith(rawP) || rawP.endsWith(rawU));
        }).length;
        const perCustomerOk = !coupon.perCustomerLimit || customerUses < coupon.perCustomerLimit;
        if (notExpired && underLimit && clientEligible && minAmountMet && perCustomerOk) {
          appliedCoupon = coupon;
          if (coupon.discountType === "percentage") {
            discountAmount = Math.round(pkgRent * coupon.discountValue / 100);
            if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
              discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
            }
          } else {
            discountAmount = Math.min(pkgRent, coupon.discountValue);
          }
        }
      }
    }
    if (isAdmin && !appliedCoupon && req.body.customDiscountAmount) {
      const customVal = Number(req.body.customDiscountAmount) || 0;
      if (customVal > 0) {
        discountAmount = Math.min(pkgRent, customVal);
      }
    }
    const netRent = Math.max(0, pkgRent - discountAmount);
    const requestedStatus = isAdmin && req.body.status ? req.body.status.toUpperCase() : "PENDING";
    const initialPaid = isAdmin && req.body.amountPaid !== void 0 ? Number(req.body.amountPaid) : 0;
    const initialBalance = Math.max(0, netRent - initialPaid);
    const initialPaymentStatus = isAdmin && req.body.paymentStatus ? req.body.paymentStatus : initialBalance === 0 && netRent > 0 ? "fully_paid" : initialPaid > 0 ? "advance_paid" : requestedStatus === "CONFIRMED" ? "advance_paid" : "unpaid";
    const newBooking = {
      id: bookingId,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      packageId: packageId || (hallSelection === "both" ? "full-ac-hall" : "single-ac-hall"),
      packageName: pkgName,
      packagePrice: pkgRent,
      couponCode: appliedCoupon ? appliedCoupon.code : req.body.customDiscountReason ? `DIRECT-${req.body.customDiscountReason}` : void 0,
      discountAmount: discountAmount > 0 ? discountAmount : void 0,
      originalAmount: discountAmount > 0 ? pkgRent : void 0,
      occupiedResources: requiredResources,
      hallSelection,
      acOption: acOption || "ac",
      date,
      slot,
      expectedAttendees: expectedAttendees ? Number(expectedAttendees) : void 0,
      additionalInfo: additionalInfo?.trim(),
      eventType: eventType || "wedding",
      status: requestedStatus,
      totalAmount: netRent,
      advanceRequired: Math.round(netRent * 0.25),
      amountPaid: initialPaid,
      balanceDue: initialBalance,
      paymentStatus: initialPaymentStatus,
      payments: initialPaid > 0 ? [
        {
          id: `PAY-INIT-${Date.now()}`,
          bookingId,
          amount: initialPaid,
          paymentType: "advance",
          paymentMethod: "cash",
          receivedBy: isAdmin ? getSession(adminSessionToken)?.email || "admin@hhevents.in" : "system",
          receiptNumber: `RCP-${Date.now()}`,
          createdAt: now
        }
      ] : [],
      submittedAt: now,
      updatedAt: now,
      verifiedBy: isAdmin ? getSession(adminSessionToken)?.email || "admin@hhevents.in" : void 0
    };
    db.bookings.unshift(newBooking);
    if (appliedCoupon) {
      appliedCoupon.usedCount = (appliedCoupon.usedCount || 0) + 1;
      appliedCoupon.usedBy = appliedCoupon.usedBy || [];
      appliedCoupon.usedBy.unshift({
        bookingId,
        referenceNo: bookingId,
        customerName: customerName.trim(),
        customerPhone: phone.trim(),
        usedAt: now,
        originalAmount: pkgRent,
        discountAmount,
        finalAmount: netRent
      });
      appliedCoupon.updatedAt = now;
    }
    await persistDb();
    await logAudit(
      "BOOKING_SUBMITTED",
      customerName.trim(),
      "booking",
      bookingId,
      `Booking ${bookingId} submitted for ${pkgName} on ${date} (${slot})`
    );
    res.status(201).json({
      success: true,
      booking: newBooking
    });
  } catch (err) {
    console.error("Booking creation error:", err);
    res.status(500).json({ error: err.message || "Failed to process booking request" });
  }
});
apiRouter.get("/bookings/track", async (req, res) => {
  const { id, phone } = req.query;
  if (!id || !phone) {
    return res.status(400).json({ error: "Booking reference and mobile phone number are required." });
  }
  const cleanId = String(id).trim().toUpperCase();
  const cleanPhone = String(phone).replace(/\D/g, "");
  const db = await getDb();
  const found = db.bookings.find((b) => {
    const bId = b.id.toUpperCase();
    const bPhone = b.phone.replace(/\D/g, "");
    return bId === cleanId && (bPhone.endsWith(cleanPhone) || cleanPhone.endsWith(bPhone));
  });
  if (!found) {
    return res.status(404).json({ error: "No booking found matching this reference and mobile number." });
  }
  res.json({
    id: found.id,
    customerName: found.customerName,
    packageName: found.packageName,
    hallSelection: found.hallSelection,
    acOption: found.acOption,
    date: found.date,
    slot: found.slot,
    status: found.status,
    totalAmount: found.totalAmount,
    amountPaid: found.amountPaid,
    balanceDue: found.balanceDue,
    paymentStatus: found.paymentStatus,
    submittedAt: found.submittedAt,
    adminRemarks: found.adminRemarks
  });
});
apiRouter.get("/bookings", requireAdminAuth, async (req, res) => {
  const db = await getDb();
  res.json(db.bookings);
});
apiRouter.patch("/bookings/:id/status", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status, remarks, rejectionReason } = req.body;
  const db = await getDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: "Booking reference not found" });
  }
  const admin = req.adminSession;
  const upper = (status || "").toUpperCase();
  if (upper === "APPROVED" || upper === "CONFIRMED") {
    const conflict = checkResourceConflict(db, booking.date, booking.slot, booking.occupiedResources, booking.id, true);
    if (!conflict.available) {
      return res.status(409).json({
        error: `Cannot approve: Resource conflict on ${booking.date} (${booking.slot}). ${conflict.conflictReason}`
      });
    }
  }
  booking.status = upper;
  booking.adminRemarks = remarks !== void 0 ? remarks : booking.adminRemarks;
  booking.rejectionReason = rejectionReason !== void 0 ? rejectionReason : booking.rejectionReason;
  booking.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  booking.verifiedBy = admin.email;
  await persistDb();
  await logAudit(
    `BOOKING_STATUS_${upper}`,
    admin.email,
    "booking",
    id,
    `Status changed to ${upper}. Remarks: ${remarks || "None"}`
  );
  res.json({ success: true, booking });
});
apiRouter.patch("/bookings/:id/reschedule", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { date, slot, reason } = req.body;
  if (!date || !slot) {
    return res.status(400).json({ error: "New date and session slot are required." });
  }
  const db = await getDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: "Booking reference not found" });
  }
  const admin = req.adminSession;
  const conflict = checkResourceConflict(db, date, slot, booking.occupiedResources, booking.id);
  if (!conflict.available) {
    return res.status(409).json({
      error: `Cannot reschedule: Space conflict on ${date} (${slot}). ${conflict.conflictReason}`,
      conflictingResources: conflict.conflictingResources
    });
  }
  const oldDate = booking.date;
  const oldSlot = booking.slot;
  booking.date = date;
  booking.slot = slot;
  booking.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  booking.adminRemarks = `${booking.adminRemarks || ""}
Rescheduled from ${oldDate} (${oldSlot}) to ${date} (${slot}) by ${admin.email}. Reason: ${reason || "Customer request"}`.trim();
  await persistDb();
  await logAudit(
    "BOOKING_RESCHEDULED",
    admin.email,
    "booking",
    id,
    `Rescheduled from ${oldDate} (${oldSlot}) to ${date} (${slot}). Reason: ${reason || "None"}`
  );
  res.json({ success: true, booking });
});
apiRouter.post("/bookings/:id/cancel", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { reason, refundAmount } = req.body;
  const db = await getDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: "Booking reference not found" });
  }
  const admin = req.adminSession;
  booking.status = "CANCELLED";
  booking.rejectionReason = reason || "Cancelled by venue management / client request";
  booking.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (refundAmount && Number(refundAmount) > 0) {
    const refundNum = Number(refundAmount);
    const refundPayment = {
      id: `REF-${Date.now()}`,
      bookingId: id,
      amount: refundNum,
      paymentType: "refund",
      paymentMethod: "other",
      referenceNo: `REFUND-${Date.now()}`,
      receivedBy: admin.email,
      receiptNumber: `REF-${Date.now().toString().slice(-6)}`,
      notes: `Refund processed on cancellation: ${reason || ""}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    booking.payments.push(refundPayment);
    booking.amountPaid = booking.payments.reduce((sum, p) => sum + (p.paymentType === "refund" ? -p.amount : p.amount), 0);
    booking.balanceDue = Math.max(0, booking.totalAmount - booking.amountPaid);
  }
  await persistDb();
  await logAudit(
    "BOOKING_CANCELLED",
    admin.email,
    "booking",
    id,
    `Booking cancelled. Reason: ${reason || "None"}`
  );
  res.json({ success: true, booking });
});
apiRouter.post("/bookings/:id/payment", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { amount, paymentType = "advance", paymentMethod = "upi", referenceNo, notes } = req.body;
  const payAmount = Number(amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    return res.status(400).json({ error: "A valid positive payment amount is required." });
  }
  const db = await getDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: "Booking reference not found" });
  }
  const admin = req.adminSession;
  const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
  const newPayment = {
    id: `PAY-${Date.now()}`,
    bookingId: id,
    amount: payAmount,
    paymentType,
    paymentMethod,
    referenceNo: referenceNo?.trim() || `OFFLINE-${Date.now()}`,
    receivedBy: admin.email,
    receiptNumber,
    notes: notes?.trim(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  booking.payments.push(newPayment);
  booking.amountPaid = booking.payments.reduce((sum, p) => sum + (p.paymentType === "refund" ? -p.amount : p.amount), 0);
  booking.balanceDue = Math.max(0, booking.totalAmount - booking.amountPaid);
  booking.paymentStatus = booking.balanceDue === 0 ? "fully_paid" : booking.amountPaid > 0 ? "advance_paid" : "unpaid";
  booking.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await persistDb();
  await logAudit(
    "PAYMENT_RECORDED",
    admin.email,
    "booking",
    id,
    `Payment of \u20B9${payAmount} (${paymentMethod.toUpperCase()}) recorded. Receipt: ${receiptNumber}`
  );
  res.json({
    success: true,
    booking,
    payment: newPayment
  });
});
apiRouter.delete("/bookings/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const index = db.bookings.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Booking reference not found" });
  }
  const deleted = db.bookings.splice(index, 1)[0];
  await persistDb();
  const admin = req.adminSession;
  await logAudit(
    "BOOKING_DELETED",
    admin.email,
    "booking",
    id,
    `Booking permanently deleted for ${deleted.customerName} on ${deleted.date} (${deleted.slot}). Slot released.`
  );
  res.json({ success: true, message: "Booking permanently deleted", deletedId: id });
});
apiRouter.patch("/bookings/:id/discount", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { discountType = "fixed", discountValue = 0, reason = "" } = req.body;
  const db = await getDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: "Booking reference not found" });
  }
  const basePrice = booking.originalAmount || booking.packagePrice || booking.totalAmount;
  let discountAmount = 0;
  const val = Number(discountValue) || 0;
  if (discountType === "percentage") {
    discountAmount = Math.round(basePrice * val / 100);
  } else {
    discountAmount = val;
  }
  discountAmount = Math.max(0, Math.min(basePrice, discountAmount));
  booking.originalAmount = basePrice;
  booking.discountAmount = discountAmount;
  booking.totalAmount = Math.max(0, basePrice - discountAmount);
  booking.balanceDue = Math.max(0, booking.totalAmount - (booking.amountPaid || 0));
  booking.paymentStatus = booking.balanceDue === 0 && booking.totalAmount > 0 ? "fully_paid" : (booking.amountPaid || 0) > 0 ? "advance_paid" : "unpaid";
  booking.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (reason) {
    booking.adminRemarks = `${booking.adminRemarks || ""}
Manager Discount applied: \u20B9${discountAmount.toLocaleString("en-IN")}${reason ? ` (${reason})` : ""}`.trim();
  }
  await persistDb();
  const admin = req.adminSession;
  await logAudit(
    "BOOKING_DISCOUNT_APPLIED",
    admin.email,
    "booking",
    id,
    `Applied discount of \u20B9${discountAmount} (${discountType}: ${discountValue})`
  );
  res.json({ success: true, booking });
});
apiRouter.get("/settings", async (req, res) => {
  const db = await getDb();
  res.json(db.settings);
});
apiRouter.put("/settings", requireAdminAuth, async (req, res) => {
  const db = await getDb();
  const admin = req.adminSession;
  db.settings = {
    ...db.settings,
    ...req.body,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await persistDb();
  await logAudit("SETTINGS_UPDATED", admin.email, "settings", "general", "Updated venue operational settings");
  res.json({ success: true, settings: db.settings });
});
apiRouter.get("/audit-logs", requireAdminAuth, async (req, res) => {
  const db = await getDb();
  res.json(db.auditLogs);
});
apiRouter.get("/maintenance", async (req, res) => {
  const db = await getDb();
  res.json(db.maintenance);
});
apiRouter.post("/maintenance", requireAdminAuth, async (req, res) => {
  const db = await getDb();
  const admin = req.adminSession;
  const newRecord = {
    id: `MNT-${Date.now()}`,
    title: req.body.title || "Facility Maintenance",
    category: req.body.category || "general",
    resources: req.body.resources || ["all"],
    startDate: req.body.startDate,
    endDate: req.body.endDate || req.body.startDate,
    slot: req.body.slot || "full_day",
    status: req.body.status || "scheduled",
    notes: req.body.notes,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.maintenance.unshift(newRecord);
  await persistDb();
  await logAudit("MAINTENANCE_CREATED", admin.email, "maintenance", newRecord.id, `Scheduled ${newRecord.title}`);
  res.json({ success: true, maintenance: newRecord });
});
apiRouter.get("/coupons", requireAdminAuth, async (req, res) => {
  const db = await getDb();
  res.json(db.coupons || []);
});
apiRouter.post("/coupons", requireAdminAuth, async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minBookingAmount,
      expiryDate,
      usageLimit,
      perCustomerLimit,
      category,
      specificCustomerPhone,
      specificCustomerName,
      isActive
    } = req.body;
    if (!code || !title || !discountValue || !expiryDate) {
      return res.status(400).json({ error: "Code, title, discount value, and expiry date are required." });
    }
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!cleanCode) {
      return res.status(400).json({ error: "Invalid coupon code format." });
    }
    const db = await getDb();
    db.coupons = db.coupons || [];
    const existing = db.coupons.find((c) => c.code === cleanCode);
    if (existing) {
      return res.status(400).json({ error: `Coupon code '${cleanCode}' already exists.` });
    }
    const admin = req.adminSession;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newCoupon = {
      id: `CPN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      code: cleanCode,
      title: title.trim(),
      description: description ? description.trim() : "",
      discountType: discountType === "percentage" ? "percentage" : "fixed",
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : void 0,
      minBookingAmount: minBookingAmount ? Number(minBookingAmount) : void 0,
      expiryDate,
      usageLimit: usageLimit !== void 0 ? Number(usageLimit) : 0,
      usedCount: 0,
      perCustomerLimit: perCustomerLimit ? Number(perCustomerLimit) : 1,
      category: category || "general",
      specificCustomerPhone: specificCustomerPhone ? specificCustomerPhone.trim() : void 0,
      specificCustomerName: specificCustomerName ? specificCustomerName.trim() : void 0,
      isActive: isActive !== void 0 ? Boolean(isActive) : true,
      createdBy: admin?.email || "admin@hhevents.in",
      createdAt: now,
      updatedAt: now,
      usedBy: []
    };
    db.coupons.unshift(newCoupon);
    await persistDb();
    await logAudit(
      "COUPON_CREATED",
      admin?.email || "admin@hhevents.in",
      "coupon",
      newCoupon.code,
      `Created coupon ${cleanCode}: ${newCoupon.discountValue}${newCoupon.discountType === "percentage" ? "%" : " INR"} off`
    );
    res.status(201).json({ success: true, coupon: newCoupon });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create coupon" });
  }
});
apiRouter.patch("/coupons/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    db.coupons = db.coupons || [];
    const idx = db.coupons.findIndex((c2) => c2.id === id || c2.code === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Coupon not found" });
    }
    const c = db.coupons[idx];
    const admin = req.adminSession;
    if (req.body.title !== void 0) c.title = req.body.title.trim();
    if (req.body.description !== void 0) c.description = req.body.description.trim();
    if (req.body.discountType !== void 0) c.discountType = req.body.discountType;
    if (req.body.discountValue !== void 0) c.discountValue = Number(req.body.discountValue);
    if (req.body.maxDiscountAmount !== void 0) c.maxDiscountAmount = req.body.maxDiscountAmount ? Number(req.body.maxDiscountAmount) : void 0;
    if (req.body.minBookingAmount !== void 0) c.minBookingAmount = req.body.minBookingAmount ? Number(req.body.minBookingAmount) : void 0;
    if (req.body.expiryDate !== void 0) c.expiryDate = req.body.expiryDate;
    if (req.body.usageLimit !== void 0) c.usageLimit = Number(req.body.usageLimit);
    if (req.body.perCustomerLimit !== void 0) c.perCustomerLimit = Number(req.body.perCustomerLimit);
    if (req.body.category !== void 0) c.category = req.body.category;
    if (req.body.specificCustomerPhone !== void 0) c.specificCustomerPhone = req.body.specificCustomerPhone ? req.body.specificCustomerPhone.trim() : void 0;
    if (req.body.specificCustomerName !== void 0) c.specificCustomerName = req.body.specificCustomerName ? req.body.specificCustomerName.trim() : void 0;
    if (req.body.isActive !== void 0) c.isActive = Boolean(req.body.isActive);
    c.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await persistDb();
    await logAudit(
      "COUPON_UPDATED",
      admin?.email || "admin@hhevents.in",
      "coupon",
      c.code,
      `Updated coupon ${c.code}`
    );
    res.json({ success: true, coupon: c });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update coupon" });
  }
});
apiRouter.delete("/coupons/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    db.coupons = db.coupons || [];
    const idx = db.coupons.findIndex((c) => c.id === id || c.code === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Coupon not found" });
    }
    const removed = db.coupons.splice(idx, 1)[0];
    const admin = req.adminSession;
    await persistDb();
    await logAudit(
      "COUPON_DELETED",
      admin?.email || "admin@hhevents.in",
      "coupon",
      removed.code,
      `Deleted coupon ${removed.code}`
    );
    res.json({ success: true, removedCode: removed.code });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete coupon" });
  }
});
apiRouter.get("/coupons/public", async (req, res) => {
  const db = await getDb();
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const publicCoupons = (db.coupons || []).filter(
    (c) => c.isActive && c.category !== "client_exclusive" && (!c.expiryDate || c.expiryDate >= today) && (c.usageLimit === 0 || c.usedCount < c.usageLimit)
  ).map((c) => ({
    code: c.code,
    title: c.title,
    description: c.description,
    discountType: c.discountType,
    discountValue: c.discountValue,
    maxDiscountAmount: c.maxDiscountAmount,
    minBookingAmount: c.minBookingAmount,
    category: c.category,
    expiryDate: c.expiryDate
  }));
  res.json(publicCoupons);
});
apiRouter.post("/coupons/validate", async (req, res) => {
  try {
    const { code, packagePrice, phone } = req.body;
    if (!code) {
      return res.status(400).json({ valid: false, message: "Please enter a discount coupon code." });
    }
    const db = await getDb();
    const cleanCode = String(code).trim().toUpperCase();
    const coupon = (db.coupons || []).find((c) => c.code === cleanCode);
    if (!coupon) {
      return res.status(404).json({ valid: false, message: "Invalid coupon code. Please verify the code and try again." });
    }
    if (!coupon.isActive) {
      return res.status(400).json({ valid: false, message: "This coupon is currently inactive or deactivated by management." });
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (coupon.expiryDate && coupon.expiryDate < today) {
      return res.status(400).json({ valid: false, message: `This coupon has expired on ${coupon.expiryDate}.` });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ valid: false, message: "This coupon has reached its total usage limit." });
    }
    const rent = Number(packagePrice) || 0;
    if (coupon.minBookingAmount && rent < coupon.minBookingAmount) {
      return res.status(400).json({
        valid: false,
        message: `Minimum reservation package amount of \u20B9${coupon.minBookingAmount.toLocaleString("en-IN")} is required to apply this coupon.`
      });
    }
    if (coupon.category === "client_exclusive" && coupon.specificCustomerPhone) {
      const rawClient = coupon.specificCustomerPhone.replace(/\D/g, "");
      const rawPhone = phone ? String(phone).replace(/\D/g, "") : "";
      const matches = rawPhone.length >= 10 && rawClient.length >= 10 && (rawPhone.endsWith(rawClient) || rawClient.endsWith(rawPhone));
      if (!matches) {
        return res.status(400).json({
          valid: false,
          message: `This coupon is exclusively reserved for client number Ending with ...${coupon.specificCustomerPhone.slice(-4)}. Please enter the matching client mobile in Step 4.`
        });
      }
    }
    if (phone && coupon.perCustomerLimit && coupon.perCustomerLimit > 0) {
      const rawP = String(phone).replace(/\D/g, "");
      const uses = (coupon.usedBy || []).filter((u) => {
        const rawU = u.customerPhone.replace(/\D/g, "");
        return rawU.length >= 10 && rawP.length >= 10 && (rawU.endsWith(rawP) || rawP.endsWith(rawU));
      }).length;
      if (uses >= coupon.perCustomerLimit) {
        return res.status(400).json({
          valid: false,
          message: `You have already redeemed this coupon the maximum allowed limit (${coupon.perCustomerLimit} time).`
        });
      }
    }
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round(rent * coupon.discountValue / 100);
      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = Math.min(rent, coupon.discountValue);
    }
    const finalRent = Math.max(0, rent - discountAmount);
    const advanceRequired = Math.round(finalRent * 0.25);
    const balanceDue = finalRent - advanceRequired;
    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        discountAmount,
        originalPrice: rent,
        finalRent,
        advanceRequired,
        balanceDue,
        category: coupon.category
      }
    });
  } catch (err) {
    res.status(500).json({ valid: false, message: err.message || "Failed to validate coupon" });
  }
});
apiRouter.get("/photos", async (req, res) => {
  try {
    const fs3 = await import("fs/promises");
    const exists = await fs3.stat(manifestPath).then(() => true).catch(() => false);
    if (exists) {
      const raw = await fs3.readFile(manifestPath, "utf-8");
      return res.json(JSON.parse(raw));
    }
    res.json({ photos: {}, lastUpdated: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (err) {
    res.json({ photos: {}, lastUpdated: (/* @__PURE__ */ new Date()).toISOString() });
  }
});
apiRouter.post("/photos/upload", requireAdminAuth, async (req, res) => {
  try {
    const { slotId, dataUrl } = req.body;
    if (!slotId || !dataUrl) {
      return res.status(400).json({ error: "Missing slotId or dataUrl" });
    }
    const fs3 = await import("fs/promises");
    if (!fs3.stat(photosDir).then(() => true).catch(() => false)) {
      await fs3.mkdir(photosDir, { recursive: true });
    }
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid image data format. Expected base64 data URL." });
    }
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
    const safeFilename = `${slotId}-${Date.now()}.${ext}`;
    const filePath = path2.join(photosDir, safeFilename);
    await fs3.writeFile(filePath, buffer);
    const publicUrl = `/assets/venue/photos/${safeFilename}`;
    let manifest = {
      photos: {},
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      const exists = await fs3.stat(manifestPath).then(() => true).catch(() => false);
      if (exists) {
        manifest = JSON.parse(await fs3.readFile(manifestPath, "utf-8"));
      }
    } catch (e) {
    }
    manifest.photos[slotId] = {
      url: publicUrl,
      filename: safeFilename,
      mimeType,
      uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    manifest.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    await fs3.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
    res.json({
      success: true,
      slotId,
      url: publicUrl,
      filename: safeFilename
    });
  } catch (err) {
    console.error("Failed to upload photo:", err);
    res.status(500).json({ error: err.message || "Failed to save photo" });
  }
});
apiRouter.delete("/photos/:slotId", requireAdminAuth, async (req, res) => {
  try {
    const { slotId } = req.params;
    const fs3 = await import("fs/promises");
    const exists = await fs3.stat(manifestPath).then(() => true).catch(() => false);
    if (exists) {
      const manifest = JSON.parse(await fs3.readFile(manifestPath, "utf-8"));
      if (manifest.photos && manifest.photos[slotId]) {
        const fileToRemove = path2.join(photosDir, manifest.photos[slotId].filename);
        await fs3.unlink(fileToRemove).catch(() => {
        });
        delete manifest.photos[slotId];
        manifest.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
        await fs3.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
      }
    }
    res.json({ success: true, slotId });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to remove photo" });
  }
});
apiRouter.post("/inquiries", async (req, res) => {
  try {
    const { fullName, phone, email, topic, message } = req.body;
    if (!fullName || !phone) {
      return res.status(400).json({ error: "Full Name and Contact Phone are required." });
    }
    const db = await getDb();
    const inquiryId = `INQ-${Date.now().toString().slice(-6)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newInquiry = {
      id: inquiryId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      topic: topic || "General Hall Inquiry",
      message: (message || "").trim(),
      status: "new",
      submittedAt: now,
      updatedAt: now
    };
    if (!db.inquiries) db.inquiries = [];
    db.inquiries.unshift(newInquiry);
    await persistDb();
    res.status(201).json({
      success: true,
      message: "Your inquiry has been received. Our executive manager will contact you promptly.",
      inquiry: newInquiry
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit inquiry: " + err.message });
  }
});
apiRouter.get("/inquiries", requireAdminAuth, async (req, res) => {
  const db = await getDb();
  res.json(db.inquiries || []);
});
apiRouter.patch("/inquiries/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const db = await getDb();
  if (!db.inquiries) db.inquiries = [];
  const inq = db.inquiries.find((i) => i.id === id);
  if (!inq) {
    return res.status(404).json({ error: "Inquiry not found" });
  }
  if (status) inq.status = status;
  if (adminNotes !== void 0) inq.adminNotes = adminNotes;
  inq.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await persistDb();
  res.json({ success: true, inquiry: inq });
});
apiRouter.delete("/inquiries/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  if (!db.inquiries) db.inquiries = [];
  const idx = db.inquiries.findIndex((i) => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Inquiry not found" });
  }
  const deleted = db.inquiries.splice(idx, 1)[0];
  await persistDb();
  const admin = req.adminSession;
  await logAudit("INQUIRY_DELETED", admin.email, "inquiry", id, `Deleted inquiry from ${deleted.fullName}`);
  res.json({ success: true, message: "Inquiry deleted permanently", deletedId: id });
});
app.use("/api", apiRouter);
app.use(apiRouter);
var app_default = app;
export {
  app_default as default
};
