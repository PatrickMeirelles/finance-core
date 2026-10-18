import { comparePassword, hashPassword, tokenHash } from './hash.util';

describe('hash.util', () => {
  it('hashes and verifies passwords with bcrypt', async () => {
    const hash = await hashPassword('Str0ng!Pass');
    expect(hash).not.toBe('Str0ng!Pass');
    expect(hash.startsWith('$2')).toBe(true);
    await expect(comparePassword('Str0ng!Pass', hash)).resolves.toBe(true);
    await expect(comparePassword('wrong', hash)).resolves.toBe(false);
  });

  it('produces a deterministic SHA-256 digest for tokens', () => {
    const digest = tokenHash('abc');
    expect(digest).toHaveLength(64);
    expect(digest).toBe(tokenHash('abc'));
    expect(digest).not.toBe(tokenHash('abd'));
    expect(digest).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
