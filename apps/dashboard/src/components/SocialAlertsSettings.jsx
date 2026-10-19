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
  Twitch: { icon: Tv, color: "#7C5CFF", tone: "icon-tile-violet" },
  YouTube: { icon: Youtube, color: "#F87171", tone: "icon-tile-red" },
  Kick: { icon: Radio, color: "#34D399", tone: "icon-tile-green" },
  Reddit: { icon: Globe, color: "#FBBF24", tone: "icon-tile-amber" },
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
      aria-pressed={enabled}
      aria-label={enabled ? "Disable" : "Enable"}
      className={`toggle-track ${enabled ? "toggle-track-on" : ""}`}
    >
      <span className="toggle-thumb" />
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
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="icon-tile icon-tile-pink h-9 w-9 rounded-xl">
            <Bell className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title">Social Alerts</h2>
            <p className="card-sub mt-0.5">
              Automated live alerts for Twitch, YouTube, Kick, and Reddit — posted straight to your
              channels.
            </p>
          </div>
        </div>
        <span className="chip chip-green">
          <span className="status-dot status-dot-online" />
          {activeCount} of {alerts.length} active
        </span>
      </motion.div>

      {/* Alert cards */}
      <motion.div variants={stagger} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {alerts.map((al) => {
          const meta = PLATFORM_META[al.platform] || PLATFORM_META.Twitch;
          const Icon = meta.icon;
          return (
            <motion.div key={al.id} variants={rise} className="glass-card glass-card-hover p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`icon-tile h-10 w-10 rounded-xl ${meta.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="card-title truncate text-sm">
                      {al.platform} · {al.channel}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="chip chip-violet">{al.pingRole}</span>
                      <span className="chip">{al.destination}</span>
                    </div>
                  </div>
                </div>
                <Toggle enabled={al.enabled} onChange={() => toggleAlert(al.id)} />
              </div>

              <div className="hairline my-4" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-500">{al.lastEvent}</span>
                {al.live && al.enabled ? (
                  <span className="chip chip-red">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F87171] animate-pulse-dot" />
                    Live
                  </span>
                ) : (
                  <span className={`chip ${al.enabled ? "chip-green" : ""}`}>
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
