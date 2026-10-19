"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  MessageCircle,
  Zap,
  Plus,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Clock,
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

/* ────────────────────────────── seed data ────────────────────────────── */

const INITIAL_RESPONDERS = [
  {
    id: 1,
    trigger: "hello",
    response: "Hey there! 👋 Welcome to Crystal Realm — grab your roles in #bot-commands.",
    matchType: "contains",
    enabled: true,
    uses: 128,
  },
  {
    id: 2,
    trigger: "!rules",
    response: "Server rules live in #announcements — give them a quick read before posting.",
    matchType: "exact",
    enabled: true,
    uses: 74,
  },
  {
    id: 3,
    trigger: "how do i appeal",
    response: "Open a ticket in #support-desk and the mod team will review your appeal within 24h.",
    matchType: "contains",
    enabled: false,
    uses: 31,
  },
];

/* Server row → view shape. The frozen API shape carries no `enabled`/usage columns,
   so those keys stay absent for real rows and their UI is only rendered when present. */
const mapResponder = (r) => ({
  id: r.id,
  trigger: r.trigger || "",
  response: r.response || "",
  matchType: r.triggerType || "contains",
  cooldown: Number(r.cooldown) || 0,
  useAI: Boolean(r.useAI),
  real: true,
});

/* ────────────────────────────── atoms ────────────────────────────── */

