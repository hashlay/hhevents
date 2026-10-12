# Business Decisions & Operational Questions
## H H Events & Conventions
**Location:** Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal, Karnataka 574231  
**Status:** Pending Business Confirmation  

---

The system architecture has been designed to be fully configurable. To calibrate the production rules accurately to your routine business operations, the following decisions must be reviewed and confirmed:

---

### 1. Physical Hall Layout & Resource Inventory
- [ ] **Dual Hall Independence:** Does "Single Hall" refer interchangeably to either **Hall 1** or **Hall 2**, or are Hall 1 (Gents) and Hall 2 (Ladies) physically distinct wings that can both be rented separately on the exact same date and session?
- [ ] **Dining Wings:** Are there two separate dining areas (e.g. Gents Dining and Ladies Dining, or Dining Hall A and Dining Hall B)? When a customer books "Single Dining + Kitchen" (₹15,000), does that leave the second dining area available for another party?
- [ ] **Guest Capacities:** What are the official seating and floating capacities for:
  - Full Hall (Gents + Ladies): *(Currently estimated at 1,500–3,000)*
  - Single Hall: *(Currently estimated at 400–800)*
  - Dining Area (per section): *(Currently estimated at 300–600)*

---

### 2. The 8 Advertised Packages & Resource Occupancy
The official tariff card lists 8 packages:
1. **Full AC Hall** — ₹65,000
2. **Full Non AC Hall** — ₹45,000
3. **Single AC Hall** — ₹30,000
4. **Single AC Hall – II** — ₹45,000
5. **Single Non AC Hall** — ₹25,000
6. **Single Non AC Hall – II** — ₹30,000
7. **Single Dining + Kitchen** — ₹15,000
8. **Double Dining + Kitchen** — ₹20,000

- [ ] **Difference between Single Hall and Single Hall-II:**
  - `Single AC Hall` (₹30,000) includes **Single Hall + Single Dining + Kitchen**.
  - `Single AC Hall-II` (₹45,000) includes **Single Hall + Double Dining + Kitchen**.
  - Please confirm: Does Single Hall-II occupy **both** dining wings while keeping one hall free for another potential booking?
- [ ] **Concurrent Bookings:** If Client A books "Single AC Hall" (Single Hall + Single Dining), can Client B book the second Single Hall + second Dining for the exact same session?

---

### 3. Weekday vs Weekend Pricing
The uploaded price card states: *"All Sunday, Monday & Thursday"*.
- [ ] Are the advertised prices valid **only** on Sundays, Mondays, and Thursdays?
- [ ] What are the rental rates for **Tuesdays, Wednesdays, Fridays, and Saturdays**?
- [ ] Are Friday and Saturday rates higher or lower, or is the same pricing applied across all 7 days unless specifically overridden?

---

### 4. Booking Time Slots & Session Durations
- [ ] **Standard Session Hours:**
  - Day Session: `10:00 AM – 3:00 PM`
  - Evening Session: `6:00 PM – 10:00 PM`
- [ ] Are full-day bookings (both sessions combined) permitted? If so, is the price the sum of both sessions or is a package discount applied?
- [ ] What is the grace period allowed for event setup (decorations/catering arrival) prior to session start?

---

### 5. Advance Payment & Booking Status Workflow
- [ ] **Booking Approval Model:** Does every online booking request start in `PENDING` status awaiting manual owner review before dates are confirmed, or should an online advance payment automatically confirm the booking?
- [ ] **Advance Deposit Amount:** What is the required advance booking token?
  - Fixed amount (e.g. ₹10,000 / ₹20,000)?
  - Percentage (e.g. 25% or 50% of the total package rent)?
- [ ] **Payment Deadline for Holds:** How many days/hours does an applicant have to remit the advance before a temporary hold expires and releases the date?

---

### 6. Cancellation & Refund Policy
- [ ] What is the refund policy if an applicant cancels a confirmed event?
  - > 30 days before event: Full / Partial / No refund?
  - 15–30 days before event: Percentage withheld?
  - < 15 days before event: Non-refundable?
- [ ] Can dates be rescheduled to an alternate open date without financial penalty?

---

### 7. Taxes & Invoicing Requirements
- [ ] Are the advertised package rates inclusive of GST, or is GST (18% for convention hall rental) added on top?
- [ ] What is the registered legal business name and GSTIN to be displayed on official printable invoices and receipts?
  - Business Name: *H H Events & Conventions*
  - GSTIN: *(To be provided by owner)*
  - PAN: *(To be provided by owner)*

---

### 8. Staff Roles & Administrative Permissions
- [ ] Who should have access to the Administrative Console?
  - **Owner / Super Admin:** Full authority over pricing, settings, booking approvals, payment ledger, and user accounts.
  - **Manager:** Authority to review booking requests, mark availability blackouts, record payments, and view calendar.
  - **Staff / Reception:** Read-only calendar access and customer lookup.
- [ ] What are the primary administrator email accounts to be granted Owner access?

---

### 9. Customer Notifications & Messaging
- [ ] Should booking confirmations and payment acknowledgments be sent via:
  - Direct WhatsApp links (pre-filled message to the venue or applicant)?
  - Automated WhatsApp Cloud API?
  - SMS gateway (e.g. Fast2SMS / Twilio)?
  - Automated Email notifications (e.g. SendGrid / Resend / Nodemailer)?
