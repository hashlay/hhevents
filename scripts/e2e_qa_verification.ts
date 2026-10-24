/**
 * HH Events & Conventions — End-to-End Functional QA & Security Test Suite
 * Executes real scenarios against live running server http://localhost:3000
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  scenario: string;
  phase: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function record(phase: string, scenario: string, passed: boolean, details: string) {
  const status = passed ? 'PASS' : 'FAIL';
  results.push({ phase, scenario, status, details });
  console.log(`[${status}] [${phase}] ${scenario}: ${details}`);
}

async function runQA() {
  console.log('====================================================');
  console.log('Starting HH Events End-to-End QA & Security Test Run');
  console.log('Target Server:', BASE_URL);
  console.log('====================================================\n');

  let adminToken = '';
  let testBookingId = '';
  const testPhone = '9876543211';
  const testCustomer = 'Dr. Salman Khan';
  const randDay = Math.floor(10 + Math.random() * 15);
  const testDate = `2027-02-${randDay}`;
  const rescheduleDate = `2027-02-${randDay + 2}`;

  // -------------------------------------------------------------------------
  // PHASE A: SECURITY CORRECTIONS
  // -------------------------------------------------------------------------
  console.log('--- PHASE A: SECURITY TESTS ---');

  // A.1 Health Check
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    record('Phase A', 'A.1 Health Check', res.ok && data.status === 'ok', `Venue: ${data.venue}`);
  } catch (err: any) {
    record('Phase A', 'A.1 Health Check', false, err.message);
  }

  // A.2 Unauthorized Access to Admin Endpoints Denied
  try {
    const resBookings = await fetch(`${BASE_URL}/api/bookings`);
    const resPackages = await fetch(`${BASE_URL}/api/packages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packages: [] }),
    });
    const resPhoto = await fetch(`${BASE_URL}/api/photos/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId: 'test', dataUrl: 'invalid' }),
    });

    const isSecure = resBookings.status === 401 && resPackages.status === 401 && resPhoto.status === 401;
    record(
      'Phase A',
      'A.2 Admin API Route Protection (401 Enforced)',
      isSecure,
      `Bookings: ${resBookings.status}, Packages PUT: ${resPackages.status}, Photo Upload: ${resPhoto.status}`
    );
  } catch (err: any) {
    record('Phase A', 'A.2 Admin API Route Protection', false, err.message);
  }

  // A.3 Invalid Credentials Rejected
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake@admin.com', phone: '0000000000', password: 'WrongPassword' }),
    });
    record('Phase A', 'A.3 Invalid Credentials Rejection', res.status === 401, `Status: ${res.status}`);
  } catch (err: any) {
    record('Phase A', 'A.3 Invalid Credentials Rejection', false, err.message);
  }

  // A.4 Legitimate Manager Authentication
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hheventsconvention@gmail.com',
        phone: '9448151878',
        password: 'HHEvents@Manager2026',
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      adminToken = data.token;
      record('Phase A', 'A.4 Manager Authentication Succeeded', true, `Token issued for ${data.user.email}`);
    } else {
      record('Phase A', 'A.4 Manager Authentication Succeeded', false, `Failed: ${JSON.stringify(data)}`);
    }
  } catch (err: any) {
    record('Phase A', 'A.4 Manager Authentication Succeeded', false, err.message);
  }

  // A.5 Session Verification Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record('Phase A', 'A.5 Session Verification', res.ok && data.authenticated === true, `Role: ${data.user?.role}`);
  } catch (err: any) {
    record('Phase A', 'A.5 Session Verification', false, err.message);
  }

  // -------------------------------------------------------------------------
  // PHASE C: VERIFY ALL EIGHT PACKAGES
  // -------------------------------------------------------------------------
  console.log('\n--- PHASE C: VERIFY 8 PACKAGES ---');
  try {
    const res = await fetch(`${BASE_URL}/api/packages`);
    const packages: any[] = await res.json();

    const expected = [
      { id: 'full-ac-hall', name: 'Full AC Hall', rent: 65000 },
      { id: 'full-non-ac-hall', name: 'Full Non AC Hall', rent: 45000 },
      { id: 'single-ac-hall', name: 'Single AC Hall', rent: 30000 },
      { id: 'single-ac-hall-ii', name: 'Single AC Hall-II', rent: 45000 },
      { id: 'single-non-ac-hall', name: 'Single Non AC Hall', rent: 25000 },
      { id: 'single-non-ac-hall-ii', name: 'Single Non AC Hall -II', rent: 30000 },
      { id: 'single-dining', name: 'Single Dining', rent: 15000 },
      { id: 'double-dining', name: 'Double Dining', rent: 20000 },
    ];

    let allMatch = packages.length === 8;
    const mismatches: string[] = [];

    for (const exp of expected) {
      const found = packages.find((p) => p.id === exp.id);
      if (!found) {
        allMatch = false;
        mismatches.push(`Missing ${exp.id}`);
      } else if (found.rent !== exp.rent) {
        allMatch = false;
        mismatches.push(`${exp.id} rent mismatch: got ${found.rent}, expected ${exp.rent}`);
      }
    }

    record(
      'Phase C',
      'C.1 Eight Official Packages Price & Registry Match',
      allMatch,
      allMatch ? `All 8 packages verified with exact prices.` : `Mismatches: ${mismatches.join('; ')}`
    );
  } catch (err: any) {
    record('Phase C', 'C.1 Eight Official Packages Price & Registry Match', false, err.message);
  }

  // -------------------------------------------------------------------------
  // PHASE B: COMPLETE BOOKING FUNCTIONALITY TESTING
  // -------------------------------------------------------------------------
  console.log('\n--- PHASE B: BOOKING WORKFLOW & CONFLICT ENGINE ---');

  // B.1 & B.2: Customer Submits Booking Request
  try {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: testCustomer,
        phone: testPhone,
        email: 'salman@example.com',
        packageId: 'single-ac-hall',
        hallSelection: 'hall_1',
        acOption: 'ac',
        date: testDate,
        slot: 'day',
        expectedAttendees: 500,
        additionalInfo: 'E2E Automated Functional QA Verification',
        eventType: 'wedding',
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.booking?.id) {
      testBookingId = data.booking.id;
      record('Phase B', 'B.1 & B.2 Customer Submits Booking Request', true, `Created Booking ID: ${testBookingId}`);
    } else {
      record('Phase B', 'B.1 & B.2 Customer Submits Booking Request', false, JSON.stringify(data));
    }
  } catch (err: any) {
    record('Phase B', 'B.1 & B.2 Customer Submits Booking Request', false, err.message);
  }

  // B.3: Booking appears in Admin Dashboard
  try {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bookings: any[] = await res.json();
    const found = bookings.find((b) => b.id === testBookingId);
    record(
      'Phase B',
      'B.3 Booking Appears in Admin Dashboard',
      !!found && found.status === 'PENDING',
      found ? `Found ${found.id} with status ${found.status}` : 'Not found in admin list'
    );
  } catch (err: any) {
    record('Phase B', 'B.3 Booking Appears in Admin Dashboard', false, err.message);
  }

  // B.6: Customer Checks Booking Status (Tracking)
  try {
    const res = await fetch(`${BASE_URL}/api/bookings/track?id=${testBookingId}&phone=${testPhone}`);
    const data = await res.json();
    const ok = res.ok && data.id === testBookingId && data.status === 'PENDING';
    record('Phase B', 'B.6 Customer Tracking Lookup', ok, `Customer tracking returned status: ${data.status}`);
  } catch (err: any) {
    record('Phase B', 'B.6 Customer Tracking Lookup', false, err.message);
  }

  // B.4: Admin Approves the Request
  try {
    const res = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'APPROVED', remarks: 'Clearance granted by general manager' }),
    });
    const data = await res.json();
    record('Phase B', 'B.4 Admin Approves Request', res.ok && data.booking?.status === 'APPROVED', `Status: ${data.booking?.status}`);
  } catch (err: any) {
    record('Phase B', 'B.4 Admin Approves Request', false, err.message);
  }

  // B.5: Live Availability Calendar Updates
  try {
    const res = await fetch(`${BASE_URL}/api/availability`);
    const data = await res.json();
    const occupied = data.bookings.find((b: any) => b.date === testDate && b.slot === 'day');
    record(
      'Phase B',
      'B.5 Live Availability Updates to Occupied',
      !!occupied && occupied.id === testBookingId,
      occupied ? `Occupied resources on ${testDate}: ${occupied.occupiedResources?.join(', ')}` : 'Not reflected in availability'
    );
  } catch (err: any) {
    record('Phase B', 'B.5 Live Availability Updates', false, err.message);
  }

  // B.9 & B.10: Conflicting Booking Attempt is Prevented (409 Conflict)
  try {
    const resConflict = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Conflicting Applicant',
        phone: '9998887776',
        packageId: 'full-ac-hall',
        hallSelection: 'both',
        date: testDate,
        slot: 'day',
      }),
    });
    const dataConflict = await resConflict.json();
    record(
      'Phase B',
      'B.9 & B.10 Conflicting Booking Prevented (409 Conflict)',
      resConflict.status === 409,
      `Status: ${resConflict.status}, Reason: ${dataConflict.error}`
    );
  } catch (err: any) {
    record('Phase B', 'B.9 & B.10 Conflicting Booking Prevented', false, err.message);
  }

  // B.7: Admin Reschedules the Booking
  try {
    const res = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/reschedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ date: rescheduleDate, slot: 'evening', reason: 'Customer requested evening session' }),
    });
    const data = await res.json();
    const ok = res.ok && data.booking?.date === rescheduleDate && data.booking?.slot === 'evening';
    record('Phase B', 'B.7 Admin Reschedules Booking', ok, `Rescheduled to ${data.booking?.date} (${data.booking?.slot})`);

    // Verify original date testDate is now free
    const resAvail = await fetch(`${BASE_URL}/api/availability`);
    const availData = await resAvail.json();
    const stillOccupiedOld = availData.bookings.find((b: any) => b.date === testDate && b.slot === 'day');
    record(
      'Phase B',
      'B.7b Old Date Released After Rescheduling',
      !stillOccupiedOld,
      stillOccupiedOld ? 'Old date still occupied!' : `Old date ${testDate} day session is now free.`
    );
  } catch (err: any) {
    record('Phase B', 'B.7 Admin Reschedules Booking', false, err.message);
  }

  // -------------------------------------------------------------------------
  // PHASE D: PAYMENTS AND FINANCIAL RECORDS
  // -------------------------------------------------------------------------
  console.log('\n--- PHASE D: PAYMENTS & FINANCIAL RECORDS ---');

  // D.1 Advance Payment Recording
  try {
    const res = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        amount: 7500,
        paymentType: 'advance',
        paymentMethod: 'upi',
        referenceNo: 'UPI-TEST-QA-1001',
        notes: 'Initial 25% token advance remittance',
      }),
    });
    const data = await res.json();
    const ok =
      res.ok &&
      data.booking?.amountPaid === 7500 &&
      data.booking?.balanceDue === 22500 &&
      data.booking?.paymentStatus === 'advance_paid';
    record(
      'Phase D',
      'D.1 Advance Payment Recording & Ledger Calc',
      ok,
      `Paid: ₹${data.booking?.amountPaid}, Due: ₹${data.booking?.balanceDue}, Receipt: ${data.payment?.receiptNumber}`
    );
  } catch (err: any) {
    record('Phase D', 'D.1 Advance Payment Recording', false, err.message);
  }

  // D.2 Partial Balance Payment Recording
  try {
    const res = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        amount: 10000,
        paymentType: 'balance',
        paymentMethod: 'cash',
        referenceNo: 'CASH-REC-002',
        notes: 'Partial payment on decor selection',
      }),
    });
    const data = await res.json();
    const ok =
      res.ok &&
      data.booking?.amountPaid === 17500 &&
      data.booking?.balanceDue === 12500 &&
      data.booking?.payments?.length === 2;
    record(
      'Phase D',
      'D.2 Partial Payment & Cumulative Balance',
      ok,
      `Cumulative Paid: ₹${data.booking?.amountPaid}, Remaining Balance: ₹${data.booking?.balanceDue}, Tx Count: ${data.booking?.payments?.length}`
    );
  } catch (err: any) {
    record('Phase D', 'D.2 Partial Payment & Cumulative Balance', false, err.message);
  }

  // B.8 & D.3: Admin Cancels Booking with Refund
  try {
    const res = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        reason: 'Client requested cancellation due to family rescheduling',
        refundAmount: 5000,
      }),
    });
    const data = await res.json();
    const ok = res.ok && data.booking?.status === 'CANCELLED';
    record('Phase B/D', 'B.8 & D.3 Cancellation & Refund Recorded', ok, `Status: ${data.booking?.status}, Reason: ${data.booking?.rejectionReason}`);

    // Verify slot is released after cancellation
    const resAvail = await fetch(`${BASE_URL}/api/availability`);
    const availData = await resAvail.json();
    const stillOccupied = availData.bookings.find((b: any) => b.id === testBookingId);
    record(
      'Phase B',
      'B.8b Cancelled Booking Space Released in Calendar',
      !stillOccupied,
      stillOccupied ? 'Space still held by cancelled booking!' : 'Space successfully released in calendar.'
    );
  } catch (err: any) {
    record('Phase B/D', 'B.8 & D.3 Cancellation & Refund Recorded', false, err.message);
  }

  // B.12: Data Consistency Across Query Endpoints
  try {
    const resTrack = await fetch(`${BASE_URL}/api/bookings/track?id=${testBookingId}&phone=${testPhone}`);
    const trackData = await resTrack.json();
    const consistent = trackData.id === testBookingId && trackData.status === 'CANCELLED';
    record(
      'Phase B',
      'B.12 Consistency Across Endpoints & State Persistence',
      consistent,
      consistent ? `Tracking reflects final CANCELLED status consistently.` : 'State inconsistent.'
    );
  } catch (err: any) {
    record('Phase B', 'B.12 Consistency Across Endpoints', false, err.message);
  }

  console.log('\n====================================================');
  console.log('SUMMARY OF RESULTS:');
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total Scenarios Executed: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runQA().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
