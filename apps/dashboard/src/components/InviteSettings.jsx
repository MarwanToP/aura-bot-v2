"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, UserCheck, ShieldAlert, Award, LogOut, Users, Crown } from "lucide-react";

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

/* Count-up hook (respects reduced motion) */
function useCountUp(target, { duration = 1100 } = {}) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVal(target);
      return;
    }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}

/* ────────────────────────────── static data ────────────────────────────── */

const STATS = [
  {
    label: "Total Server Invites",
    value: 18204,
    note: "+342 this week",
    color: "#5B8CFF",
    icon: Mail,
  },
  {
    label: "Real Joins",
    value: 15842,
    note: "87% of tracked joins",
    color: "#39D98A",
    icon: UserCheck,
  },
  {
    label: "Fake / Left Invites",
    value: 2362,
    note: "flagged or left within 24h",
    color: "#FF5C7A",
    icon: ShieldAlert,
  },
];

const MILESTONES = [
  { invites: 5, role: "@Regular Member", color: "#5B8CFF", granted: "2,140" },
  { invites: 15, role: "@VIP Supporter", color: "#7C5CFF", granted: "486" },
  { invites: 30, role: "@Invite Master", color: "#FFB547", granted: "92" },
];

/* ────────────────────────────── api mapping ────────────────────────────── */

/* "…1a2b3c" — muted fallback when the member name could not be resolved */
const shortUserId = (id) => {
  const s = String(id ?? "");
  if (!s) return "unknown";
  return s.length > 6 ? `…${s.slice(-6)}` : s;
};

/* only ever render <img> for Discord CDN avatar URLs — never arbitrary strings */
const isTrustedAvatar = (url) =>
  typeof url === "string" && url.startsWith("https://cdn.discordapp.com/");

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

function mapInviteRow(row) {
  const userId = String(row?.userId ?? "");
  const name = typeof row?.name === "string" && row.name.trim() ? row.name.trim() : null;
  return {
    userId,
    name,
    avatarUrl: isTrustedAvatar(row?.avatarUrl) ? row.avatarUrl : null,
    invites: Number(row?.invites) || 0,
    fake: Number(row?.fake) || 0,
    left: Number(row?.left) || 0,
    valid: Number(row?.valid) || 0,
  };
}

/* inviteConfig.rankRewards is a bot-owned JSONB blob — read every key spelling it has
   used rather than assuming one shape. */
const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

function roleDotColor(color) {
  if (typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)) return color;
  const n = Number(color);
  if (Number.isFinite(n) && n > 0) return `#${(n & 0xffffff).toString(16).padStart(6, "0")}`;
  return "#64748B";
}

function mapMilestoneRewards(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const invites = toInt(
        entry.invites ?? entry.rank ?? entry.threshold ?? entry.required ?? entry.amount
      );
      const roleName =
        typeof entry.roleName === "string" && entry.roleName.trim()
          ? entry.roleName.trim()
          : typeof entry.role === "string" && entry.role.trim() && !/^\d+$/.test(entry.role.trim())
            ? entry.role.trim()
            : null;
      const roleId =
        entry.roleId != null
          ? String(entry.roleId)
          : typeof entry.role === "string" && /^\d{5,}$/.test(entry.role.trim())
            ? entry.role.trim()
            : null;
      if (!invites && !roleId && !roleName) return null;
      return { invites, roleId, roleName, color: roleDotColor(entry.color) };
    })
    .filter(Boolean);
}

/* real-mode totals are client-side sums across the returned leaderboard rows
   (the route caps them at 25 inviters) — the notes say so, so they are never read as
   a server-wide total. */
const REAL_STATS = [
  {
    key: "invites",
    label: "Tracked invites",
    note: (n) => `sum across the top ${n} inviter${n === 1 ? "" : "s"} — not a server-wide total`,
    color: "#5B8CFF",
    icon: Mail,
  },
  { key: "fake", label: "Fake", note: (n) => `flagged or counted as fake · top ${n}`, color: "#FF5C7A", icon: ShieldAlert },
  { key: "left", label: "Left", note: (n) => `joined, then left the server · top ${n}`, color: "#FFB547", icon: LogOut },
  { key: "valid", label: "Valid", note: (n) => `invites − fake − left · top ${n}`, color: "#39D98A", icon: UserCheck },
];

