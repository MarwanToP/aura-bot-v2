import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('i18n error handling', () => {
  let i18n, i18next;

  beforeEach(async () => {
    // Import dynamically so we can reset
    i18n = (await import(`../../utils/i18n.js?t=${Date.now()}`)).default;
    i18next = (await import('i18next')).default;

    i18next.isInitialized = false;
    i18next.services = {};
    i18next.store = { data: {} };
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('should fallback to empty object if loadLocale throws via mocked readFileSync', async () => {
    mock.method(fs, 'readFileSync', () => {
      throw new Error('Simulated read error');
    });

    await i18n.init();

    const resources = i18next.store.data;
    assert.deepStrictEqual(resources.en.translation, {});
    assert.deepStrictEqual(resources.ar.translation, {});
  });

  it('should load locales correctly when no error is thrown', async () => {
    await i18n.init();

    const resources = i18next.store.data;
    assert.ok(resources.en.translation !== undefined);
    assert.ok(Object.keys(resources.en.translation).length > 0);
  });
});
