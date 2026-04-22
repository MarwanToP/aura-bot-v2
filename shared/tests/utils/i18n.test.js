import { test } from 'node:test';
import assert from 'node:assert/strict';
import i18n from '../../utils/i18n.js';
import i18next from 'i18next';

test('i18n.t translation function', async (t) => {
  await t.test('translates correctly with initialized mock instance', async () => {
    await i18next.init({
      lng: 'en',
      fallbackLng: 'en',
      resources: {
        en: { translation: { greeting: 'Hello', welcome: 'Welcome, {{name}}' } },
        fr: { translation: { greeting: 'Bonjour', welcome: 'Bienvenue, {{name}}' } }
      }
    });

    // Basic translation
    assert.equal(i18n.t('greeting'), 'Hello');

    // Interpolation / variables
    assert.equal(i18n.t('welcome', { name: 'John' }), 'Welcome, John');

    // Explicit locale
    assert.equal(i18n.t('greeting', {}, 'fr'), 'Bonjour');

    // Explicit locale with interpolation
    assert.equal(i18n.t('welcome', { name: 'Alice' }, 'fr'), 'Bienvenue, Alice');

    // Fallback behavior (key not found)
    assert.equal(i18n.t('missing.key'), 'missing.key');
  });
});