/* map a stat accent colour onto the glass icon-tile palette */
const toneFor = (color) => {
  if (color === "#39D98A") return "green";
  if (color === "#FF5C7A") return "red";
  if (color === "#FFB547") return "amber";
  if (color === "#7C5CFF") return "violet";
  return "blue";
};

/* ────────────────────────────── pieces ────────────────────────────── */

function StatCard({ s, index }) {
  const count = useCountUp(s.value, { duration: 900 + index * 120 });
  const Icon = s.icon;

  return (
    <div className="kpi-tile">
      <div className="flex items-start justify-between gap-3">
        <span className="kpi-label">{s.label}</span>
        <span className={`icon-tile icon-tile-${toneFor(s.color)} h-9 w-9 rounded-[12px]`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="kpi-value mt-3">{Math.round(count).toLocaleString("en-US")}</div>
      <p className="mt-1 text-[10px] text-slate-500">{s.note}</p>
    </div>
  );
}

function CountChip({ value, label, color }) {
  const n = Number(value) || 0;
  return (
    <span
      className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums"
      style={{ borderColor: `${color}40`, color, background: `${color}12` }}
    >
      {n.toLocaleString("en-US")} {label}
    </span>
  );
}

function InviteRow({ row, rank }) {
  const [broken, setBroken] = useState(false);
  const display = row.name || shortUserId(row.userId);
  const initials =
    (row.name || row.userId || "?").replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "?";
  const hue = hashHue(row.userId || display);

  return (
    <div className="list-row gap-3 px-3 py-2.5">
      <span className="w-5 shrink-0 text-center text-[11px] font-black tabular-nums text-slate-600">
        {rank <= 3 ? <Crown className="h-3.5 w-3.5 text-[#FBBF24]" /> : rank}
      </span>

      <span className="avatar-ring shrink-0">
        {row.avatarUrl && !broken ? (
          <img
            src={row.avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setBroken(true)}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))`,
            }}
          >
            {initials}
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div
          className={`truncate text-xs font-bold ${
            row.name ? "text-white" : "font-mono text-slate-500"
          }`}
        >
          {display}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        <CountChip value={row.invites} label="invites" color="#5B8CFF" />
        <CountChip value={row.valid} label="valid" color="#39D98A" />
        {row.fake > 0 && <CountChip value={row.fake} label="fake" color="#FF5C7A" />}
        {row.left > 0 && <CountChip value={row.left} label="left" color="#FFB547" />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function InviteSettings({ guildId }) {
  /* null = demo/fallback mode (guest, in flight, or fetch failure) */
  const [leaderboard, setLeaderboard] = useState(null);
  /* undefined = still loading, null = load failed, [] = server has none configured */
  const [milestones, setMilestones] = useState(undefined);
  const [roleMap, setRoleMap] = useState({});

  useEffect(() => {
    if (!guildId) {
      setLeaderboard(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/guilds/${guildId}/invites/leaderboard`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setLeaderboard(
          (Array.isArray(data?.leaderboard) ? data.leaderboard : []).map(mapInviteRow)
        );
      } catch (err) {
        if (cancelled) return;
        console.warn(
          "[InviteSettings] Failed to load invite leaderboard — showing demo data:",
          err
        );
        setLeaderboard(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  /* milestone roles — persisted in inviteConfig.rankRewards (GET /invites) */
  useEffect(() => {
    if (!guildId) {
      setMilestones(null);
      setRoleMap({});
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/guilds/${guildId}/invites`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const rows = mapMilestoneRewards(data?.config?.rankRewards);
        if (cancelled) return;
        setMilestones(rows);

        /* Display-only: resolve reward roleIds to names/colors via GET /roles (5-min cached server-side). */
        if (rows.some((m) => m.roleId)) {
          try {
            const rres = await fetch(`/api/guilds/${guildId}/roles`);
            if (!rres.ok) throw new Error(`HTTP ${rres.status}`);
            const rdata = await rres.json();
            if (cancelled) return;
            const map = {};
            (Array.isArray(rdata?.roles) ? rdata.roles : []).forEach((role) => {
              if (role?.id != null) map[String(role.id)] = role;
            });
            setRoleMap(map);
          } catch {
            /* silent — milestones fall back to muted short role ids */
          }
        } else {
          setRoleMap({});
        }
      } catch (err) {
        if (cancelled) return;
        console.warn("[InviteSettings] Failed to load invite milestones — showing demo data:", err);
        setMilestones(null);
        setRoleMap({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  const isReal = leaderboard !== null;

  const sums = isReal
    ? leaderboard.reduce(
        (acc, r) => ({
          invites: acc.invites + r.invites,
          fake: acc.fake + r.fake,
          left: acc.left + r.left,
          valid: acc.valid + r.valid,
        }),
        { invites: 0, fake: 0, left: 0, valid: 0 }
      )
    : null;

  const stats = isReal
    ? REAL_STATS.map((s) => ({
        label: s.label,
        note: leaderboard.length > 0 ? s.note(leaderboard.length) : "no inviters tracked yet",
        color: s.color,
        icon: s.icon,
        value: sums[s.key],
      }))
    : STATS;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-violet">
            <Mail className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[15px]">Invite Tracker &amp; Milestone Rewards</h2>
            <p className="card-sub mt-0.5">
              Track real vs fake invites, prevent self-invite cheating, and award automatic
              milestone roles.
            </p>
          </div>
        </div>
        <span className="chip chip-cyan">Invite tracker</span>
      </motion.div>

      {/* Stats summary */}
      <motion.div
        variants={stagger}
        className={
          isReal
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            : "grid grid-cols-1 gap-4 sm:grid-cols-3"
        }
      >
        {stats.map((s, i) => (
          <StatCard key={s.label} s={s} index={i} />
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Invite leaderboard — real mode only (no demo rows exist for this section) */}
        {isReal && (
          <motion.div variants={rise} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile-blue h-9 w-9 rounded-[12px]">
                <Users className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Top inviters</h3>
                <p className="card-sub mt-0.5">Ranked by tracked invites — top {leaderboard.length}</p>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="empty-state mt-4">
                <span className="empty-state-icon">
                  <Users className="h-4 w-4" />
                </span>
                <span className="empty-state-title">No tracked invites yet</span>
                <span>Invites will appear here once members start inviting.</span>
              </div>
            ) : (
              <div className="mt-4 space-y-1.5">
                {leaderboard.map((row, i) => (
                  <InviteRow key={row.userId || i} row={row} rank={i + 1} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Milestone roles */}
        <motion.div variants={rise} className="glass-card p-5">
          <div className="flex items-center gap-3">
            <span className="icon-tile icon-tile-amber h-9 w-9 rounded-[12px]">
              <Award className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Invite Milestone Role Rewards</h3>
              <p className="card-sub mt-0.5">Granted the moment a member hits the threshold</p>
            </div>
          </div>

          {milestones && milestones.length > 0 ? (
            <div className="mt-4 space-y-1.5">
              {milestones.map((m, i) => {
                const info = m.roleId ? roleMap[m.roleId] : null;
                const resolvedName =
                  info && typeof info.name === "string" && info.name ? info.name : null;
                const label = m.roleName || resolvedName;
                const color = info ? roleDotColor(info.color) : m.color;
                return (
                  <div
                    key={m.roleId || `${m.invites}-${i}`}
                    className="list-row gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">
                        {m.invites
                          ? `${m.invites} Invite${m.invites === 1 ? "" : "s"} Required`
                          : "Invite milestone"}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        Granted automatically when a member reaches the threshold
                      </div>
                    </div>
                    <span
                      className="ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        borderColor: `${color}40`,
                        color,
                        background: `${color}12`,
                      }}
                    >
                      {label ? `@${label.replace(/^@/, "")}` : shortUserId(m.roleId)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : !isReal ? (
            <div className="mt-4 space-y-1.5">
              {MILESTONES.map((m) => (
                <div key={m.invites} className="list-row gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">{m.invites} Invites Required</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      Granted to {m.granted} members
                    </div>
                  </div>
                  <span
                    className="ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      borderColor: `${m.color}40`,
                      color: m.color,
                      background: `${m.color}12`,
                    }}
                  >
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state mt-4">
              <span className="empty-state-icon">
                <Award className="h-4 w-4" />
              </span>
              <span className="empty-state-title">
                {milestones === undefined
                  ? "Loading milestone roles…"
                  : milestones === null
                    ? "Couldn't load milestone roles right now"
                    : "No milestone roles configured yet"}
              </span>
              <span>
                {milestones === undefined
                  ? "Reading this server's invite configuration."
                  : milestones === null
                    ? "Reopen this page to retry — nothing here can be edited from the dashboard."
                    : "This server has no invite milestones saved — configure them from the bot."}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
