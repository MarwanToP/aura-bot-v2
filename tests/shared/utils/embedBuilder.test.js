import test from 'node:test';
import assert from 'node:assert';
import { buildModEmbed } from '../../../shared/utils/embedBuilder.js';
import config from '../../../shared/config/config.js';

test('buildModEmbed - should create a ban embed correctly', (t) => {
  const options = {
    action: 'ban',
    user: { tag: 'TestUser#1234', id: '123456789' },
    moderator: { tag: 'ModUser#9876' },
    reason: 'Spamming',
    duration: 'Permanent',
    caseId: 42
  };

  const embed = buildModEmbed(options);
  const json = embed.toJSON();

  assert.strictEqual(json.color, config.colors.error, 'Ban color should be error color');
  assert.strictEqual(json.title, '🔨 Ban', 'Title should have ban emoji and action capitalized');
  assert.strictEqual(json.fields[0].name, '👤 User');
  assert.strictEqual(json.fields[0].value, 'TestUser#1234 (123456789)');
  assert.strictEqual(json.fields[1].name, '🔨 Moderator');
  assert.strictEqual(json.fields[1].value, 'ModUser#9876');
  assert.strictEqual(json.fields[2].name, '📝 Reason');
  assert.strictEqual(json.fields[2].value, 'Spamming');
  assert.strictEqual(json.fields[3].name, '⏱️ Duration');
  assert.strictEqual(json.fields[3].value, 'Permanent');
  assert.strictEqual(json.footer.text, 'Case #42');
});

test('buildModEmbed - should create a kick embed correctly', (t) => {
  const options = {
    action: 'kick',
    user: { tag: 'TestUser#1234', id: '123456789' },
    moderator: { tag: 'ModUser#9876' },
    reason: 'Rule violation'
  };

  const embed = buildModEmbed(options);
  const json = embed.toJSON();

  assert.strictEqual(json.color, config.colors.warning, 'Kick color should be warning color');
  assert.strictEqual(json.title, '👢 Kick', 'Title should have kick emoji and action capitalized');
  assert.strictEqual(json.fields.length, 3, 'Should only have 3 fields when duration is not provided');
  assert.strictEqual(json.fields[2].value, 'Rule violation', 'Reason should match');
  assert.strictEqual(json.footer, undefined, 'Footer should be undefined when caseId is not provided');
});

test('buildModEmbed - should handle unknown action and default reason', (t) => {
  const options = {
    action: 'unknown_action',
    user: '123456789', // Testing string fallback
    moderator: 'Admin', // Testing string fallback
  };

  const embed = buildModEmbed(options);
  const json = embed.toJSON();

  assert.strictEqual(json.color, config.colors.primary, 'Unknown action should fallback to primary color');
  assert.strictEqual(json.title, '📋 Unknown action', 'Unknown action should fallback to note emoji and format action name');
  assert.strictEqual(json.fields[0].value, '123456789 (123456789)', 'Should handle string user');
  assert.strictEqual(json.fields[1].value, 'Admin', 'Should handle string moderator');
  assert.strictEqual(json.fields[2].value, 'No reason', 'Reason should default to No reason');
});

test('buildModEmbed - should append extra fields', (t) => {
  const options = {
    action: 'timeout',
    user: { tag: 'TestUser#1234', id: '123456789' },
    moderator: { tag: 'ModUser#9876' },
    extra: [{ name: 'Extra Info', value: 'This is extra' }]
  };

  const embed = buildModEmbed(options);
  const json = embed.toJSON();

  assert.strictEqual(json.color, config.colors.warning, 'Timeout color should be warning color');
  assert.strictEqual(json.title, '🔇 Timeout', 'Title should have timeout emoji');
  assert.strictEqual(json.fields.length, 4, 'Should include extra fields');
  assert.strictEqual(json.fields[3].name, 'Extra Info');
  assert.strictEqual(json.fields[3].value, 'This is extra');
});

test('buildModEmbed - should handle action with underscore', (t) => {
  const options = {
    action: 'timeout_remove',
    user: '12345',
    moderator: 'Admin'
  };

  const embed = buildModEmbed(options);
  const json = embed.toJSON();

  assert.strictEqual(json.title, '🔓 Timeout remove', 'Title should format underscores correctly');
});
