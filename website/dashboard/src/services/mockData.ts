import { Bot } from '../types/bot';
import { Server } from '../types/server';
import { Command } from '../types/command';
import { User } from '../types/user';
import { AnalyticsData } from '../types/analytics';
import { NotificationItem } from '../types/notification';

export const INITIAL_USER: User = {
  id: 'usr_admin_01',
  username: 'marwan_admin',
  displayName: 'Marwan Admin',
  email: 'admin@aurabot.io',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  role: 'admin',
  permissions: ['*'],
  createdAt: '2025-01-15T10:00:00Z'
};

export const INITIAL_BOTS: Bot[] = [
  {
    id: 'bot_aura_prime',
    name: 'AURA Prime',
    tag: '#0001',
    description: 'Enterprise AI multi-purpose bot with automated moderation, high-fidelity music, and neural smart responses.',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80',
    status: 'online',
    serversCount: 1420,
    usersCount: 894000,
    shards: 8,
    uptimeSeconds: 604800,
    latencyMs: 18,
    prefix: '!',
    version: '2.4.0',
    createdAt: '2025-02-01T12:00:00Z',
    tags: ['AI', 'Moderation', 'Music', 'Verified'],
    ownerId: 'usr_admin_01',
    apiTokenMasked: 'aura_live_••••••••••••94F2',
    features: {
      moderation: true,
      music: true,
      ai: true,
      tickets: true,
      economy: true,
      logging: true
    }
  },
  {
    id: 'bot_sentinel_guard',
    name: 'SentinelGuard',
    tag: '#0042',
    description: 'High-speed automated server protection, anti-raid mechanisms, and audit logging engine.',
    avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=250&q=80',
    status: 'online',
    serversCount: 840,
    usersCount: 420000,
    shards: 4,
    uptimeSeconds: 345600,
    latencyMs: 14,
    prefix: 's!',
    version: '1.8.2',
    createdAt: '2025-03-10T14:30:00Z',
    tags: ['Security', 'Moderation', 'Logs'],
    ownerId: 'usr_admin_01',
    apiTokenMasked: 'sent_live_••••••••••••11C9',
    features: {
      moderation: true,
      music: false,
      ai: false,
      tickets: true,
      economy: false,
      logging: true
    }
  },
  {
    id: 'bot_pulse_audio',
    name: 'Pulse Synth',
    tag: '#0888',
    description: 'Low-latency 320kbps audio playback node with Spotify, SoundCloud, and YouTube stream parsing.',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=250&q=80',
    status: 'idle',
    serversCount: 520,
    usersCount: 310000,
    shards: 2,
    uptimeSeconds: 172800,
    latencyMs: 32,
    prefix: 'p!',
    version: '3.1.0',
    createdAt: '2025-04-18T09:15:00Z',
    tags: ['Music', 'Audio', 'Voice'],
    ownerId: 'usr_admin_01',
    apiTokenMasked: 'pulse_live_••••••••••••77AA',
    features: {
      moderation: false,
      music: true,
      ai: false,
      tickets: false,
      economy: false,
      logging: false
    }
  },
  {
    id: 'bot_ai_nexus',
    name: 'Nexus AI Engine',
    tag: '#9900',
    description: 'Generative AI assistant capable of code debugging, image generation, and context-aware chat.',
    avatar: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=250&q=80',
    status: 'maintenance',
    serversCount: 290,
    usersCount: 185000,
    shards: 2,
    uptimeSeconds: 43200,
    latencyMs: 65,
    prefix: 'ai!',
    version: '0.9.5-beta',
    createdAt: '2025-06-01T16:20:00Z',
    tags: ['AI', 'LLM', 'Experimental'],
    ownerId: 'usr_admin_01',
    apiTokenMasked: 'nex_live_••••••••••••334B',
    features: {
      moderation: false,
      music: false,
      ai: true,
      tickets: false,
      economy: true,
      logging: true
    }
  }
];

export const INITIAL_SERVERS: Server[] = [
  {
    id: 'srv_dev_lounge',
    name: 'Developers Hub Lounge',
    icon: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=150&q=80',
    memberCount: 42500,
    activeBots: ['bot_aura_prime', 'bot_sentinel_guard'],
    region: 'us-east',
    prefix: '!',
    joinedAt: '2025-02-05T00:00:00Z',
    isPremium: true,
    activeModules: ['AI Assistant', 'Anti-Raid', 'Voice Log'],
    ownerName: 'Alex Vance'
  },
  {
    id: 'srv_gaming_realm',
    name: 'Nexus Gaming Realm',
    icon: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=150&q=80',
    memberCount: 128000,
    activeBots: ['bot_aura_prime', 'bot_pulse_audio'],
    region: 'eu-central',
    prefix: 'g!',
    joinedAt: '2025-02-12T10:00:00Z',
    isPremium: true,
    activeModules: ['Music Player', 'Economy', 'Levels'],
    ownerName: 'ViperX'
  },
  {
    id: 'srv_ai_lab',
    name: 'Open AI Research Guild',
    icon: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=150&q=80',
    memberCount: 15400,
    activeBots: ['bot_ai_nexus', 'bot_sentinel_guard'],
    region: 'us-west',
    prefix: 'ai!',
    joinedAt: '2025-03-01T15:00:00Z',
    isPremium: false,
    activeModules: ['Generative Chat', 'Code Exec'],
    ownerName: 'Dr. Sarah Lin'
  },
  {
    id: 'srv_chill_beats',
    name: 'Lofi & Chill Sanctuary',
    icon: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=150&q=80',
    memberCount: 63000,
    activeBots: ['bot_pulse_audio'],
    region: 'ap-southeast',
    prefix: 'p!',
    joinedAt: '2025-04-20T08:00:00Z',
    isPremium: true,
    activeModules: ['Radio 24/7', 'Soundboard'],
    ownerName: 'Aria'
  }
];

