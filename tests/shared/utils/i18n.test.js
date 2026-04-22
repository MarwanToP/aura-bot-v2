import test from 'node:test';
import assert from 'node:assert';
import i18n from '../../../shared/utils/i18n.js';

test('getUserLanguage returns null when an error is thrown', async () => {
  const mockClient = {
    redis: {
      get: async () => {
        throw new Error('Redis connection error');
      }
    }
  };

  const result = await i18n.getUserLanguage(mockClient, '123456');
  assert.strictEqual(result, null);
});
