"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Trash2, ToggleLeft, ToggleRight, Save } from "lucide-react";

export default function AutoResponderSettings() {
  const [responders, setResponders] = useState([
    { id: 1, trigger: 'hello', response: 'Hey there! 👋 Welcome to the server!', matchType: 'contains', enabled: true },
    { id: 2, trigger: '!rules', response: 'Please read the rules in <#102837465918273645>', matchType: 'exact', enabled: true },
  ]);

  const toggleResponder = (id) => {
    setResponders(responders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            Auto Responder
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Automatic replies when users send specific words or phrases.</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Responder
        </motion.button>
      </div>

      <div className="space-y-3">
        {responders.map(r => (
          <div key={r.id} className="dark-panel p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">{r.matchType}</span>
                  <span className="text-sm font-bold text-white">Trigger: "{r.trigger}"</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${r.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-500/20 text-zinc-400'}`}>
                    {r.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-2 ml-1">→ {r.response}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button aria-label="Toggle auto responder" onClick={() => toggleResponder(r.id)}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${r.enabled ? 'bg-emerald-600/20 text-emerald-400' : 'bg-zinc-700/20 text-zinc-400'}`}>
                  {r.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button aria-label="Delete auto responder" className="p-2 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
