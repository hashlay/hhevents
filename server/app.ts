import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, Router } from "express";
import path from "path";
import fs from "fs";
import {
  getDb,
  persistDb,
  logAudit,
  getDatabaseBackendStatus,
  BookingRecord,
  PaymentTransaction,
  HallPackage,
  INITIAL_PACKAGES,
  DiscountCoupon,
  InquiryRecord,
} from "./db";
import { resolveRequiredResources, checkResourceConflict } from "./conflictEngine";
import {
  verifyCredentials,
  createSession,
  getSession,
  revokeSession,
  requireAdminAuth,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
} from "./auth";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Optional CORS helper for API calls
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const photosDir = path.join(process.cwd(), "public", "assets", "venue", "photos");
const manifestPath = path.join(photosDir, "manifest.json");

// Safe directory initialization
try {
  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }
} catch (err) {
  // Silent fail in serverless / read-only filesystem
}

const apiRouter = Router();

apiRouter.get("/", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "H H Events & Conventions API",
    time: new Date().toISOString(),
  });
});

// ==========================================
// 1. HEALTH & SYSTEM ENDPOINTS
// ==========================================
apiRouter.get("/health", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    res.json({
      status: "ok",
      venue: db.settings.name,
      location: db.settings.address,
      packagesCount: db.packages.length,
      bookingsCount: db.bookings.length,
      database: getDatabaseBackendStatus(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ==========================================
// 2. AUTHENTICATION ENDPOINTS
// ==========================================
apiRouter.post("/auth/login", async (req: Request, res: Response) => {
  const clientIp = String(req.ip || req.socket.remoteAddress || "127.0.0.1");
  const rateCheck = checkLoginRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Too many failed login attempts. Access temporarily locked for ${rateCheck.retryAfterSeconds} seconds.`,
      retryAfterSeconds: rateCheck.retryAfterSeconds,
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
      role: session.role,
    },
  });
});

apiRouter.get("/auth/session", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.substring(7).trim()
    : String(req.headers["x-admin-token"] || "").trim();

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: {
      email: session.email,
      name: session.name,
      role: session.role,
    },
  });
});

apiRouter.post("/auth/logout", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.substring(7).trim()
    : String(req.headers["x-admin-token"] || "").trim();

  if (token) {
    const session = getSession(token);
    if (session) {
      await logAudit("LOGOUT", session.email, "auth", session.email, "Administrative session terminated.");
      revokeSession(token);
    }
  }
  res.json({ success: true });
});

// ==========================================
// 3. PACKAGES & PRICING
// ==========================================
apiRouter.get("/packages", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const packagesList = db && Array.isArray(db.packages) && db.packages.length > 0 ? db.packages : INITIAL_PACKAGES;
    const sorted = [...packagesList].sort((a, b) => a.displayOrder - b.displayOrder);
    res.json(sorted);
  } catch (err: any) {
    console.warn("[API] Failed to fetch packages from DB, serving INITIAL_PACKAGES fallback:", err?.message);
    res.json(INITIAL_PACKAGES);
  }
});

apiRouter.put("/packages", requireAdminAuth, async (req: Request, res: Response) => {
  const { packages } = req.body;
  if (!Array.isArray(packages)) {
    return res.status(400).json({ error: "Packages list array expected" });
  }

  const db = await getDb();
  db.packages = packages;
  await persistDb();

  const admin = (req as any).adminSession;
  await logAudit("PACKAGES_UPDATED", admin.email, "packages", "all", `Updated ${packages.length} packages.`);

  res.json({ success: true, packages: db.packages });
});

apiRouter.post("/packages", requireAdminAuth, async (req: Request, res: Response) => {
  const { name, displayName, details, rent, acType, requiredResources, inclusions, capacityText } = req.body;
  if (!name || !rent) {
    return res.status(400).json({ error: "Package name and rent are required" });
  }
  const db = await getDb();
  const pkgId = req.body.id || `pkg-${Date.now()}`;
  const newPkg: HallPackage = {
    id: pkgId,
    name,
    displayName: displayName || name,
    details: details || '',
    rent: Number(rent),
    rentFormatted: Number(rent).toLocaleString('en-IN') + '.00',
    acType: acType || 'AC',
    requiredResources: Array.isArray(requiredResources) ? requiredResources : ['gents_hall', 'dining_1', 'kitchen'],
    inclusions: Array.isArray(inclusions) ? inclusions : ['Convention Hall Wing', 'Dining Wing', 'Catering Kitchen Facility'],
    capacityText: capacityText || 'Up to 600 Persons',
    active: true,
    displayOrder: (db.packages || []).length + 1,
  };
  if (!db.packages) db.packages = [];
  db.packages.push(newPkg);
  await persistDb();

  const admin = (req as any).adminSession;
  await logAudit("PACKAGE_CREATED", admin.email, "packages", pkgId, `Created package ${newPkg.name}`);
  res.status(201).json({ success: true, package: newPkg, packages: db.packages });
});

apiRouter.delete("/packages/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDb();
  const index = (db.packages || []).findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Package not found" });
  }
  const deleted = db.packages.splice(index, 1)[0];
  await persistDb();

  const admin = (req as any).adminSession;
  await logAudit("PACKAGE_DELETED", admin.email, "packages", id, `Deleted package ${deleted.name}`);
  res.json({ success: true, deletedId: id, packages: db.packages });
});

// ==========================================
// 4. LIVE AVAILABILITY & CALENDAR
// ==========================================
apiRouter.get("/availability", async (req: Request, res: Response) => {
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
      status: b.status,
    })),
    blackouts: db.availabilityBlackouts,
    maintenance: db.maintenance.filter((m) => m.status !== "cancelled" && m.status !== "completed"),
  });
});

apiRouter.post("/availability/blackout", requireAdminAuth, async (req: Request, res: Response) => {
  const { date, slot, resources, reason } = req.body;
  if (!date || !slot) {
    return res.status(400).json({ error: "Date and slot are required" });
  }

  const db = await getDb();
  const admin = (req as any).adminSession;
  const newBlock = {
    id: `BLK-${Date.now()}`,
    date,
    slot: slot || "full_day",
    resources: resources || ["all"],
    reason: reason || "Manager unavailable date blackout",
    blockedBy: admin.email,
    createdAt: new Date().toISOString(),
  };

  db.availabilityBlackouts.push(newBlock);
  await persistDb();
  await logAudit("BLACKOUT_ADDED", admin.email, "availability", date, `Blocked ${date} (${slot}): ${reason}`);

  res.json({ success: true, blackout: newBlock });
});

apiRouter.delete("/availability/blackout/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDb();
  const admin = (req as any).adminSession;

  const idx = db.availabilityBlackouts.findIndex((b) => b.id === id);
  if (idx !== -1) {
    const removed = db.availabilityBlackouts.splice(idx, 1)[0];
    await persistDb();
    await logAudit("BLACKOUT_REMOVED", admin.email, "availability", removed.date, `Removed blackout for ${removed.date}`);
  }

  res.json({ success: true });
});

// ==========================================
// 5. BOOKING CREATION & TRACKING
// ==========================================
apiRouter.post("/bookings", async (req: Request, res: Response) => {
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
      eventType,
    } = req.body;

    if (!customerName || !phone || !date || !slot) {
      return res.status(400).json({ error: "Customer name, phone, date, and session slot are mandatory." });
    }

    const db = await getDb();

    // Resolve resources
    const requiredResources = resolveRequiredResources(packageId, hallSelection, db.packages);

    const authHeader = req.headers.authorization;
    const adminSessionToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : (req.headers["x-admin-token"] as string);
    const isAdmin = !!(adminSessionToken && getSession(adminSessionToken));

    // Concurrency conflict check (admins creating direct reservations only check against confirmed bookings)
    const conflict = checkResourceConflict(db, date, slot, requiredResources, undefined, isAdmin);
    if (!conflict.available) {
      return res.status(409).json({
        error: conflict.conflictReason || "Conflict detected: Requested hall space is already reserved for this session.",
        conflictingResources: conflict.conflictingResources,
      });
    }

    // Match selected package
    const matchedPkg = db.packages.find((p) => p.id === packageId);
    const pkgRent = matchedPkg ? matchedPkg.rent : (hallSelection === "both" ? 65000 : 30000);
    const pkgName = matchedPkg ? matchedPkg.name : (hallSelection === "both" ? "Full Hall" : "Single Hall");

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const bookingId = `HH-2026-${randomNum}`;
    const now = new Date().toISOString();

    // Coupon discount processing
    let discountAmount = 0;
    let appliedCoupon: DiscountCoupon | null = null;

    if (req.body.couponCode && typeof req.body.couponCode === "string") {
      const codeUpper = req.body.couponCode.trim().toUpperCase();
      const today = new Date().toISOString().slice(0, 10);
      const coupon = (db.coupons || []).find((c) => c.code === codeUpper);
      if (coupon && coupon.isActive) {
        const notExpired = !coupon.expiryDate || coupon.expiryDate >= today;
        const underLimit = !coupon.usageLimit || coupon.usageLimit === 0 || coupon.usedCount < coupon.usageLimit;
        
        let clientEligible = true;
        if (coupon.category === "client_exclusive" && coupon.specificCustomerPhone) {
          const rawClient = coupon.specificCustomerPhone.replace(/\D/g, "");
          const rawPhone = phone.trim().replace(/\D/g, "");
          clientEligible =
            rawPhone.length >= 10 &&
            rawClient.length >= 10 &&
            (rawPhone.endsWith(rawClient) || rawClient.endsWith(rawPhone));
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
            discountAmount = Math.round((pkgRent * coupon.discountValue) / 100);
            if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
              discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
            }
          } else {
            discountAmount = Math.min(pkgRent, coupon.discountValue);
          }
        }
      }
    }

    // Direct manual discount (if specified by manager during direct reservation)
    if (isAdmin && !appliedCoupon && req.body.customDiscountAmount) {
      const customVal = Number(req.body.customDiscountAmount) || 0;
      if (customVal > 0) {
        discountAmount = Math.min(pkgRent, customVal);
      }
    }

    const netRent = Math.max(0, pkgRent - discountAmount);
    const requestedStatus = isAdmin && req.body.status ? req.body.status.toUpperCase() : "PENDING";
    const initialPaid = isAdmin && req.body.amountPaid !== undefined ? Number(req.body.amountPaid) : 0;
    const initialBalance = Math.max(0, netRent - initialPaid);
    const initialPaymentStatus = isAdmin && req.body.paymentStatus
      ? req.body.paymentStatus
      : (initialBalance === 0 && netRent > 0 ? "fully_paid" : initialPaid > 0 ? "advance_paid" : (requestedStatus === "CONFIRMED" ? "advance_paid" : "unpaid"));

    const newBooking: BookingRecord = {
      id: bookingId,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      packageId: packageId || (hallSelection === "both" ? "full-ac-hall" : "single-ac-hall"),
      packageName: pkgName,
      packagePrice: pkgRent,
      couponCode: appliedCoupon ? appliedCoupon.code : (req.body.customDiscountReason ? `DIRECT-${req.body.customDiscountReason}` : undefined),
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      originalAmount: discountAmount > 0 ? pkgRent : undefined,
      occupiedResources: requiredResources,
      hallSelection,
      acOption: acOption || "ac",
      date,
      slot,
      expectedAttendees: expectedAttendees ? Number(expectedAttendees) : undefined,
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
          receivedBy: isAdmin ? (getSession(adminSessionToken!)?.email || "admin@hhevents.in") : "system",
          receiptNumber: `RCP-${Date.now()}`,
          createdAt: now,
        }
      ] : [],
      submittedAt: now,
      updatedAt: now,
      verifiedBy: isAdmin ? (getSession(adminSessionToken!)?.email || "admin@hhevents.in") : undefined,
    };

    db.bookings.unshift(newBooking);

    // If coupon was applied, commit redemption ledger and increment usage count
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
        finalAmount: netRent,
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
      booking: newBooking,
    });
  } catch (err: any) {
    console.error("Booking creation error:", err);
    res.status(500).json({ error: err.message || "Failed to process booking request" });
  }
});

// Track single booking
apiRouter.get("/bookings/track", async (req: Request, res: Response) => {
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
    adminRemarks: found.adminRemarks,
  });
});

// Get all bookings (admin only)
apiRouter.get("/bookings", requireAdminAuth, async (req: Request, res: Response) => {
  const db = await getDb();
  res.json(db.bookings);
});

// Update booking status
apiRouter.patch("/bookings/:id/status", requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, remarks, rejectionReason } = req.body;

  const db = await getDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: "Booking reference not found" });
  }

  const admin = (req as any).adminSession;
  const upper = (status || "").toUpperCase();

  if (upper === "APPROVED" || upper === "CONFIRMED") {
    const conflict = checkResourceConflict(db, booking.date, booking.slot, booking.occupiedResources, booking.id, true);
    if (!conflict.available) {
      return res.status(409).json({
        error: `Cannot approve: Resource conflict on ${booking.date} (${booking.slot}). ${conflict.conflictReason}`,
      });
    }
  }

  booking.status = upper;
  booking.adminRemarks = remarks !== undefined ? remarks : booking.adminRemarks;
  booking.rejectionReason = rejectionReason !== undefined ? rejectionReason : booking.rejectionReason;
  booking.updatedAt = new Date().toISOString();
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

// Reschedule booking
apiRouter.patch("/bookings/:id/reschedule", requireAdminAuth, async (req: Request, res: Response) => {
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

  const admin = (req as any).adminSession;

  const conflict = checkResourceConflict(db, date, slot, booking.occupiedResources, booking.id);
  if (!conflict.available) {
    return res.status(409).json({
      error: `Cannot reschedule: Space conflict on ${date} (${slot}). ${conflict.conflictReason}`,
      conflictingResources: conflict.conflictingResources,
    });
  }

  const oldDate = booking.date;
  const oldSlot = booking.slot;

  booking.date = date;
  booking.slot = slot;
  booking.updatedAt = new Date().toISOString();
  booking.adminRemarks = `${booking.adminRemarks || ''}\nRescheduled from ${oldDate} (${oldSlot}) to ${date} (${slot}) by ${admin.email}. Reason: ${reason || 'Customer request'}`.trim();

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

// Cancel booking
apiRouter.post("/bookings/:id/cancel", requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason, refundAmount } = req.body;

  const db = await getDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: "Booking reference not found" });
  }

  const admin = (req as any).adminSession;
  booking.status = "CANCELLED";
  booking.rejectionReason = reason || "Cancelled by venue management / client request";
  booking.updatedAt = new Date().toISOString();

  if (refundAmount && Number(refundAmount) > 0) {
    const refundNum = Number(refundAmount);
    const refundPayment: PaymentTransaction = {
      id: `REF-${Date.now()}`,
      bookingId: id,
      amount: refundNum,
      paymentType: "refund",
      paymentMethod: "other",
      referenceNo: `REFUND-${Date.now()}`,
      receivedBy: admin.email,
      receiptNumber: `REF-${Date.now().toString().slice(-6)}`,
      notes: `Refund processed on cancellation: ${reason || ''}`,
      createdAt: new Date().toISOString(),
    };
    booking.payments.push(refundPayment);
    booking.amountPaid = booking.payments.reduce((sum, p) => sum + (p.paymentType === 'refund' ? -p.amount : p.amount), 0);
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

// Record payment
apiRouter.post("/bookings/:id/payment", requireAdminAuth, async (req: Request, res: Response) => {
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

  const admin = (req as any).adminSession;
  const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
  const newPayment: PaymentTransaction = {
    id: `PAY-${Date.now()}`,
    bookingId: id,
    amount: payAmount,
    paymentType,
    paymentMethod,
    referenceNo: referenceNo?.trim() || `OFFLINE-${Date.now()}`,
    receivedBy: admin.email,
    receiptNumber,
    notes: notes?.trim(),
    createdAt: new Date().toISOString(),
  };

  booking.payments.push(newPayment);
  booking.amountPaid = booking.payments.reduce((sum, p) => sum + (p.paymentType === 'refund' ? -p.amount : p.amount), 0);
  booking.balanceDue = Math.max(0, booking.totalAmount - booking.amountPaid);
  booking.paymentStatus = booking.balanceDue === 0 ? "fully_paid" : booking.amountPaid > 0 ? "advance_paid" : "unpaid";
  booking.updatedAt = new Date().toISOString();

  await persistDb();
  await logAudit(
    "PAYMENT_RECORDED",
    admin.email,
    "booking",
    id,
    `Payment of ₹${payAmount} (${paymentMethod.toUpperCase()}) recorded. Receipt: ${receiptNumber}`
  );

  res.json({
    success: true,
    booking,
    payment: newPayment,
  });
});

// Delete booking permanently from database
apiRouter.delete("/bookings/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDb();
  const index = db.bookings.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Booking reference not found" });
  }

  const deleted = db.bookings.splice(index, 1)[0];
  await persistDb();

  const admin = (req as any).adminSession;
  await logAudit(
    "BOOKING_DELETED",
    admin.email,
    "booking",
    id,
    `Booking permanently deleted for ${deleted.customerName} on ${deleted.date} (${deleted.slot}). Slot released.`
  );

  res.json({ success: true, message: "Booking permanently deleted", deletedId: id });
});

// Direct Custom Discount on Existing Booking
apiRouter.patch("/bookings/:id/discount", requireAdminAuth, async (req: Request, res: Response) => {
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
    discountAmount = Math.round((basePrice * val) / 100);
  } else {
    discountAmount = val;
  }
  discountAmount = Math.max(0, Math.min(basePrice, discountAmount));

  booking.originalAmount = basePrice;
  booking.discountAmount = discountAmount;
  booking.totalAmount = Math.max(0, basePrice - discountAmount);
  booking.balanceDue = Math.max(0, booking.totalAmount - (booking.amountPaid || 0));
  booking.paymentStatus = booking.balanceDue === 0 && booking.totalAmount > 0 ? "fully_paid" : (booking.amountPaid || 0) > 0 ? "advance_paid" : "unpaid";
  booking.updatedAt = new Date().toISOString();
  if (reason) {
    booking.adminRemarks = `${booking.adminRemarks || ""}\nManager Discount applied: ₹${discountAmount.toLocaleString("en-IN")}${reason ? ` (${reason})` : ""}`.trim();
  }

  await persistDb();

  const admin = (req as any).adminSession;
  await logAudit(
    "BOOKING_DISCOUNT_APPLIED",
    admin.email,
    "booking",
    id,
    `Applied discount of ₹${discountAmount} (${discountType}: ${discountValue})`
  );

  res.json({ success: true, booking });
});

// ==========================================
// 6. VENUE SETTINGS & AUDIT LOGS
// ==========================================
apiRouter.get("/settings", async (req: Request, res: Response) => {
  const db = await getDb();
  res.json(db.settings);
});

apiRouter.put("/settings", requireAdminAuth, async (req: Request, res: Response) => {
  const db = await getDb();
  const admin = (req as any).adminSession;

  db.settings = {
    ...db.settings,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  await persistDb();
  await logAudit("SETTINGS_UPDATED", admin.email, "settings", "general", "Updated venue operational settings");

  res.json({ success: true, settings: db.settings });
});

apiRouter.get("/audit-logs", requireAdminAuth, async (req: Request, res: Response) => {
  const db = await getDb();
  res.json(db.auditLogs);
});

apiRouter.get("/maintenance", async (req: Request, res: Response) => {
  const db = await getDb();
  res.json(db.maintenance);
});

apiRouter.post("/maintenance", requireAdminAuth, async (req: Request, res: Response) => {
  const db = await getDb();
  const admin = (req as any).adminSession;

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
    createdAt: new Date().toISOString(),
  };

  db.maintenance.unshift(newRecord);
  await persistDb();
  await logAudit("MAINTENANCE_CREATED", admin.email, "maintenance", newRecord.id, `Scheduled ${newRecord.title}`);

  res.json({ success: true, maintenance: newRecord });
});

// ==========================================
// 8. DISCOUNT COUPONS & OFFERS ENGINE
// ==========================================

apiRouter.get("/coupons", requireAdminAuth, async (req: Request, res: Response) => {
  const db = await getDb();
  res.json(db.coupons || []);
});

apiRouter.post("/coupons", requireAdminAuth, async (req: Request, res: Response) => {
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
      isActive,
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

    const admin = (req as any).adminSession;
    const now = new Date().toISOString();

    const newCoupon: DiscountCoupon = {
      id: `CPN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      code: cleanCode,
      title: title.trim(),
      description: description ? description.trim() : "",
      discountType: discountType === "percentage" ? "percentage" : "fixed",
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      minBookingAmount: minBookingAmount ? Number(minBookingAmount) : undefined,
      expiryDate,
      usageLimit: usageLimit !== undefined ? Number(usageLimit) : 0,
      usedCount: 0,
      perCustomerLimit: perCustomerLimit ? Number(perCustomerLimit) : 1,
      category: category || "general",
      specificCustomerPhone: specificCustomerPhone ? specificCustomerPhone.trim() : undefined,
      specificCustomerName: specificCustomerName ? specificCustomerName.trim() : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: admin?.email || "admin@hhevents.in",
      createdAt: now,
      updatedAt: now,
      usedBy: [],
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
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create coupon" });
  }
});

apiRouter.patch("/coupons/:id", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    db.coupons = db.coupons || [];

    const idx = db.coupons.findIndex((c) => c.id === id || c.code === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const c = db.coupons[idx];
    const admin = (req as any).adminSession;

    if (req.body.title !== undefined) c.title = req.body.title.trim();
    if (req.body.description !== undefined) c.description = req.body.description.trim();
    if (req.body.discountType !== undefined) c.discountType = req.body.discountType;
    if (req.body.discountValue !== undefined) c.discountValue = Number(req.body.discountValue);
    if (req.body.maxDiscountAmount !== undefined) c.maxDiscountAmount = req.body.maxDiscountAmount ? Number(req.body.maxDiscountAmount) : undefined;
    if (req.body.minBookingAmount !== undefined) c.minBookingAmount = req.body.minBookingAmount ? Number(req.body.minBookingAmount) : undefined;
    if (req.body.expiryDate !== undefined) c.expiryDate = req.body.expiryDate;
    if (req.body.usageLimit !== undefined) c.usageLimit = Number(req.body.usageLimit);
    if (req.body.perCustomerLimit !== undefined) c.perCustomerLimit = Number(req.body.perCustomerLimit);
    if (req.body.category !== undefined) c.category = req.body.category;
    if (req.body.specificCustomerPhone !== undefined) c.specificCustomerPhone = req.body.specificCustomerPhone ? req.body.specificCustomerPhone.trim() : undefined;
    if (req.body.specificCustomerName !== undefined) c.specificCustomerName = req.body.specificCustomerName ? req.body.specificCustomerName.trim() : undefined;
    if (req.body.isActive !== undefined) c.isActive = Boolean(req.body.isActive);

    c.updatedAt = new Date().toISOString();

    await persistDb();
    await logAudit(
      "COUPON_UPDATED",
      admin?.email || "admin@hhevents.in",
      "coupon",
      c.code,
      `Updated coupon ${c.code}`
    );

    res.json({ success: true, coupon: c });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update coupon" });
  }
});

apiRouter.delete("/coupons/:id", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    db.coupons = db.coupons || [];

    const idx = db.coupons.findIndex((c) => c.id === id || c.code === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const removed = db.coupons.splice(idx, 1)[0];
    const admin = (req as any).adminSession;

    await persistDb();
    await logAudit(
      "COUPON_DELETED",
      admin?.email || "admin@hhevents.in",
      "coupon",
      removed.code,
      `Deleted coupon ${removed.code}`
    );

    res.json({ success: true, removedCode: removed.code });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete coupon" });
  }
});

apiRouter.get("/coupons/public", async (req: Request, res: Response) => {
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);
  const publicCoupons = (db.coupons || [])
    .filter(
      (c) =>
        c.isActive &&
        c.category !== "client_exclusive" &&
        (!c.expiryDate || c.expiryDate >= today) &&
        (c.usageLimit === 0 || c.usedCount < c.usageLimit)
    )
    .map((c) => ({
      code: c.code,
      title: c.title,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscountAmount: c.maxDiscountAmount,
      minBookingAmount: c.minBookingAmount,
      category: c.category,
      expiryDate: c.expiryDate,
    }));

  res.json(publicCoupons);
});

