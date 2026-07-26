import { StorageAdapter } from './storage';
import { INITIAL_COMMANDS } from './mockData';
import { Command, CommandCategory } from '../types/command';

const COMMANDS_KEY = 'command_library';

export const CommandService = {
  getCommands(): Command[] {
    return StorageAdapter.get<Command[]>(COMMANDS_KEY, INITIAL_COMMANDS);
  },

  searchCommands(query: string, category?: CommandCategory | 'all'): Command[] {
    let commands = this.getCommands();
    if (category && category !== 'all') {
      commands = commands.filter(c => c.category === category);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      commands = commands.filter(
        c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    return commands;
  },

  toggleCommand(id: string): Command {
    const commands = this.getCommands();
    const index = commands.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Command not found');

    commands[index].enabled = !commands[index].enabled;
    commands[index].updatedAt = new Date().toISOString();
    StorageAdapter.set(COMMANDS_KEY, commands);
    return commands[index];
  },

  updateCommandVersion(id: string, version: string): Command {
    const commands = this.getCommands();
    const index = commands.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Command not found');

    commands[index].version = version;
    commands[index].updatedAt = new Date().toISOString();
    StorageAdapter.set(COMMANDS_KEY, commands);
    return commands[index];
  }
};
