/**
 * Master Unified Dashboard Navigation Schema for Aura Bot v2
 */
export const DASHBOARD_TABS = [
  {
    id: 'overview',
    label: 'Overview & Server Stats',
    icon: 'chart-bar',
    description: 'Live community counters, system status, and module toggles.',
  },
  {
    id: 'security',
    label: 'Neural AI & Security',
    icon: 'shield-check',
    description: 'Gemini 1.5 Flash content moderation, Beast Mode anti-raid, and captcha verification.',
  },
  {
    id: 'tickets',
    label: 'Ticketing & Support Desk',
    icon: 'ticket',
    description: 'Multi-category ticket panels, web ticket viewer, and transcript archives.',
  },
  {
    id: 'tempvoice',
    label: 'TempVoice Rooms',
    icon: 'microphone',
    description: 'Join-to-Create voice hubs, auto-delete empty rooms, and custom naming templates.',
  },
  {
    id: 'staff',
    label: 'Staff Office & Applications',
    icon: 'user-group',
    description: 'Form builder for staff applications, review threads, and activity telemetry.',
  },
  {
    id: 'engagement',
    label: 'Feeds, Invites & Polls',
    icon: 'sparkles',
    description: 'YouTube/Twitch/TikTok alerts, invite leaderboards, and interactive polls.',
  },
];