apiRouter.post("/coupons/validate", async (req: Request, res: Response) => {
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

    const today = new Date().toISOString().slice(0, 10);
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
        message: `Minimum reservation package amount of ₹${coupon.minBookingAmount.toLocaleString("en-IN")} is required to apply this coupon.`,
      });
    }

    if (coupon.category === "client_exclusive" && coupon.specificCustomerPhone) {
      const rawClient = coupon.specificCustomerPhone.replace(/\D/g, "");
      const rawPhone = phone ? String(phone).replace(/\D/g, "") : "";
      const matches =
        rawPhone.length >= 10 &&
        rawClient.length >= 10 &&
        (rawPhone.endsWith(rawClient) || rawClient.endsWith(rawPhone));
      if (!matches) {
        return res.status(400).json({
          valid: false,
          message: `This coupon is exclusively reserved for client number Ending with ...${coupon.specificCustomerPhone.slice(-4)}. Please enter the matching client mobile in Step 4.`,
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
          message: `You have already redeemed this coupon the maximum allowed limit (${coupon.perCustomerLimit} time).`,
        });
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((rent * coupon.discountValue) / 100);
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
        category: coupon.category,
      },
    });
  } catch (err: any) {
    res.status(500).json({ valid: false, message: err.message || "Failed to validate coupon" });
  }
});

