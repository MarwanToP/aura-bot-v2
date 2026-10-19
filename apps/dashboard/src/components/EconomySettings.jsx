"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  ShoppingBag,
  Plus,
  Trash2,
  DollarSign,
  Save,
  CheckCircle2,
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

/* ──────────────── static data (humanized fallback — guest mode / fetch failure) ──────────────── */

const ECONOMY_STATS = [
  { label: "Total Economy Accounts", value: "9,318" },
  { label: "Total Server Balance", value: "₳ 18,462,350" },
  { label: "Total Bank Savings", value: "₳ 12,904,880" },
  { label: "Daily Reward", value: "₳ 250" },
];

const INITIAL_SHOP_ITEMS = [
  { id: 1, name: "VIP Lounge Access", price: 7500, stock: 10 },
  { id: 2, name: "Custom Nickname", price: 1200, stock: -1 },
  { id: 3, name: "Custom Color Role", price: 3000, stock: 5 },
  { id: 4, name: "Retro Game Night Ticket", price: 500, stock: 50 },
];

/* ────────────────────────────── api / view helpers ────────────────────────────── */

const clone = (v) => JSON.parse(JSON.stringify(v));

const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

const fmtAmount = (v) => `₳ ${toInt(v).toLocaleString("en-US")}`;

/* GET /economy stats → stat card rows (real numbers only) */
function buildStatCards(stats) {
  return [
    { label: "Total Economy Accounts", value: toInt(stats?.accounts).toLocaleString("en-US") },
    { label: "Total Server Balance", value: fmtAmount(stats?.totalBalance) },
    { label: "Total Bank Savings", value: fmtAmount(stats?.totalBank) },
    { label: "Total Earned", value: fmtAmount(stats?.totalEarned) },
  ];
}

/* GET/POST /economy/shop item → view row (stock null = unlimited) */
function mapShopItem(item) {
  return {
    id: item.id,
    name: item.name || "Unnamed item",
    price: toInt(item.price),
    stock: item.stock == null ? null : toInt(item.stock),
    roleId: item.roleId ?? null,
    enabled: item.enabled !== false,
  };
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function EconomySettings({ guildId }) {
  const [shopItems, setShopItems] = useState(() => clone(INITIAL_SHOP_ITEMS));
  const [stats, setStats] = useState(() => clone(ECONOMY_STATS));
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /* real data — stats + shop items; demo arrays stay as fallback for guest mode / fetch failure */
  useEffect(() => {
    if (!guildId) return undefined; // guest/no-guild mode: keep humanized demo, no fetch

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/guilds/${guildId}/economy`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data?.stats || typeof data.stats !== "object") {
          throw new Error("Malformed economy payload");
        }
        if (cancelled) return;
        setStats(buildStatCards(data.stats));
      } catch (err) {
        if (cancelled) return;
        console.warn("[EconomySettings] Failed to load economy stats — showing demo data:", err);
        setStats(clone(ECONOMY_STATS));
      }
    })();

    (async () => {
      try {
        const res = await fetch(`/api/guilds/${guildId}/economy/shop`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data?.items)) throw new Error("Malformed shop payload");
        if (cancelled) return;
        // Disabled items (soft-removed — no DELETE route this wave) stay hidden.
        setShopItems(data.items.filter((item) => item && item.enabled !== false).map(mapShopItem));
      } catch (err) {
        if (cancelled) return;
        console.warn("[EconomySettings] Failed to load shop items — showing demo data:", err);
        setShopItems(clone(INITIAL_SHOP_ITEMS));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [guildId]);

  const addItem = async () => {
    if (!guildId) {
      setShopItems((items) => [
        ...items,
        { id: Date.now(), name: "Raffle Ticket", price: 500, stock: 100 },
      ]);
      showToast("Shop item added — set its price and stock");
      return;
    }

    try {
      const res = await fetch(`/api/guilds/${guildId}/economy/shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Raffle Ticket", price: 500, stock: 100 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.item) {
        showToast(data.error || "Failed to add shop item");
        return;
      }
      setShopItems((items) => [...items, mapShopItem(data.item)]);
      showToast("Shop item added — set its price and stock");
    } catch (err) {
      console.warn("[EconomySettings] Failed to add shop item:", err);
      showToast("Network error while adding shop item");
    }
  };

  const removeItem = async (id) => {
    if (!guildId) {
      setShopItems((items) => items.filter((item) => item.id !== id));
      showToast("Item removed from the shop");
      return;
    }

    const target = shopItems.find((item) => item.id === id);
    if (!target) return;

    try {
      // No DELETE route for shop items this wave — removal = upsert with enabled:false.
      const res = await fetch(`/api/guilds/${guildId}/economy/shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: target.id,
          name: target.name,
          price: target.price,
          stock: target.stock,
          roleId: target.roleId ?? null,
          enabled: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.item) {
        showToast(data.error || "Failed to remove shop item");
        return;
      }
      setShopItems((items) => items.filter((item) => item.id !== target.id));
      showToast("Item removed from the shop");
    } catch (err) {
      console.warn("[EconomySettings] Failed to remove shop item:", err);
      showToast("Network error while removing shop item");
    }
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
            className="panel fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="h-4 w-4 text-[#39D98A]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <Coins className="h-4 w-4" />
            </span>
            Economy &amp; Shop
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            {guildId
              ? "Live economy totals and the role shop for this server. Currency, daily rewards, and multipliers are managed from the bot."
              : "Server currency, daily rewards, and the role shop for Crystal Realm."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            /* Guest demo keeps its original feedback. In real mode this control is
               disabled: there is nothing here the API can persist — the economy config
               lives in GuildSettings and is only editable from the bot. */
            if (!guildId) showToast("Economy settings saved — the shop is live");
          }}
          disabled={Boolean(guildId)}
          title={
            guildId
              ? "Managed from the bot — currency, daily rewards, and multipliers aren't editable here"
              : undefined
          }
          className={`inline-flex items-center gap-2 rounded-lg bg-[#7C5CFF] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_0_18px_rgba(124,92,255,0.35)] transition-colors hover:bg-[#6a4cf0]${
            guildId ? " cursor-not-allowed opacity-50" : ""
          }`}
        >
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Economy stats */}
        <motion.div variants={rise} className="panel p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <DollarSign className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white">Economy Stats</h3>
              <p className="mt-1 text-xs text-slate-500">Balances across all members</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 transition-colors hover:bg-white/[0.04]"
              >
                <span className="text-[11px] text-slate-400">{s.label}</span>
                <span className="shrink-0 text-xs font-bold text-white tabular-nums">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Shop items */}
        <motion.div variants={rise} className="panel p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-white">Shop Items</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Roles and perks members can buy with ₳
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add Item
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {shopItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 transition-colors hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white">{item.name}</span>
                  <span className="ml-3 text-[10px] text-slate-500">
                    Stock: {item.stock == null || item.stock === -1 ? "∞" : item.stock}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs font-bold text-[#7C5CFF] tabular-nums">
                    ₳ {item.price.toLocaleString("en-US")}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                    className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-[#FF5C7A]/10 hover:text-[#FF5C7A]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {shopItems.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-8 text-center text-[11px] text-slate-600">
                The shop is empty — add an item to get started.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
