import { describe, it } from 'node:test';
import assert from 'node:assert';
import i18n, { _test_loadLocale as loadLocale } from '../../utils/i18n.js';

describe('i18n error handling', () => {
  it('should fallback to empty object if loadLocale throws', () => {
    // If we call loadLocale with a non-existent locale file, readFileSync will naturally throw ENOENT
    // This allows us to test the fallback path safely without hacking fs or global objects!
    const result = loadLocale('nonexistent_locale_12345');
    assert.deepStrictEqual(result, {});
  });

  it('should load locales correctly when available', async () => {
    // We can also test the happy path by checking if English loads
    const result = loadLocale('en');
    assert.ok(result !== undefined);
    assert.ok(Object.keys(result).length > 0);
  });
});
