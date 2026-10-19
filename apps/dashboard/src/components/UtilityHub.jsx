"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Palette,
  Tag,
  Save,
  CheckCircle2,
  Server,
  UserRound,
  Image,
  Flag,
  ShieldCheck,
  Radio,
} from "lucide-react";

/* ────────────────────────────── motion helpers ────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.03 } },
};

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/* ────────────────────────────── data ────────────────────────────── */

const PREDEFINED_COLORS = [
  { name: "Red", hex: "#ED4245" },
  { name: "Blue", hex: "#5865F2" },
  { name: "Green", hex: "#57F287" },
  { name: "Yellow", hex: "#FEE75C" },
  { name: "Orange", hex: "#FF7B2B" },
  { name: "Purple", hex: "#9B59B6" },
  { name: "Pink", hex: "#FF69B4" },
  { name: "Cyan", hex: "#00BFFF" },
  { name: "White", hex: "#FFFFFF" },
];

const UTILITY_COMMANDS = [
  {
    name: "/serverinfo",
    desc: "Crystal Realm stats — 12,645 members",
    uses: "1,284 uses",
    icon: Server,
    tone: "blue",
  },
  {
    name: "/userinfo",
    desc: "Join date, roles, and activity",
    uses: "962 uses",
    icon: UserRound,
    tone: "violet",
  },
  {
    name: "/avatar",
    desc: "Full-resolution member avatars",
    uses: "848 uses",
    icon: Image,
    tone: "cyan",
  },
  {
    name: "/banner",
    desc: "Profile banners at full resolution",
    uses: "517 uses",
    icon: Flag,
    tone: "pink",
  },
  {
    name: "/roleinfo",
    desc: "Role permissions and member counts",
    uses: "431 uses",
    icon: ShieldCheck,
    tone: "green",
  },
  {
    name: "/channelinfo",
    desc: "Topics, slowmode, and channel perms",
    uses: "356 uses",
    icon: Radio,
    tone: "amber",
  },
];

const INITIAL_SELF_ROLES = [
  { id: 1, name: "Announcements", emoji: "📢", color: "#7C5CFF", members: 2318 },
  { id: 2, name: "Events", emoji: "🎉", color: "#39D98A", members: 1264 },
  { id: 3, name: "Giveaways", emoji: "🎁", color: "#FFB547", members: 1876 },
];

/* ────────────────────────────── helpers ────────────────────────────── */

/* Reaction-role menu types as stored by the bot. */
const REACTION_ROLE_TYPES = {
  toggle: "Toggle",
  add_only: "Add only",
  remove_only: "Remove only",
  unique: "Unique",
};

/* Icon tile tone per command category — purely decorative. */
const CATEGORY_TONES = {
  Moderation: "red",
  Utility: "blue",
  AI: "violet",
  Leveling: "cyan",
  Economy: "green",
  Security: "amber",
  General: "blue",
  Management: "violet",
  Fun: "pink",
};

