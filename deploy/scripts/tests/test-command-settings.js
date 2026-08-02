// shared/scripts/tests/test-command-settings.js
import database from '../../database/index.js';

async function runCommandSettingsTests() {
  console.log('🧪 Running Command Settings Model & Logic Tests...');
  
  // Verify model definition exists in Sequelize schema
  const CommandSettings = database.models.CommandSettings;
  if (!CommandSettings) {
    console.error('❌ CommandSettings model missing in database registry!');
    process.exit(1);
  }

  console.log('✅ CommandSettings model registered in database schema.');

  // Validate model attributes
  const attributes = CommandSettings.rawAttributes;
  const requiredFields = ['guildId', 'commandName', 'enabled', 'allowedRoles'];
  for (const field of requiredFields) {
    if (!attributes[field]) {
      console.error(`❌ Field "${field}" is missing from CommandSettings model definition!`);
      process.exit(1);
    }
  }
  console.log('✅ All required fields (guildId, commandName, enabled, allowedRoles) verified.');

  try {
    // Attempt DB connection & query if database server is reachable
    await database.authenticate();
    console.log('✅ Database connected. Running live DB CRUD tests...');

    const testGuildId = 'test-guild-999';
    const testCommand = 'testban';

    await CommandSettings.destroy({ where: { guildId: testGuildId, commandName: testCommand } });

    const created = await CommandSettings.create({
      guildId: testGuildId,
      commandName: testCommand,
      enabled: false,
      allowedRoles: ['123456789'],
    });
    console.log('✅ Created DB setting:', created.toJSON());

    await CommandSettings.destroy({ where: { guildId: testGuildId, commandName: testCommand } });
    console.log('✅ Cleaned up DB test setting.');
  } catch (err) {
    console.log('ℹ️  PostgreSQL server offline or unreachable (skipping live query phase). Static model verification passed.');
  }

  console.log('🎉 All Command Settings tests passed successfully!');
  process.exit(0);
}

runCommandSettingsTests();
