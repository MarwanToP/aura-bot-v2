// migrations/20230801-create-command-settings.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('command_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      guildId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      commandName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      allowedRoles: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW')
      }
    });
    await queryInterface.addConstraint('command_settings', {
      fields: ['guildId', 'commandName'],
      type: 'unique',
      name: 'command_settings_guild_command_unique'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('command_settings');
  }
};
