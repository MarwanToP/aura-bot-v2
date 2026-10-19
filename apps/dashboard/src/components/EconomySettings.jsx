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
  Package,
  Users,
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

/* ────────────────────────────── shared atoms ────────────────────────────── */

function KpiTile({ label, value, icon: Icon, tone = "violet", compact = false }) {
  return (
    <div className="kpi-tile">
      <div className="flex items-start justify-between gap-3">
        <span className="kpi-label">{label}</span>
        <span className={`icon-tile icon-tile-${tone} h-9 w-9 rounded-[12px]`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className={`kpi-value mt-3 ${compact ? "text-[1.3rem]" : ""}`}>{value}</div>
    </div>
  );
}

const STAT_TONES = ["blue", "violet", "cyan", "green"];

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
            <Coins className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[15px]">Economy &amp; Shop</h2>
            <p className="card-sub mt-0.5">
              {guildId
                ? "Live economy totals and the role shop for this server. Currency, daily rewards, and multipliers are managed from the bot."
                : "Server currency, daily rewards, and the role shop for Crystal Realm."}
            </p>
          </div>
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
          className="btn-primary"
        >
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </motion.div>

      {/* Stat tiles */}
      <motion.div variants={rise} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <KpiTile
            key={s.label}
            label={s.label}
            value={s.value}
            icon={i === 0 ? Users : DollarSign}
            tone={STAT_TONES[i % STAT_TONES.length]}
            compact
          />
        ))}
      </motion.div>

      {/* Shop items */}
      <motion.div variants={rise} className="glass-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="icon-tile icon-tile-amber h-9 w-9 rounded-[12px]">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title">Shop Items</h3>
              <p className="card-sub mt-0.5">Roles and perks members can buy with ₳</p>
            </div>
          </div>
          <span className="chip chip-cyan tabular-nums">{shopItems.length} items</span>
        </div>

        {shopItems.length === 0 ? (
          <div className="empty-state mt-4">
            <span className="empty-state-icon">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <span className="empty-state-title">The shop is empty</span>
            <span>Add an item to get started.</span>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="text-right">Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {shopItems.map((item) => (
                  <tr key={item.id} className="data-row">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="icon-tile icon-tile-violet h-8 w-8 rounded-[10px]">
                          <Package className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-bold text-white">{item.name}</span>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="chip chip-violet tabular-nums">
                        ₳ {item.price.toLocaleString("en-US")}
                      </span>
                    </td>
                    <td>
                      <span className="chip tabular-nums">
                        {item.stock == null || item.stock === -1 ? "∞" : item.stock}
                      </span>
                    </td>
                    <td>
                      <span
                        className="toggle-track toggle-track-on cursor-not-allowed opacity-70"
                        title="Enabled items are managed from the bot — this list is read-only here"
                        aria-hidden="true"
                      >
                        <span className="toggle-thumb" />
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        title="Remove item"
                        className="btn-icon h-8 w-8 rounded-[10px] hover:text-[#F87171] hover:border-[#F87171]/40 hover:bg-[#F87171]/10 hover:shadow-none"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add item — the dashboard adds the standard starter item; item details live in the bot */}
        <div className="mt-4 rounded-2xl border border-dashed border-white/[0.10] bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="section-label">Add a shop item</span>
              <p className="mt-1 text-[10px] text-slate-500">
                Item names, prices, and stock are managed from the bot — this adds the standard
                starter item.
              </p>
            </div>
            <button type="button" onClick={addItem} className="btn-primary shrink-0">
              <Plus className="h-3.5 w-3.5" /> Add Item
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block min-w-0">
              <span className="section-label mb-1.5 block">Item name</span>
              <input
                type="text"
                value="Raffle Ticket"
                readOnly
                disabled
                title="Fixed by the dashboard shortcut — rename shop items from the bot"
                className="glass-input cursor-not-allowed opacity-70"
              />
            </label>
            <label className="block min-w-0">
              <span className="section-label mb-1.5 block">Price (₳)</span>
              <input
                type="text"
                value="500"
                readOnly
                disabled
                title="Fixed by the dashboard shortcut — set prices from the bot"
                className="glass-input cursor-not-allowed opacity-70 tabular-nums"
              />
            </label>
            <label className="block min-w-0">
              <span className="section-label mb-1.5 block">Stock</span>
              <select
                value="100"
                disabled
                title="Fixed by the dashboard shortcut — set stock from the bot"
                className="glass-select cursor-not-allowed opacity-70"
              >
                <option value="100">100 in stock</option>
              </select>
            </label>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
