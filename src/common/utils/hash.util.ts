import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { BCRYPT_SALT_ROUNDS } from '../constants/security.constants';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Digest for opaque, high-entropy tokens (JWTs, reset tokens). SHA-256 is
 * enough here because the input is random, and it allows an indexed lookup
 * instead of comparing against every stored row.
 */
export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
