"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Tv, Youtube, Radio, Globe, Bell } from "lucide-react";

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

/* ────────────────────────────── world data ────────────────────────────── */

const PLATFORM_META = {
  Twitch: { icon: Tv, color: "#7C5CFF" },
  YouTube: { icon: Youtube, color: "#FF5C7A" },
  Kick: { icon: Radio, color: "#39D98A" },
  Reddit: { icon: Globe, color: "#FFB547" },
};

const INITIAL_ALERTS = [
  {
    id: "1",
    platform: "Twitch",
    channel: "NovaStar",
    pingRole: "@Live Pings",
    destination: "#announcements",
    lastEvent: "last ping 2h ago",
    live: true,
    enabled: true,
  },
  {
    id: "2",
    platform: "YouTube",
    channel: "pixelForge",
    pingRole: "@Video Alerts",
    destination: "#announcements",
    lastEvent: "last upload 3d ago",
    live: false,
    enabled: true,
  },
  {
    id: "3",
    platform: "Kick",
    channel: "LunaByte",
    pingRole: "@Kick Pings",
    destination: "#general",
    lastEvent: "last ping 1d ago",
    live: false,
    enabled: true,
  },
  {
    id: "4",
    platform: "Reddit",
    channel: "r/CrystalRealm",
    pingRole: "@Reddit Feed",
    destination: "#bot-commands",
    lastEvent: "last post 6h ago",
    live: false,
    enabled: false,
  },
];

/* ────────────────────────────── api mapping ────────────────────────────── */

const PLATFORM_LABELS = { twitch: "Twitch", youtube: "YouTube", kick: "Kick", reddit: "Reddit" };

/* Server alert (bot shape) → card shape */
function toUiAlert(raw, index) {
  const platform = String(raw.platform || "Twitch");
  return {
    id: String(raw.id ?? index),
    platform:
      PLATFORM_LABELS[platform.toLowerCase()] ||
      platform.charAt(0).toUpperCase() + platform.slice(1),
    channel: raw.identifier || raw.channel || "Unknown",
    pingRole: raw.pingRole ?? (raw.pingRoleId ? `@${raw.pingRoleId}` : "No ping role"),
    destination: raw.destination ?? (raw.channelId ? `#${raw.channelId}` : "—"),
    lastEvent: raw.lastEvent || (raw.lastPostId ? "Recent post" : "No activity yet"),
    live: Boolean(raw.live),
    enabled: raw.enabled !== false,
  };
}

/* ────────────────────────────── atoms ────────────────────────────── */

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors cursor-pointer ${
        enabled ? "border-[#7C5CFF]/50 bg-[#7C5CFF]/80" : "border-white/[0.08] bg-white/[0.05]"
      }`}
      aria-pressed={enabled}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow ${
          enabled ? "left-[25px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

export default function SocialAlertsSettings({ guildId }) {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const rawAlerts = useRef(null);
  // Monotonic request id — only the latest load may write alerts state / rawAlerts.
  const alertsRequestSeq = useRef(0);

  const loadAlerts = useCallback(async () => {
    const requestId = ++alertsRequestSeq.current;
    if (!guildId) {
      rawAlerts.current = null;
      setAlerts(INITIAL_ALERTS);
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/social-alerts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== alertsRequestSeq.current) return; // stale — never keep (or re-POST) a previous guild's list
      const list = Array.isArray(data) ? data : Array.isArray(data?.alerts) ? data.alerts : [];
      rawAlerts.current = list;
      setAlerts(list.map(toUiAlert));
    } catch (err) {
      if (requestId !== alertsRequestSeq.current) return; // stale failure — ignore
      console.error("[SocialAlertsSettings] Failed to load alerts — showing demo data:", err);
      rawAlerts.current = null;
      setAlerts(INITIAL_ALERTS);
    }
  }, [guildId]);

  useEffect(() => {
    loadAlerts();
    return () => {
      // Invalidate in-flight loads so a stale list can never be kept or POSTed back.
      alertsRequestSeq.current += 1;
    };
  }, [loadAlerts]);

  const toggleAlert = async (id) => {
    const previous = alerts;
    const next = alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    setAlerts(next);

    // Guest mode / demo fallback — nothing to persist server-side.
    if (!guildId || !rawAlerts.current) return;

    const updated = next.find((a) => a.id === id);
    const rawNext = rawAlerts.current.map((a, i) =>
      String(a.id ?? i) === id ? { ...a, enabled: updated.enabled } : a
    );
    try {
      const res = await fetch(`/api/guilds/${guildId}/social-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alerts: rawNext }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      rawAlerts.current = rawNext;
    } catch (err) {
      console.error("[SocialAlertsSettings] Failed to save alerts:", err);
      setAlerts(previous); // revert — server state unchanged
    }
  };

  const activeCount = alerts.filter((a) => a.enabled).length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <Bell className="h-4 w-4" />
            </span>
            Social Alerts
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Automated live alerts for Twitch, YouTube, Kick, and Reddit — posted straight to your channels.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#39D98A]/25 bg-[#39D98A]/10 px-2.5 py-1 text-[10px] font-bold text-[#39D98A]">
          {activeCount} of {alerts.length} active
        </span>
      </motion.div>

      {/* Alert cards */}
      <motion.div variants={stagger} className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {alerts.map((al) => {
          const meta = PLATFORM_META[al.platform] || PLATFORM_META.Twitch;
          const Icon = meta.icon;
          return (
            <motion.div key={al.id} variants={rise} className="panel panel-hover p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: `${meta.color}40`,
                      backgroundColor: `${meta.color}1A`,
                      color: meta.color,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-white">
                      {al.platform} · {al.channel}
                    </h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold" style={{ color: meta.color }}>
                        {al.pingRole}
                      </span>
                      <span className="text-[10px] text-slate-600">→ {al.destination}</span>
                    </div>
                  </div>
                </div>
                <Toggle enabled={al.enabled} onChange={() => toggleAlert(al.id)} />
              </div>

              <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
                <span className="text-[10px] text-slate-500">{al.lastEvent}</span>
                {al.live && al.enabled ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF5C7A]/25 bg-[#FF5C7A]/10 px-2 py-0.5 text-[9px] font-bold text-[#FF5C7A]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C7A] animate-pulse-dot" />
                    LIVE
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-bold ${al.enabled ? "text-[#39D98A]" : "text-slate-600"}`}
                  >
                    {al.enabled ? "Active" : "Paused"}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
