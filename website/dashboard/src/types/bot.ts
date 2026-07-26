export type BotStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'maintenance';

export interface Bot {
  id: string;
  name: string;
  tag: string;
  description: string;
  avatar: string;
  status: BotStatus;
  serversCount: number;
  usersCount: number;
  shards: number;
  uptimeSeconds: number;
  latencyMs: number;
  prefix: string;
  version: string;
  createdAt: string;
  tags: string[];
  ownerId: string;
  apiTokenMasked: string;
  features: {
    moderation: boolean;
    music: boolean;
    ai: boolean;
    tickets: boolean;
    economy: boolean;
    logging: boolean;
  };
}

export type CreateBotInput = Omit<Bot, 'id' | 'createdAt' | 'uptimeSeconds' | 'latencyMs'>;
export type UpdateBotInput = Partial<CreateBotInput>;