function StatCard({ label, value, icon: Icon, tone = "violet", index }) {
  const count = useCountUp(value, { duration: 700 + index * 90 });
  return (
    <div className="kpi-tile">
      <div className="flex items-start justify-between gap-3">
        <span className="kpi-label">{label}</span>
        <span className={`icon-tile icon-tile-${tone} h-9 w-9 rounded-[12px]`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="kpi-value mt-3">{Math.round(count).toLocaleString("en-US")}</div>
    </div>
  );
}

function Toggle({ enabled, onChange, title }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      title={title}
      aria-pressed={enabled}
      className={`toggle-track ${enabled ? "toggle-track-on" : ""}`}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function AutoResponderSettings({ guildId }) {
  const [responders, setResponders] = useState(INITIAL_RESPONDERS);
  const [showCreator, setShowCreator] = useState(false);
  const [newTrigger, setNewTrigger] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [newMatchType, setNewMatchType] = useState("contains");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /* request guard — only the latest load may write state */
  const requestSeq = useRef(0);

  /* real data — demo array is the fallback for guest mode / fetch failure */
  const loadResponders = useCallback(async () => {
    const requestId = ++requestSeq.current;
    if (!guildId) {
      setResponders(INITIAL_RESPONDERS);
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/auto-responders`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== requestSeq.current) return; // stale response from a previous guild
      setResponders((Array.isArray(data?.responders) ? data.responders : []).map(mapResponder));
    } catch (err) {
      if (requestId !== requestSeq.current) return; // stale failure — ignore
      console.warn("[AutoResponderSettings] Failed to load auto responders — showing demo data:", err);
      setResponders(INITIAL_RESPONDERS);
    }
  }, [guildId]);

  useEffect(() => {
    loadResponders();
    return () => {
      // Invalidate in-flight loads so a previous guild's response can't clobber state.
      requestSeq.current += 1;
    };
  }, [loadResponders]);

  const addResponder = async () => {
    if (!newTrigger.trim() || !newResponse.trim()) return;

    if (!guildId) {
      setResponders([
        ...responders,
        {
          id: Date.now(),
          trigger: newTrigger.trim(),
          response: newResponse.trim(),
          matchType: newMatchType,
          enabled: true,
          uses: 0,
        },
      ]);
      setNewTrigger("");
      setNewResponse("");
      setShowCreator(false);
      showToast("Auto responder added — it goes live immediately");
      return;
    }

    try {
      const res = await fetch(`/api/guilds/${guildId}/auto-responders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: newTrigger.trim(),
          triggerType: newMatchType,
          response: newResponse.trim(),
          cooldown: 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.responder) {
        showToast(data.error || "Failed to add responder");
        return;
      }
    } catch (err) {
      console.warn("[AutoResponderSettings] Failed to add responder:", err);
      showToast("Network error while adding responder");
      return;
    }

    setNewTrigger("");
    setNewResponse("");
    setShowCreator(false);
    showToast("Auto responder added — it goes live immediately");
    await loadResponders();
  };

  const toggleResponder = (id) => {
    setResponders(responders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteResponder = async (id) => {
    const target = responders.find((r) => r.id === id);
    if (!target) return;

    if (guildId && target.real) {
      try {
        const res = await fetch(`/api/guilds/${guildId}/auto-responders/${target.id}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(data.error || "Failed to delete responder");
          return;
        }
        await loadResponders();
      } catch (err) {
        console.warn("[AutoResponderSettings] Failed to delete responder:", err);
        showToast("Network error while deleting responder");
        return;
      }
      showToast("Auto responder deleted");
      return;
    }

    setResponders(responders.filter((r) => r.id !== id));
    showToast("Auto responder deleted");
  };

  /* usage stats exist only in demo/fallback rows — never fabricate them for real rows */
  const hasEnabledState = responders.some((r) => typeof r.enabled === "boolean");
  const hasUsageState = responders.some((r) => Number.isFinite(r.uses));
  const activeCount = hasEnabledState ? responders.filter((r) => r.enabled).length : 0;
  const totalReplies = hasUsageState ? responders.reduce((sum, r) => sum + (Number(r.uses) || 0), 0) : 0;

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
            <MessageSquare className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[15px]">Auto Responder</h2>
            <p className="card-sub mt-0.5">
              Automatic replies when members send specific words or phrases.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreator(!showCreator)}
          className={showCreator ? "btn-glass" : "btn-primary"}
        >
          {showCreator ? <XCircle className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showCreator ? "Cancel" : "New responder"}
        </button>
      </motion.div>

      {/* Stats — usage/enabled cards render only when the data actually carries those fields */}
      <motion.div variants={rise} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Responders" value={responders.length} icon={MessageSquare} tone="violet" index={0} />
        {hasEnabledState && (
          <StatCard label="Active now" value={activeCount} icon={Zap} tone="green" index={1} />
        )}
        {hasUsageState && (
          <StatCard label="Replies sent" value={totalReplies} icon={MessageCircle} tone="blue" index={2} />
        )}
      </motion.div>

      {/* Creator form */}
      <AnimatePresence initial={false}>
        {showCreator && (
          <motion.div
            key="creator"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3">
              <span className="icon-tile icon-tile-cyan h-9 w-9 rounded-[12px]">
                <Plus className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">New auto responder</h3>
                <p className="card-sub mt-0.5">
                  Pick a trigger phrase and the reply Aura should send.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block min-w-0">
                <span className="section-label mb-1.5 block">Trigger</span>
                <input
                  type="text"
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  placeholder="e.g. server invite"
                  className="glass-input"
                />
              </label>

              <div className="min-w-0">
                <span className="section-label mb-1.5 block">Match type</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "contains", label: "Contains" },
                    { id: "exact", label: "Exact match" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNewMatchType(opt.id)}
                      className={`seg-tab ${
                        newMatchType === opt.id ? "seg-tab-active" : ""
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block min-w-0 md:col-span-2">
                <span className="section-label mb-1.5 block">Response</span>
                <textarea
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  rows={2}
                  placeholder="The reply Aura should send…"
                  className="glass-textarea"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={addResponder}
                disabled={!newTrigger.trim() || !newResponse.trim()}
                className="btn-primary"
              >
                <Send className="h-3.5 w-3.5" />
                Add responder
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responders list */}
      {responders.length === 0 ? (
        <motion.div variants={rise} className="empty-state">
          <span className="empty-state-icon">
            <MessageSquare className="h-4 w-4" />
          </span>
          <span className="empty-state-title">No auto responders yet</span>
          <span>Add one above and Aura will start replying instantly.</span>
        </motion.div>
      ) : (
        <motion.div variants={rise} className="glass-card p-2">
          {responders.map((r) => (
            <div key={r.id} className="list-row items-start gap-3 px-3 py-3">
              <span
                className={`icon-tile mt-0.5 h-9 w-9 rounded-[12px] ${
                  r.enabled === false ? "icon-tile-blue" : "icon-tile-violet"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Trigger · <span className="font-mono">"{r.trigger}"</span>
                  </span>
                  <span className="chip chip-violet uppercase">{r.matchType}</span>
                  {r.useAI ? (
                    <span className="chip chip-cyan">
                      <Sparkles className="h-3 w-3" />
                      AI
                    </span>
                  ) : null}
                  {r.cooldown > 0 ? (
                    <span className="chip">
                      <Clock className="h-3 w-3" />
                      Cooldown {r.cooldown}s
                    </span>
                  ) : null}
                  {typeof r.enabled === "boolean" && (
                    <span className={`chip ${r.enabled ? "chip-green" : ""}`}>
                      {r.enabled ? "Active" : "Paused"}
                    </span>
                  )}
                </div>
                <p className="mt-2 truncate text-xs text-slate-300">
                  <span className="text-slate-600">→</span> {r.response}
                </p>
                {Number.isFinite(r.uses) && (
                  <p className="mt-1 text-[10px] text-slate-500">
                    Used {r.uses} time{r.uses === 1 ? "" : "s"}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                {typeof r.enabled === "boolean" && (
                  <Toggle
                    enabled={r.enabled}
                    onChange={() => toggleResponder(r.id)}
                    title="Pause or resume this responder"
                  />
                )}
                <button
                  type="button"
                  onClick={() => deleteResponder(r.id)}
                  title="Delete responder"
                  className="btn-icon h-8 w-8 rounded-[10px] hover:text-[#F87171] hover:border-[#F87171]/40 hover:bg-[#F87171]/10 hover:shadow-none"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
