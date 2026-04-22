import { test } from 'node:test';
import assert from 'node:assert/strict';
import i18n from '../i18n.js';

test('i18n.isRTL()', async (t) => {
  await t.test('should return true for RTL languages', () => {
    assert.equal(i18n.isRTL('ar'), true);
    assert.equal(i18n.isRTL('he'), true);
    assert.equal(i18n.isRTL('fa'), true);
    assert.equal(i18n.isRTL('ur'), true);
  });

  await t.test('should return false for LTR languages', () => {
    assert.equal(i18n.isRTL('en'), false);
    assert.equal(i18n.isRTL('fr'), false);
    assert.equal(i18n.isRTL('es'), false);
  });

  await t.test('should return false for invalid inputs', () => {
    assert.equal(i18n.isRTL(null), false);
    assert.equal(i18n.isRTL(undefined), false);
    assert.equal(i18n.isRTL(''), false);
    assert.equal(i18n.isRTL(123), false);
  });
});
