import { buildEmbed, buildModEmbed } from '../../utils/embedBuilder.js';
import config from '../../config/config.js';

describe('buildEmbed', () => {
  it('should build a simple embed with title and description', () => {
    const embed = buildEmbed({ title: 'Test Title', description: 'Test Description' });
    expect(embed.data.title).toBe('Test Title');
    expect(embed.data.description).toBe('Test Description');
    // Default color logic
    expect(embed.data.color).toBe(config.colors.primary);
  });

  it('should apply specific color type', () => {
    const embed = buildEmbed({ type: 'error' });
    expect(embed.data.color).toBe(config.colors.error);
  });

  it('should override color if provided explicitly', () => {
    const embed = buildEmbed({ color: 0xFFFFFF });
    expect(embed.data.color).toBe(0xFFFFFF);
  });

  it('should set author and default author when not provided', () => {
    const embedWithAuthor = buildEmbed({ author: 'Custom Author', authorIcon: 'http://icon.url' });
    expect(embedWithAuthor.data.author.name).toBe('Custom Author');
    expect(embedWithAuthor.data.author.icon_url).toBe('http://icon.url');

    const defaultEmbed = buildEmbed();
    expect(defaultEmbed.data.author.name).toBe('✨ Aura Bot v2.0');
    expect(defaultEmbed.data.author.icon_url).toBe('https://cdn.discordapp.com/emojis/1109405021876542289.webp');
  });

  it('should format fields properly with padding', () => {
    const embed = buildEmbed({ fields: [{ name: 'Field 1', value: 'Value 1' }] });
    expect(embed.data.fields[0].name).toBe('Field 1');
    expect(embed.data.fields[0].value).toBe('Value 1\n\u200B');
    expect(embed.data.fields[0].inline).toBe(false);
  });

  it('should format fields properly without padding', () => {
    const embed = buildEmbed({ fields: [{ name: 'Field 1', value: 'Value 1' }], addPadding: false });
    expect(embed.data.fields[0].name).toBe('Field 1');
    expect(embed.data.fields[0].value).toBe('Value 1');
  });

  it('should set custom footer or fallback to default', () => {
    const embedWithFooter = buildEmbed({ footer: 'Custom Footer' });
    expect(embedWithFooter.data.footer.text).toBe('Custom Footer');

    const embedWithoutFooter = buildEmbed({});
    expect(embedWithoutFooter.data.footer.text).toBe(`Aura Enterprise AI • v${config.version}`);
  });

  it('should handle optional fields: thumbnail, image, url, timestamp', () => {
    const embed = buildEmbed({ thumbnail: 'http://thumb.url', image: 'http://image.url', url: 'http://site.url', timestamp: true });
    expect(embed.data.thumbnail.url).toBe('http://thumb.url');
    expect(embed.data.image.url).toBe('http://image.url');
    expect(embed.data.url).toBe('http://site.url');
    expect(embed.data.timestamp).toBeDefined();
  });
});

describe('buildModEmbed', () => {
  it('should build a mod embed with required parameters', () => {
    const embed = buildModEmbed({
      action: 'ban',
      user: { tag: 'User#1234', id: '123' },
      moderator: { tag: 'Mod#5678' },
      reason: 'Rule violation',
    });

    expect(embed.data.title).toBe('🔨 Ban');
    expect(embed.data.color).toBe(config.colors.error);
    expect(embed.data.fields[0].name).toBe('👤 User');
    expect(embed.data.fields[0].value).toBe('User#1234 (123)');
    expect(embed.data.fields[1].name).toBe('🔨 Moderator');
    expect(embed.data.fields[1].value).toBe('Mod#5678');
    expect(embed.data.fields[2].name).toBe('📝 Reason');
    expect(embed.data.fields[2].value).toBe('Rule violation');
  });

  it('should build mod embed with optional parameters', () => {
    const embed = buildModEmbed({
      action: 'kick',
      user: 'User#1234',
      moderator: 'Mod#5678',
      reason: '',
      duration: '1h',
      caseId: '42',
      extra: [{ name: 'Extra', value: 'Info' }]
    });

    expect(embed.data.title).toBe('👢 Kick');
    expect(embed.data.color).toBe(config.colors.warning);
    expect(embed.data.fields[2].value).toBe('No reason');
    expect(embed.data.fields[3].name).toBe('⏱️ Duration');
    expect(embed.data.fields[3].value).toBe('1h');
    expect(embed.data.fields[4].name).toBe('Extra');
    expect(embed.data.fields[4].value).toBe('Info');
    expect(embed.data.footer.text).toBe('Case #42');
  });
});
