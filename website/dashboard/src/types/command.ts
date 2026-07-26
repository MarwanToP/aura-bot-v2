export type CommandCategory = 'moderation' | 'utility' | 'ai' | 'music' | 'fun' | 'admin' | 'economy';

export interface CommandOption {
  name: string;
  description: string;
  type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'USER' | 'CHANNEL' | 'ROLE';
  required: boolean;
}

export interface Command {
  id: string;
  name: string;
  description: string;
  category: CommandCategory;
  version: string;
  enabled: boolean;
  cooldownSeconds: number;
  permissionsRequired: string[];
  usageCount: number;
  options: CommandOption[];
  updatedAt: string;
}
