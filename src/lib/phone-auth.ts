import { normaliseSaMobile } from "./format";

/**
 * Prototype sign-in: phone number + 6-digit PIN on top of Supabase email/password auth.
 * Each number maps to a hidden login address on this subdomain; the PIN is its password.
 * The subdomain must never get mail (MX) records, so nothing is ever delivered there.
 */
export const PHONE_LOGIN_DOMAIN = "phone.kasipool.co.za";

/** "072 123 4567" -> "27721234567@phone.kasipool.co.za", or null if not a valid SA mobile. */
export function phoneToLogin(input: string): string | null {
  const mobile = normaliseSaMobile(input);
  return mobile ? `${mobile.slice(1)}@${PHONE_LOGIN_DOMAIN}` : null;
}

/** The +27 number behind a hidden login address, or null for any other address. */
export function loginToPhone(email: string | null | undefined): string | null {
  const m = email?.toLowerCase().match(/^(27\d{9})@(.+)$/);
  return m && m[2] === PHONE_LOGIN_DOMAIN ? `+${m[1]}` : null;
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}
