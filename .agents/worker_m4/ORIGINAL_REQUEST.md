## 2026-07-28T04:24:12Z
Task: Implement the Ticketing & Applications Module (synthesizing Ticket Tool, Appy).
1. Add/enhance REST API endpoints in `dashboard/server.js`:
   - `GET /api/guilds/:guildId/tickets/csat`
   - `GET /api/guilds/:guildId/applications`
   - `POST /api/guilds/:guildId/applications`
   - `POST /api/guilds/:guildId/applications/:formId/toggle`
   Ensure state connects with `TicketPanel`, `TicketCSAT`, `ApplicationForm`, and `shared/systems/tickets/` & `shared/systems/applications/`.
2. Build UI component `dashboard/components/modules/TicketingModule.jsx`:
   - Dark mode (`#09090b`) glassmorphic design.
   - Multi-panel ticket manager & skill-tag routing settings.
   - CSAT feedback dashboard card (average rating, recent feedback).
   - Custom Application Form Builder (create/edit forms, questions, auto-roles on approval/denial).
3. Verify syntax by running `npm run lint:syntax`.
