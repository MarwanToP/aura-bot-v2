import assert from 'node:assert';
import { buildEmbed, buildModEmbed } from '../embedBuilder.js';
import config from '../../config/config.js';

describe('Embed Builder Utility', function() {

  describe('buildEmbed()', function() {
    it('should build a default primary embed', function() {
      const embed = buildEmbed();
      const data = embed.toJSON();

      assert.strictEqual(data.color, config.colors.primary);
      assert.strictEqual(data.author.name, '✨ Aura Bot v2.0');
      assert.strictEqual(data.author.icon_url, 'https://cdn.discordapp.com/emojis/1109405021876542289.webp');
      assert.strictEqual(data.footer.text, `Aura Enterprise AI • v${config.version}`);
    });

    it('should build an embed with provided title and description', function() {
      const embed = buildEmbed({ title: 'Test Title', description: 'Test Desc' });
      const data = embed.toJSON();

      assert.strictEqual(data.title, 'Test Title');
      assert.strictEqual(data.description, 'Test Desc');
    });

    it('should map type to color correctly', function() {
      const embed = buildEmbed({ type: 'success' });
      const data = embed.toJSON();

      assert.strictEqual(data.color, config.colors.success || '#00FF7F');
    });

    it('should prioritize custom color over type color', function() {
      const customColor = 0xFF00FF;
      const embed = buildEmbed({ type: 'error', color: customColor });
      const data = embed.toJSON();

      assert.strictEqual(data.color, customColor);
    });

    it('should handle custom footer', function() {
      const embed = buildEmbed({ footer: 'Custom Footer' });
      const data = embed.toJSON();

      assert.strictEqual(data.footer.text, 'Custom Footer');
    });

    it('should format fields correctly with padding enabled', function() {
      const fields = [{ name: 'Field 1', value: 'Val 1', inline: true }];
      const embed = buildEmbed({ fields, addPadding: true });
      const data = embed.toJSON();

      assert.strictEqual(data.fields.length, 1);
      assert.strictEqual(data.fields[0].name, 'Field 1');
      assert.strictEqual(data.fields[0].value, 'Val 1\n\u200B');
      assert.strictEqual(data.fields[0].inline, true);
    });

    it('should format fields correctly with padding disabled', function() {
      const fields = [{ name: 'Field 1', value: 'Val 1', inline: false }];
      const embed = buildEmbed({ fields, addPadding: false });
      const data = embed.toJSON();

      assert.strictEqual(data.fields.length, 1);
      assert.strictEqual(data.fields[0].name, 'Field 1');
      assert.strictEqual(data.fields[0].value, 'Val 1');
      assert.strictEqual(data.fields[0].inline, false);
    });

    it('should handle optional media properties (thumbnail, image, url)', function() {
      const embed = buildEmbed({
        thumbnail: 'https://example.com/thumb.png',
        image: 'https://example.com/image.png',
        url: 'https://example.com/'
      });
      const data = embed.toJSON();

      assert.strictEqual(data.thumbnail.url, 'https://example.com/thumb.png');
      assert.strictEqual(data.image.url, 'https://example.com/image.png');
      assert.strictEqual(data.url, 'https://example.com/');
    });

    it('should handle timestamps', function() {
      const embed = buildEmbed({ timestamp: true });
      const data = embed.toJSON();

      assert.ok(data.timestamp);
    });

    it('should handle custom author', function() {
      const embed = buildEmbed({ author: 'Custom Author', authorIcon: 'https://example.com/icon.png' });
      const data = embed.toJSON();

      assert.strictEqual(data.author.name, 'Custom Author');
      assert.strictEqual(data.author.icon_url, 'https://example.com/icon.png');
    });
  });

  describe('buildModEmbed()', function() {
    it('should build a mod embed for a ban action', function() {
      const embed = buildModEmbed({
        action: 'ban',
        user: { tag: 'TestUser#1234', id: '123' },
        moderator: { tag: 'Mod#0001' },
        reason: 'Violation'
      });
      const data = embed.toJSON();

      assert.strictEqual(data.color, config.colors.error);
      assert.strictEqual(data.title, '🔨 Ban');
      assert.strictEqual(data.fields[0].name, '👤 User');
      assert.strictEqual(data.fields[0].value, 'TestUser#1234 (123)');
      assert.strictEqual(data.fields[1].name, '🔨 Moderator');
      assert.strictEqual(data.fields[1].value, 'Mod#0001');
      assert.strictEqual(data.fields[2].name, '📝 Reason');
      assert.strictEqual(data.fields[2].value, 'Violation');
    });

    it('should use string properties if tag/id are not present on user/moderator objects', function() {
      const embed = buildModEmbed({
        action: 'kick',
        user: 'TestUser#1234',
        moderator: 'Mod#0001',
        reason: ''
      });
      const data = embed.toJSON();

      assert.strictEqual(data.color, config.colors.warning);
      assert.strictEqual(data.title, '👢 Kick');
      assert.strictEqual(data.fields[0].value, 'TestUser#1234 (TestUser#1234)');
      assert.strictEqual(data.fields[1].value, 'Mod#0001');
      assert.strictEqual(data.fields[2].value, 'No reason');
    });

    it('should handle caseId, duration, and extra fields', function() {
      const extraField = { name: 'Extra', value: 'Info' };
      const embed = buildModEmbed({
        action: 'timeout',
        user: 'User',
        moderator: 'Mod',
        reason: 'Spam',
        caseId: '42',
        duration: '10m',
        extra: [extraField]
      });
      const data = embed.toJSON();

      assert.strictEqual(data.footer.text, 'Case #42');
      assert.strictEqual(data.fields[3].name, '⏱️ Duration');
      assert.strictEqual(data.fields[3].value, '10m');
      assert.strictEqual(data.fields[4].name, 'Extra');
      assert.strictEqual(data.fields[4].value, 'Info');
    });
  });
});
