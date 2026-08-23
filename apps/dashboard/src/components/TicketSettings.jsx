"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Ticket, Plus, Trash2, FileText, CheckCircle2, MessageSquare, Shield, Clock } from "lucide-react";

export default function TicketSettings() {
  const [panels, setPanels] = useState([
    { id: "1", title: "General Support", category: "Support", channel: "#tickets", claimSystem: true },
    { id: "2", title: "Billing & Subscriptions", category: "Billing", channel: "#billing-tickets", claimSystem: true },
  ]);

  const [newTitle, setNewTitle] = useState("");

  const addPanel = () => {
    if (!newTitle.trim()) return;
    setPanels([...panels, { id: String(Date.now()), title: newTitle, category: "General", channel: "#tickets", claimSystem: true }]);
    setNewTitle("");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Ticket className="w-5 h-5 text-purple-400" />
            Multi-Panel Ticket Tool (TicketTool.xyz)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Build interactive support ticket panels, staff claim workflows, and HTML web transcripts.
          </p>
        </div>
        <span className="text-xs font-mono px-3.5 py-1.5 rounded-xl bg-[#121520] border border-[#1e2333] text-purple-400 font-bold">
          {panels.length} ACTIVE PANELS
        </span>
      </div>

      {/* New Panel Creator */}
      <div className="dark-panel p-5 flex items-center gap-3">
        <label htmlFor="new-ticket-panel-title" className="sr-only">New Panel Title</label>
        <input
          id="new-ticket-panel-title"
          name="newTicketPanelTitle"
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Enter new panel title (e.g. VIP Support Panel)..."
          className="flex-1 bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={addPanel}
          className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Panel</span>
        </motion.button>
      </div>

      {/* Ticket Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {panels.map((p) => (
          <div key={p.id} className="dark-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2333] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">{p.title}</h3>
                  <span className="text-[11px] text-zinc-400 font-mono">{p.channel}</span>
                </div>
              </div>
              <button
                type="button"
                aria-label="Delete panel"
                onClick={() => setPanels(panels.filter((x) => x.id !== p.id))}
                className="p-2 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                <span className="text-zinc-400">Claim System:</span>
                <span className="text-emerald-400 font-bold">ENABLED</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                <span className="text-zinc-400">HTML Transcripts:</span>
                <span className="text-purple-400 font-bold">CLOUD SAVED</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
