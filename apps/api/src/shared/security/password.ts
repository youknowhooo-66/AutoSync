import { compare, getRounds, hash } from 'bcryptjs';

/**
 * bcrypt cost. 12 keeps a login around 200-300ms on a small VPS: slow enough to
 * make offline cracking expensive, fast enough for ~50 interactive users.
 */
export const PASSWORD_COST = 12;

// Hash of a random string; compared against when the email does not exist so the
// response time does not reveal which emails are registered.
const DUMMY_HASH = '$2b$12$Sq3R1dabxscF1UL9y4KVTO0cWtWKaB0YlBQxLGUOof1bP78q/9jz2';

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, PASSWORD_COST);
}

/** Always runs one bcrypt comparison, even when there is no stored hash. */
export async function verifyPassword(plain: string, stored: string | null | undefined): Promise<boolean> {
  const matched = await compare(plain, stored || DUMMY_HASH);
  return Boolean(stored) && matched;
}

/** True for hashes made with a lower cost, so they can be upgraded on the next login. */
export function needsRehash(stored: string): boolean {
  try {
    return getRounds(stored) < PASSWORD_COST;
  } catch {
    return true;
  }
}
