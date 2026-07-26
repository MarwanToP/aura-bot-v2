import { StorageAdapter } from './storage';
import { INITIAL_SERVERS } from './mockData';
import { Server } from '../types/server';

const SERVERS_KEY = 'connected_servers';

export const ServerService = {
  getServers(): Server[] {
    return StorageAdapter.get<Server[]>(SERVERS_KEY, INITIAL_SERVERS);
  },

  filterServers(query: string, premiumOnly?: boolean): Server[] {
    let servers = this.getServers();
    if (premiumOnly) {
      servers = servers.filter(s => s.isPremium);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      servers = servers.filter(
        s => s.name.toLowerCase().includes(q) || s.ownerName.toLowerCase().includes(q)
      );
    }
    return servers;
  },

  updateServerPrefix(id: string, prefix: string): Server {
    const servers = this.getServers();
    const index = servers.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Server not found');

    servers[index].prefix = prefix;
    StorageAdapter.set(SERVERS_KEY, servers);
    return servers[index];
  }
};
