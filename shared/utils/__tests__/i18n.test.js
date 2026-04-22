import i18n from '../i18n.js';
import { jest } from '@jest/globals';

describe('i18n resolveLanguage', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      redis: {
        get: jest.fn(),
        setex: jest.fn(),
      },
      db: {
        models: {
          UserProfile: {
            findOne: jest.fn(),
          },
          GuildSettings: {
            findOne: jest.fn(),
          },
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns user language if available in cache', async () => {
    // User has 'es' in cache
    mockClient.redis.get.mockImplementation(async (key) => {
      if (key === 'user:lang:user1') return 'es';
      return null;
    });

    const lang = await i18n.resolveLanguage(mockClient, 'user1', 'guild1');
    expect(lang).toBe('es');
    // Ensure we didn't check guild language
    expect(mockClient.redis.get).toHaveBeenCalledTimes(1);
    expect(mockClient.redis.get).toHaveBeenCalledWith('user:lang:user1');
  });

  it('returns user language if available in DB (not cache)', async () => {
    // User cache miss, DB hit
    mockClient.redis.get.mockResolvedValue(null);
    mockClient.db.models.UserProfile.findOne.mockResolvedValue({ language: 'de' });

    const lang = await i18n.resolveLanguage(mockClient, 'user1', 'guild1');
    expect(lang).toBe('de');
    expect(mockClient.redis.get).toHaveBeenCalledWith('user:lang:user1');
    expect(mockClient.redis.setex).toHaveBeenCalledWith('user:lang:user1', 120, 'de');
  });

  it('returns guild language if user language is not available in cache or DB', async () => {
    // User miss, Guild hit in cache
    mockClient.redis.get.mockImplementation(async (key) => {
      if (key === 'user:lang:user1') return null; // Or 'null' string
      if (key === 'guild:lang:guild1') return 'fr';
      return null;
    });
    mockClient.db.models.UserProfile.findOne.mockResolvedValue(null);

    const lang = await i18n.resolveLanguage(mockClient, 'user1', 'guild1');
    expect(lang).toBe('fr');
    expect(mockClient.redis.get).toHaveBeenCalledWith('user:lang:user1');
    expect(mockClient.redis.get).toHaveBeenCalledWith('guild:lang:guild1');
  });

  it('returns guild language from DB if both caches miss and user DB misses', async () => {
    mockClient.redis.get.mockResolvedValue(null);
    mockClient.db.models.UserProfile.findOne.mockResolvedValue(null);
    mockClient.db.models.GuildSettings.findOne.mockResolvedValue({ language: 'it' });

    const lang = await i18n.resolveLanguage(mockClient, 'user1', 'guild1');
    expect(lang).toBe('it');
    expect(mockClient.db.models.GuildSettings.findOne).toHaveBeenCalledWith({ where: { guildId: 'guild1' } });
    expect(mockClient.redis.setex).toHaveBeenCalledWith('guild:lang:guild1', 300, 'it');
  });

  it('falls back to "en" if neither user nor guild has a language set', async () => {
    mockClient.redis.get.mockResolvedValue(null);
    mockClient.db.models.UserProfile.findOne.mockResolvedValue(null);
    mockClient.db.models.GuildSettings.findOne.mockResolvedValue(null);

    const lang = await i18n.resolveLanguage(mockClient, 'user1', 'guild1');
    expect(lang).toBe('en'); // guild settings fallback is 'en'
    expect(mockClient.redis.setex).toHaveBeenCalledWith('guild:lang:guild1', 300, 'en');
  });

  it('handles null string in cache properly (returns guild lang)', async () => {
    mockClient.redis.get.mockImplementation(async (key) => {
      if (key === 'user:lang:user1') return 'null';
      if (key === 'guild:lang:guild1') return 'zh';
      return null;
    });

    const lang = await i18n.resolveLanguage(mockClient, 'user1', 'guild1');
    expect(lang).toBe('zh');
  });

  it('handles errors gracefully by falling back to "en" for guild and null for user', async () => {
    mockClient.redis.get.mockRejectedValue(new Error('Redis error'));

    const lang = await i18n.resolveLanguage(mockClient, 'user1', 'guild1');
    expect(lang).toBe('en');
  });
});