export const INITIAL_COMMANDS: Command[] = [
  {
    id: 'cmd_ban',
    name: 'ban',
    description: 'Permanently remove a user from the server with specified audit reason and history prune.',
    category: 'moderation',
    version: '2.1.0',
    enabled: true,
    cooldownSeconds: 5,
    permissionsRequired: ['BAN_MEMBERS'],
    usageCount: 14250,
    options: [
      { name: 'user', description: 'Target member to ban', type: 'USER', required: true },
      { name: 'reason', description: 'Reason recorded in audit log', type: 'STRING', required: false },
      { name: 'delete_days', description: 'Days of message history to prune (0-7)', type: 'INTEGER', required: false }
    ],
    updatedAt: '2025-06-10T12:00:00Z'
  },
  {
    id: 'cmd_ask',
    name: 'ask',
    description: 'Query the neural AI agent for code synthesis, problem solving, or conversational answers.',
    category: 'ai',
    version: '3.0.1',
    enabled: true,
    cooldownSeconds: 3,
    permissionsRequired: [],
    usageCount: 98400,
    options: [
      { name: 'prompt', description: 'Your question or prompt for the AI', type: 'STRING', required: true },
      { name: 'model', description: 'Target LLM engine model', type: 'STRING', required: false }
    ],
    updatedAt: '2025-07-01T14:30:00Z'
  },
  {
    id: 'cmd_play',
    name: 'play',
    description: 'Enqueue audio stream from YouTube, Spotify, or direct URL into voice channel.',
    category: 'music',
    version: '1.9.4',
    enabled: true,
    cooldownSeconds: 2,
    permissionsRequired: ['CONNECT', 'SPEAK'],
    usageCount: 245000,
    options: [
      { name: 'query', description: 'Song name or direct track URL', type: 'STRING', required: true }
    ],
    updatedAt: '2025-05-15T09:00:00Z'
  },
  {
    id: 'cmd_clear',
    name: 'clear',
    description: 'Bulk delete specified quantity of recent messages from text channel.',
    category: 'moderation',
    version: '2.0.0',
    enabled: true,
    cooldownSeconds: 10,
    permissionsRequired: ['MANAGE_MESSAGES'],
    usageCount: 68100,
    options: [
      { name: 'amount', description: 'Number of messages (1-100)', type: 'INTEGER', required: true }
    ],
    updatedAt: '2025-04-11T11:20:00Z'
  },
  {
    id: 'cmd_stats',
    name: 'stats',
    description: 'Display real-time cluster telemetry, memory usage, API ping, and uptime metrics.',
    category: 'utility',
    version: '1.2.0',
    enabled: true,
    cooldownSeconds: 5,
    permissionsRequired: [],
    usageCount: 31200,
    options: [],
    updatedAt: '2025-06-25T16:45:00Z'
  }
];

export const INITIAL_ANALYTICS: AnalyticsData = {
  uptimePercentage: 99.98,
  averageLatencyMs: 21,
  totalCommandsExecuted: 1845200,
  activeServersCount: 3070,
  latencyHistory: [
    { timestamp: '00:00', value: 18 },
    { timestamp: '04:00', value: 16 },
    { timestamp: '08:00', value: 24 },
    { timestamp: '12:00', value: 31 },
    { timestamp: '16:00', value: 22 },
    { timestamp: '20:00', value: 19 },
    { timestamp: '24:00', value: 17 }
  ],
  commandUsageHistory: [
    { timestamp: 'Mon', value: 240000 },
    { timestamp: 'Tue', value: 280000 },
    { timestamp: 'Wed', value: 310000 },
    { timestamp: 'Thu', value: 295000 },
    { timestamp: 'Fri', value: 380000 },
    { timestamp: 'Sat', value: 450000 },
    { timestamp: 'Sun', value: 410000 }
  ],
  serverGrowthHistory: [
    { timestamp: 'Jan', value: 2100 },
    { timestamp: 'Feb', value: 2350 },
    { timestamp: 'Mar', value: 2600 },
    { timestamp: 'Apr', value: 2780 },
    { timestamp: 'May', value: 2920 },
    { timestamp: 'Jun', value: 3070 }
  ],
  categoryDistribution: [
    { category: 'Music & Audio', count: 740000, percentage: 40.1 },
    { category: 'AI Synthesis', count: 520000, percentage: 28.2 },
    { category: 'Moderation', count: 380000, percentage: 20.6 },
    { category: 'Utility & Fun', count: 205200, percentage: 11.1 }
  ],
  topCommands: [
    { command: '/play', calls: 740000 },
    { command: '/ask', calls: 520000 },
    { command: '/ban', calls: 142500 },
    { command: '/clear', calls: 98100 },
    { command: '/stats', calls: 62400 }
  ]
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Cluster Health Nominal',
    message: 'All 16 shard nodes running with 18ms latency average.',
    type: 'success',
    timestamp: '10 min ago',
    read: false
  },
  {
    id: 'notif_2',
    title: 'Nexus AI Rate Limit Alert',
    message: 'High API request volume detected on OpenAI proxy pool.',
    type: 'warning',
    timestamp: '45 min ago',
    read: false
  },
  {
    id: 'notif_3',
    title: 'New Guild Onboarded',
    message: 'Developers Hub Lounge added AURA Prime bot.',
    type: 'info',
    timestamp: '2 hours ago',
    read: true
  }
];