// ==========================================
// 7. REAL PHOTO MANAGER
// ==========================================
apiRouter.get("/photos", async (req: Request, res: Response) => {
  try {
    const fs = await import("fs/promises");
    const exists = await fs.stat(manifestPath).then(() => true).catch(() => false);
    if (exists) {
      const raw = await fs.readFile(manifestPath, "utf-8");
      return res.json(JSON.parse(raw));
    }
    res.json({ photos: {}, lastUpdated: new Date().toISOString() });
  } catch (err) {
    res.json({ photos: {}, lastUpdated: new Date().toISOString() });
  }
});

apiRouter.post("/photos/upload", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { slotId, dataUrl } = req.body;
    if (!slotId || !dataUrl) {
      return res.status(400).json({ error: "Missing slotId or dataUrl" });
    }

    const fs = await import("fs/promises");
    if (!fs.stat(photosDir).then(() => true).catch(() => false)) {
      await fs.mkdir(photosDir, { recursive: true });
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
    const filePath = path.join(photosDir, safeFilename);

    await fs.writeFile(filePath, buffer);
    const publicUrl = `/assets/venue/photos/${safeFilename}`;

    let manifest: { photos: Record<string, any>; lastUpdated: string } = {
      photos: {},
      lastUpdated: new Date().toISOString(),
    };

    try {
      const exists = await fs.stat(manifestPath).then(() => true).catch(() => false);
      if (exists) {
        manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
      }
    } catch (e) {}

    manifest.photos[slotId] = {
      url: publicUrl,
      filename: safeFilename,
      mimeType,
      uploadedAt: new Date().toISOString(),
    };
    manifest.lastUpdated = new Date().toISOString();

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

    res.json({
      success: true,
      slotId,
      url: publicUrl,
      filename: safeFilename,
    });
  } catch (err: any) {
    console.error("Failed to upload photo:", err);
    res.status(500).json({ error: err.message || "Failed to save photo" });
  }
});