const categoryTone = (category) => CATEGORY_TONES[category] || "blue";

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function UtilityHub({ guildId }) {
  const [selectedColor, setSelectedColor] = useState("#5865F2");
  const [selfRoles] = useState(INITIAL_SELF_ROLES);
  const [toast, setToast] = useState(null);

  /* real data */
  const [live, setLive] = useState(false);
  const [commandsLive, setCommandsLive] = useState(false);
  const [reactionRoles, setReactionRoles] = useState([]);
  const [guildRoles, setGuildRoles] = useState([]);
  const [commands, setCommands] = useState([]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  /* request guards — only the latest load may write state */
  const roleSeq = useRef(0);
  const guildRoleSeq = useRef(0);
  const commandSeq = useRef(0);

  /* ────────────────────────────── real data ────────────────────────────── */

  const loadReactionRoles = useCallback(async () => {
    const requestId = ++roleSeq.current;
    if (!guildId) {
      setLive(false);
      setReactionRoles([]);
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/reaction-roles`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== roleSeq.current) return; // stale response from a previous guild
      setReactionRoles(
        (Array.isArray(data?.reactionRoles) ? data.reactionRoles : []).filter((r) => r && r.id != null)
      );
      setLive(true);
    } catch (err) {
      if (requestId !== roleSeq.current) return; // stale failure — ignore
      // Keep the humanized fallback quietly (live stays false → demo markup).
      console.warn("[UtilityHub] Failed to load reaction roles — showing demo data:", err);
    }
  }, [guildId]);

  useEffect(() => {
    loadReactionRoles();
    return () => {
      roleSeq.current += 1;
    };
  }, [loadReactionRoles]);

  /* Display-only: resolve role ids to names/colors from the live guild role list. */
  const loadGuildRoles = useCallback(async () => {
    const requestId = ++guildRoleSeq.current;
    if (!guildId) {
      setGuildRoles([]);
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/roles`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== guildRoleSeq.current) return;
      setGuildRoles((Array.isArray(data?.roles) ? data.roles : []).filter((r) => r && r.id != null));
    } catch (err) {
      if (requestId !== guildRoleSeq.current) return;
      console.warn("[UtilityHub] Failed to load guild roles — showing raw role ids:", err);
      setGuildRoles([]);
    }
  }, [guildId]);

  useEffect(() => {
    loadGuildRoles();
    return () => {
      guildRoleSeq.current += 1;
    };
  }, [loadGuildRoles]);

  /* The command catalog is a bare JSON array of { name, description, category }. */
  const loadCommands = useCallback(async () => {
    const requestId = ++commandSeq.current;
    if (!guildId) {
      setCommandsLive(false);
      setCommands([]);
      return;
    }
    try {
      const res = await fetch("/api/commands");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== commandSeq.current) return;
      if (!Array.isArray(data)) throw new Error("Malformed command catalog");
      setCommands(data.filter((cmd) => cmd && cmd.name));
      setCommandsLive(true);
    } catch (err) {
      if (requestId !== commandSeq.current) return;
      console.warn("[UtilityHub] Failed to load command catalog — showing demo data:", err);
    }
  }, [guildId]);

  useEffect(() => {
    loadCommands();
    return () => {
      commandSeq.current += 1;
    };
  }, [loadCommands]);

  /* ────────────────────────────── derived values ────────────────────────────── */

  /* Real mode = a guild is selected. It gates the honest copy and the disabled
     self-role sync control (there is no write route for reaction roles). */
  const isReal = Boolean(guildId);

  const findRole = (roleId) => {
    if (!roleId) return null;
    return guildRoles.find((r) => String(r.id) === String(roleId)) || null;
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="glass-dropdown fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold"
          >
            <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-violet">
            <Wrench className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[15px]">Utility, Colors &amp; Self Roles</h2>
            <p className="card-sub mt-0.5">
              Server utility tools, color roles, and self-assignable role menus for{" "}
              {isReal ? "this server" : "Crystal Realm"}.
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => showToast("Utility settings saved — self-role menus synced")}
          disabled={isReal}
          title={
            isReal
              ? "Reaction roles are managed with the bot's /reaction-role setup — nothing is saved from here"
              : undefined
          }
          className="btn-primary"
        >
          <Save className="h-4 w-4" /> Save
        </motion.button>
      </motion.div>

      {/* Utility command tiles */}
      <motion.section variants={rise} className="glass-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="icon-tile icon-tile-cyan h-9 w-9 rounded-[12px]">
              <Wrench className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">
                {commandsLive ? "Bot Command Catalog" : "Utility Commands"}
              </h3>
              <p className="card-sub mt-0.5">
                {commandsLive
                  ? "Every command the bot exposes — ready in every channel"
                  : "Member-facing info commands, ready in every channel"}
              </p>
            </div>
          </div>
          <span className="chip chip-cyan">
            {commandsLive ? commands.length : UTILITY_COMMANDS.length} commands
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {commandsLive ? (
            commands.length === 0 ? (
              <div className="empty-state sm:col-span-2 xl:col-span-3">
                <span className="empty-state-icon">
                  <Wrench className="h-4 w-4" />
                </span>
                <span className="empty-state-title">No commands available</span>
                <span>The bot did not report any commands for this server.</span>
              </div>
            ) : (
              commands.map((cmd) => (
                <div key={cmd.name} className="glass-card glass-card-hover p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`icon-tile icon-tile-${categoryTone(cmd.category)} h-9 w-9 rounded-[12px]`}
                    >
                      <Wrench className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block font-mono text-xs font-bold text-white">{cmd.name}</span>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                        {cmd.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="chip chip-cyan">{cmd.category || "Uncategorized"}</span>
                  </div>
                </div>
              ))
            )
          ) : (
            UTILITY_COMMANDS.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <div key={cmd.name} className="glass-card glass-card-hover p-4">
                  <div className="flex items-start gap-3">
                    <span className={`icon-tile icon-tile-${cmd.tone} h-9 w-9 rounded-[12px]`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block font-mono text-xs font-bold text-white">{cmd.name}</span>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{cmd.desc}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="chip chip-green">Active</span>
                    <span className="chip tabular-nums">{cmd.uses}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Colors */}
        <motion.section variants={rise} className="glass-card p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-pink h-9 w-9 rounded-[12px]">
              <Palette className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Color Roles</h3>
              <p className="card-sub mt-0.5">Tap a swatch to recolor the role</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {PREDEFINED_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setSelectedColor(c.hex)}
                title={`Select ${c.name} (${c.hex})`}
                className={`rounded-xl p-3 text-[10px] font-bold text-white transition-all [text-shadow:0_1px_2px_rgba(0,0,0,0.6)] ${
                  selectedColor === c.hex
                    ? "scale-[1.03] ring-2 ring-[#7C5CFF] ring-offset-2 ring-offset-[#0A0F1A]"
                    : "opacity-80 hover:opacity-100 hover:scale-[1.02]"
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/[0.12]"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-[11px] text-slate-500">{isReal ? "Preview" : "Selected"}</span>
            <span className="text-[11px] font-mono font-bold text-slate-300">{selectedColor}</span>
          </div>
          {isReal ? (
            <p className="mt-2 text-[10px] text-slate-600">
              Preview only — colour roles are applied by the bot, not saved from this panel.
            </p>
          ) : null}
        </motion.section>

        {/* Self Roles */}
        <motion.section variants={rise} className="glass-card p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-green h-9 w-9 rounded-[12px]">
              <Tag className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Self-Assignable Roles</h3>
              <p className="card-sub mt-0.5">
                {live
                  ? "Reaction-role menus configured on this server"
                  : "Reaction-role menus in #general"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {live ? (
              reactionRoles.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">
                    <Tag className="h-4 w-4" />
                  </span>
                  <span className="empty-state-title">No reaction role menus</span>
                  <span>Create one with the bot&apos;s /reaction-role command.</span>
                </div>
              ) : (
                reactionRoles.map((role) => {
                  const roleId = role.roleId ? String(role.roleId) : "";
                  const resolved = findRole(roleId);
                  const name = resolved?.name || (roleId ? `Role ${roleId}` : "Unknown role");
                  const typeLabel = REACTION_ROLE_TYPES[role.type] ||
                    (role.type ? String(role.type) : "unknown type");
                  return (
                    <div
                      key={role.id != null ? role.id : `${roleId}-${role.channelId}`}
                      className="list-row gap-3 px-3 py-2.5"
                    >
                      <span className="text-lg leading-none">{role.emoji || "•"}</span>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-white">{name}</span>
                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          {typeLabel} · channel {role.channelId ? String(role.channelId) : "—"}
                        </span>
                      </div>
                      {resolved?.color ? (
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: resolved.color }}
                        />
                      ) : null}
                    </div>
                  );
                })
              )
            ) : (
              selfRoles.map((role) => (
                <div key={role.id} className="list-row gap-3 px-3 py-2.5">
                  <span className="text-lg leading-none">{role.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-white">{role.name}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">
                      {role.members.toLocaleString("en-US")} members
                    </span>
                  </div>
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                </div>
              ))
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
