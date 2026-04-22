import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const iterations = 210000;
const keyLength = 32;
const digest = 'sha256';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('hex');

  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [strategy, iterationText, salt, hash] = storedHash.split('$');

  if (strategy !== 'pbkdf2' || !iterationText || !salt || !hash) {
    return false;
  }

  const parsedIterations = Number(iterationText);

  if (!Number.isInteger(parsedIterations) || parsedIterations < 1) {
    return false;
  }

  const expected = Buffer.from(hash, 'hex');
  const actual = pbkdf2Sync(password, salt, parsedIterations, expected.length, digest);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
