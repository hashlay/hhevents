# Master Implementation Plan
## H H Events & Conventions Hall Booking and Event Management Platform

---

## Architecture Principles
1. **Never use `localStorage` as the authoritative source of truth for operational business data.**
2. **Never expose administrative passwords or secrets in the client bundle.**
3. **Atomic, concurrency-safe resource locking** to ensure zero double bookings across devices.
4. **Preserve existing working features** while upgrading data plumbing and visual aesthetics.
5. **Strict adherence to the official Deep Emerald & Champagne Gold design palette.**

---

## Phase Breakdown & Milestones

### Phase 1 — Critical Security, Shared Database & Concurrency-Safe Booking Engine (P0)
- **Goal:** Eliminate hardcoded credentials, provide server-enforced authentication, migrate bookings and availability to shared persistent storage, and implement concurrency-safe resource conflict prevention.
- **Key Tasks:**
  1. Remove hardcoded plaintext password and client-side credential verification from `managerCredentials.ts` and `AuthContext.tsx`.
  2. Implement secure server-backed authentication endpoints on Express (`/api/auth/login`, `/api/auth/session`, `/api/auth/logout`) with role claims (`owner`, `manager`, `staff`).
  3. Implement persistent server-side storage service (JSON/SQLite file-backed persistent repository with atomic transaction locking) ensuring data synchronizes across any device or browser tab, with optional Firestore synchronization.
  4. Design resource-based inventory model:
     - `gents_hall` (Gents Hall)
     - `ladies_hall` (Ladies Hall)
     - `dining_1` (Dining Section 1)
     - `dining_2` (Dining Section 2)
     - `kitchen` (Catering Kitchen)
  5. Implement atomic slot reservation barrier with mutex locking to guarantee no two concurrent requests can reserve overlapping physical spaces for the same date and slot.
  6. Clean and update Firestore security rules in `firestore.rules`.
- **Verification:** Run multi-client concurrent booking simulation; verify that conflicting requests are blocked with 100% reliability, and admin changes on one browser appear instantly on another.

---

### Phase 2 — Official 8-Package & Dynamic Pricing Engine (P1)
- **Goal:** Allow the owner to manage the 8 official packages dynamically, map each package to its physical resources, and support configurable weekday/seasonal pricing rules.
- **Key Tasks:**
  1. Create dynamic `HallPackage` schema and persistent repository for all 8 official packages:
     - Full AC Hall (₹65,000)
     - Full Non AC Hall (₹45,000)
     - Single AC Hall (₹30,000)
     - Single AC Hall – II (₹45,000)
     - Single Non AC Hall (₹25,000)
     - Single Non AC Hall – II (₹30,000)
     - Single Dining + Kitchen (₹15,000)
     - Double Dining + Kitchen (₹20,000)
  2. Map each package to its required physical resources in the concurrency engine.
  3. Build Admin Package Management interface (add, edit rate, toggle visibility, adjust inclusions).
  4. Ensure historical bookings preserve their snapshot package details and price even if packages are edited subsequently.
  5. Connect pricing engine to calculate weekday rates, seasonal adjustments, and optional service fees transparently.
- **Verification:** Create/edit packages in admin; verify pricing reflects accurately across public tariff and booking pages without breaking historical records.

---

### Phase 3 — Customer Booking & Tracking Experience (P1)
- **Goal:** Provide a seamless, luxurious multi-step booking process and reliable cross-device booking tracking.
- **Key Tasks:**
  1. Upgrade `BookPage.tsx` to a guided 6-step flow:
     - Step 1: Date & Session (Day / Evening)
     - Step 2: Package Selection (from the 8 official packages, with inclusions and capacity highlights)
     - Step 3: Climate Option (AC vs Non-AC, pre-selected based on package)
     - Step 4: Host Details & Guest Count
     - Step 5: Summary, Terms & Transparent Price Breakdown
     - Step 6: Confirmation & Unique Reference (`HH-2026-XXXXXX`)
  2. Upgrade `AvailabilityPage.tsx` and `AvailabilityCalendar.tsx` to query live shared availability from the server.
  3. Upgrade `TrackBookingPage.tsx` to query the shared backend by Reference Number and Customer Phone Number.
  4. Provide pre-filled WhatsApp direct inquiry triggers for customer convenience.
- **Verification:** Complete booking on mobile viewport; verify booking reference is generated, status is `PENDING`, and details can be tracked instantly on any other device.

---

### Phase 4 — Owner & Admin Operations Hub (P1)
- **Goal:** Transform the admin dashboard into a comprehensive, routine operational management portal.
- **Key Tasks:**
  1. Real-time Dashboard Overview displaying true database metrics: Total Bookings, Today's Events, Pending Requests, Confirmed Bookings, and Revenue Ledger.
  2. Booking Management in `AdminRequestsPage.tsx`: Search, filter, approve, reject with reason, cancel, reschedule, and manual reservation creation.
  3. Revalidate resource availability upon booking approval or rescheduling.
  4. Master Calendar in `AdminCalendarPage.tsx`: Interactive monthly/weekly view showing confirmed, pending, and maintenance blocks with resource occupancy badges.
  5. Payment Ledger: Record advance payments, payment methods (Cash, UPI, Bank Transfer), transaction IDs, and calculate outstanding balances.
  6. Printable Invoice & Receipt Generator: Clean, professional printable receipt with venue branding, booking reference, customer coordinates, and payment breakdown.
  7. Audit Logging: Persistent chronological log of all administrative actions.
- **Verification:** Perform complete booking lifecycle: receive request -> approve -> record ₹20,000 advance payment -> print receipt -> verify metrics update in real-time.

---

### Phase 5 — Premium UI/UX Redesign (Deep Emerald & Champagne Gold) (P2)
- **Goal:** Give the website a refined, prestigious convention-centre identity.
- **Key Tasks:**
  1. Update design tokens in `index.css`:
     - Deep Emerald: `#173D35`
     - Champagne Gold: `#C9AA72`
     - Warm Cream: `#F5F1E8`
     - Charcoal: `#252525`
  2. Redesign Navbar and Footer with Deep Emerald navigation and refined Champagne Gold accents.
  3. Redesign Homepage: Hero section with clear typography, verified venue highlights, and direct CTAs.
  4. Redesign Package Cards on `/pricing` and `/book` with clean comparative cards.
  5. Polish Admin Portal: Clean, efficient business styling without wedding script typography.
  6. Verify responsive behavior across mobile (375px), tablet (768px), and desktop (1280px+).
- **Verification:** Visual check across all pages; verify color contrast, typography consistency, and responsive responsiveness.

---

### Phase 6 — Production Readiness, Testing & Handover (P0/P2)
- **Goal:** Ensure zero compile or runtime defects, optimize performance, and document deployment.
- **Key Tasks:**
  1. End-to-end integration tests for booking, availability, and concurrency.
  2. Type checking with `tsc --noEmit` and build verification with `vite build`.
  3. Prepare `.env.production` guidelines and Express deployment configuration.
  4. Write comprehensive Owner Usage Guide and System Handover Documentation.
- **Verification:** Clean production build; all automated checks passing; complete documentation delivered.
