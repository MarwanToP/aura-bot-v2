"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Coins, ShoppingBag, Plus, Trash2, DollarSign, BarChart3, Save } from "lucide-react";

export default function EconomySettings() {
  const [shopItems, setShopItems] = useState([
    { id: 1, name: 'VIP Role', price: 5000, stock: 10 },
    { id: 2, name: 'Custom Nickname', price: 1000, stock: -1 },
    { id: 3, name: 'Color Role', price: 2500, stock: 5 },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-purple-400" />
            Economy & Shop
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Server currency, daily rewards, and role shop.</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2">
          <Save className="w-4 h-4" /> Save
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="dark-panel p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><DollarSign className="w-4 h-4 text-purple-400" /> Economy Stats</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Economy Accounts', value: '1,284' },
              { label: 'Total Server Balance', value: '₳ 2,450,800' },
              { label: 'Total Bank Savings', value: '₳ 1,850,200' },
              { label: 'Daily Reward', value: '₳ 100' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                <span className="text-[11px] text-zinc-400">{s.label}</span>
                <span className="text-xs font-bold text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 dark-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-purple-400" /> Shop Items</h3>
            <button className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>
          <div className="space-y-2">
            {shopItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                <div>
                  <span className="text-xs font-bold text-white">{item.name}</span>
                  <span className="text-[10px] text-zinc-500 ml-3">Stock: {item.stock === -1 ? '∞' : item.stock}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-purple-400">₳ {item.price.toLocaleString()}</span>
                  <button aria-label="Delete item" className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
