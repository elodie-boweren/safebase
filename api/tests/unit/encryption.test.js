const { encrypt, decrypt } = require('../../encryption');

// SEC-01: the password of a registered database is never stored in plain text
describe('encryption', () => {
  test('the encrypted value does not contain the password', () => {
    const encrypted = encrypt('safebasepass');

    expect(encrypted).not.toContain('safebasepass');
    // stored as "iv:cipher", both in hex
    expect(encrypted).toMatch(/^[0-9a-f]{32}:[0-9a-f]+$/);
  });

  test('decrypt gives back the original password', () => {
    const password = 'p@ss wörd: with spaces & accents';
    expect(decrypt(encrypt(password))).toBe(password);
  });

  test('the same password is encrypted differently each time (random IV)', () => {
    expect(encrypt('same')).not.toBe(encrypt('same'));
  });
});
