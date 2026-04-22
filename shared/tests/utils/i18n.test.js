import test from 'node:test';
import assert from 'node:assert';
import i18n from '../../utils/i18n.js';

test('getGuildLanguage handles errors and returns default', async () => {
  // Create a mock client that throws an error
  const mockClient = {
    redis: {
      get: async () => {
        throw new Error('Redis connection failed');
      }
    },
    db: {
      models: {
        GuildSettings: {
          findOne: async () => {
            throw new Error('Database connection failed');
          }
        }
      }
    }
  };

  const result = await i18n.getGuildLanguage(mockClient, '1234567890');

  // The error path in getGuildLanguage returns 'en'
  assert.strictEqual(result, 'en');
});
