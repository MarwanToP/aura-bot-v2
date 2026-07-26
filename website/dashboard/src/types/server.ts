export interface Server {
  id: string;
  name: string;
  icon: string;
  memberCount: number;
  activeBots: string[]; // Bot IDs
  region: string;
  prefix: string;
  joinedAt: string;
  isPremium: boolean;
  activeModules: string[];
  ownerName: string;
}