apiRouter.delete("/photos/:slotId", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;
    const fs = await import("fs/promises");
    const exists = await fs.stat(manifestPath).then(() => true).catch(() => false);
    if (exists) {
      const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
      if (manifest.photos && manifest.photos[slotId]) {
        const fileToRemove = path.join(photosDir, manifest.photos[slotId].filename);
        await fs.unlink(fileToRemove).catch(() => {});
        delete manifest.photos[slotId];
        manifest.lastUpdated = new Date().toISOString();
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
      }
    }
    res.json({ success: true, slotId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to remove photo" });
  }
});

// ==========================================
// 8. CUSTOMER FORM INQUIRIES
// ==========================================
apiRouter.post("/inquiries", async (req: Request, res: Response) => {
  try {
    const { fullName, phone, email, topic, message } = req.body;
    if (!fullName || !phone) {
      return res.status(400).json({ error: "Full Name and Contact Phone are required." });
    }

    const db = await getDb();
    const inquiryId = `INQ-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const newInquiry: InquiryRecord = {
      id: inquiryId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      topic: topic || "General Hall Inquiry",
      message: (message || "").trim(),
      status: "new",
      submittedAt: now,
      updatedAt: now,
    };

    if (!db.inquiries) db.inquiries = [];
    db.inquiries.unshift(newInquiry);
    await persistDb();

    res.status(201).json({
      success: true,
      message: "Your inquiry has been received. Our executive manager will contact you promptly.",
      inquiry: newInquiry,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to submit inquiry: " + err.message });
  }
});

apiRouter.get("/inquiries", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    res.json(db.inquiries || []);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch inquiries: " + err.message });
  }
});

apiRouter.patch("/inquiries/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const db = await getDb();
  if (!db.inquiries) db.inquiries = [];
  const inq = db.inquiries.find((i) => i.id === id);
  if (!inq) {
    return res.status(404).json({ error: "Inquiry not found" });
  }

  if (status) inq.status = status;
  if (adminNotes !== undefined) inq.adminNotes = adminNotes;
  inq.updatedAt = new Date().toISOString();

  await persistDb();
  res.json({ success: true, inquiry: inq });
});

apiRouter.delete("/inquiries/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDb();
  if (!db.inquiries) db.inquiries = [];
  const idx = db.inquiries.findIndex((i) => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Inquiry not found" });
  }
  const deleted = db.inquiries.splice(idx, 1)[0];
  await persistDb();

  const admin = (req as any).adminSession;
  await logAudit("INQUIRY_DELETED", admin.email, "inquiry", id, `Deleted inquiry from ${deleted.fullName}`);
  res.json({ success: true, message: "Inquiry deleted permanently", deletedId: id });
});

// Dual mounting: mounts both on /api and root router so it works whether Vercel strips /api or not
app.use("/api", apiRouter);
app.use(apiRouter);

export default app;
