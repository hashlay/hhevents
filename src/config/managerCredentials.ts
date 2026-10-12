/**
 * Venue Management Credentials Configuration.
 * Note: Manager authentication is verified strictly on the server (/api/auth/login).
 * No administrative passwords or secrets are retained or verified client-side.
 */

export interface ManagerUser {
  email: string;
  name: string;
  role: string;
}

export const VENUE_ADMIN_INFO: ManagerUser = {
  email: 'hheventsconvention@gmail.com',
  name: 'Venue General Manager',
  role: 'owner',
};

// Backwards compatibility alias
export const MANAGER_CREDENTIALS = VENUE_ADMIN_INFO;
export const AUTHORIZED_MANAGER = VENUE_ADMIN_INFO;

/**
 * Normalizes phone numbers by stripping non-digits and resolving standard 10-digit formats.
 * Handles '+91', spaces, hyphens, and leading zeros safely.
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.trim().replace(/\D/g, '');
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}
