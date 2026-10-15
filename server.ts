import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getDb, persistDb, logAudit, BookingRecord, PaymentTransaction, HallPackage } from "./server/db";
import { resolveRequiredResources, checkResourceConflict } from "./server/conflictEngine";
import {
  verifyCredentials,
  createSession,
  getSession,
  revokeSession,
  requireAdminAuth,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
} from "./server/auth";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  const photosDir = path.join(process.cwd(), "public", "assets", "venue", "photos");
  const manifestPath = path.join(photosDir, "manifest.json");

  // Ensure photos directory exists
  try {
    const fs = await import("fs");
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }
  } catch (err) {
    console.error("Error creating photos directory:", err);
  }

  // ==========================================
  // 1. HEALTH & SYSTEM ENDPOINTS
  // ==========================================
  app.get("/api/health", async (req, res) => {
    const db = await getDb();
    res.json({
      status: "ok",
      venue: db.settings.name,
      location: db.settings.address,
      packagesCount: db.packages.length,
      bookingsCount: db.bookings.length,
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // 2. AUTHENTICATION ENDPOINTS (SERVER-ENFORCED WITH RATE LIMITING)
  // ==========================================
  app.post("/api/auth/login", async (req, res) => {
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

  app.get("/api/auth/session", (req, res) => {
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

  app.post("/api/auth/logout", async (req, res) => {
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
  app.get("/api/packages", async (req, res) => {
    const db = await getDb();
    const sorted = [...db.packages].sort((a, b) => a.displayOrder - b.displayOrder);
    res.json(sorted);
  });

  app.put("/api/packages", requireAdminAuth, async (req, res) => {
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

  // ==========================================
  // 4. LIVE AVAILABILITY & CALENDAR
  // ==========================================
  app.get("/api/availability", async (req, res) => {
    const { month, year } = req.query;
    const db = await getDb();

    // Generate date map with status for Hall 1, Hall 2, and Both
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

  app.post("/api/availability/blackout", requireAdminAuth, async (req, res) => {
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

  app.delete("/api/availability/blackout/:id", requireAdminAuth, async (req, res) => {
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
  // 5. CONCURRENCY-SAFE BOOKING CREATION & TRACKING
  // ==========================================
  app.post("/api/bookings", async (req, res) => {
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

      // Concurrency conflict check
      const conflict = checkResourceConflict(db, date, slot, requiredResources);
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

      const newBooking: BookingRecord = {
        id: bookingId,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: (email || "").trim(),
        packageId: packageId || (hallSelection === "both" ? "full-ac-hall" : "single-ac-hall"),
        packageName: pkgName,
        packagePrice: pkgRent,
        occupiedResources: requiredResources,
        hallSelection,
        acOption: acOption || "ac",
        date,
        slot,
        expectedAttendees: expectedAttendees ? Number(expectedAttendees) : undefined,
        additionalInfo: additionalInfo?.trim(),
        eventType: eventType || "wedding",
        status: "PENDING",
        totalAmount: pkgRent,
        advanceRequired: Math.round(pkgRent * 0.25), // 25% standard token advance
        amountPaid: 0,
        balanceDue: pkgRent,
        paymentStatus: "unpaid",
        payments: [],
        submittedAt: now,
        updatedAt: now,
      };

      db.bookings.unshift(newBooking);
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
  app.get("/api/bookings/track", async (req, res) => {
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

    // Sanitized customer tracking projection
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

  // Get all bookings (admin view with full details)
  app.get("/api/bookings", requireAdminAuth, async (req, res) => {
    const db = await getDb();
    res.json(db.bookings);
  });

  // Update booking status (Approve / Reject / Cancel)
  app.patch("/api/bookings/:id/status", requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    const { status, remarks, rejectionReason } = req.body;

    const db = await getDb();
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) {
      return res.status(404).json({ error: "Booking reference not found" });
    }

    const admin = (req as any).adminSession;
    const upper = (status || "").toUpperCase();

    // If APPROVING or CONFIRMING: revalidate concurrency conflict!
    if (upper === "APPROVED" || upper === "CONFIRMED") {
      const conflict = checkResourceConflict(db, booking.date, booking.slot, booking.occupiedResources, booking.id);
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

  // Reschedule booking with concurrency-safe conflict verification
  app.patch("/api/bookings/:id/reschedule", requireAdminAuth, async (req, res) => {
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

    // Verify conflict on the new target date and slot
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

  // Cancel booking and release reserved physical resources
  app.post("/api/bookings/:id/cancel", requireAdminAuth, async (req, res) => {
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

  // Record payment in payment ledger
  app.post("/api/bookings/:id/payment", requireAdminAuth, async (req, res) => {
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

  // ==========================================
  // 6. VENUE SETTINGS & AUDIT LOGS
  // ==========================================
  app.get("/api/settings", async (req, res) => {
    const db = await getDb();
    res.json(db.settings);
  });

  app.put("/api/settings", requireAdminAuth, async (req, res) => {
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

  app.get("/api/audit-logs", requireAdminAuth, async (req, res) => {
    const db = await getDb();
    res.json(db.auditLogs);
  });

  app.get("/api/maintenance", async (req, res) => {
    const db = await getDb();
    res.json(db.maintenance);
  });

  app.post("/api/maintenance", requireAdminAuth, async (req, res) => {
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
  // 7. REAL PHOTO MANAGER
  // ==========================================
  app.get("/api/photos", async (req, res) => {
    try {
      const fs = await import("fs/promises");
      const exists = await fs.stat(manifestPath).then(() => true).catch(() => false);
      if (exists) {
        const raw = await fs.readFile(manifestPath, "utf-8");
        return res.json(JSON.parse(raw));
      }
      res.json({ photos: {}, lastUpdated: new Date().toISOString() });
    } catch (err) {
      console.error("Failed to read photo manifest:", err);
      res.json({ photos: {}, lastUpdated: new Date().toISOString() });
    }
  });

  app.post("/api/photos/upload", requireAdminAuth, async (req, res) => {
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

  app.delete("/api/photos/:slotId", requireAdminAuth, async (req, res) => {
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
  // 8. SPA ROUTING (VITE / STATIC DIST)
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`H H Events & Conventions server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
