"use client";

import React from "react";
import { motion } from "framer-motion";
import { UserPlus, Gift, Megaphone, RefreshCw, BarChart2, ChevronRight } from "lucide-react";

const actions = [
  { id: 1, label: "Add New Server", icon: UserPlus },
  { id: 2, label: "Create Giveaway", icon: Gift },
  { id: 3, label: "Broadcast Message", icon: Megaphone },
  { id: 4, label: "Sync Commands", icon: RefreshCw },
  { id: 5, label: "View Analytics", icon: BarChart2 },
];

export default function QuickActionsWidget() {
  return (
    <div className="dark-panel p-6 flex flex-col justify-between h-[340px]">
      
      {/* Header */}
      <h3 className="text-sm font-bold text-white tracking-wide mb-2">
        Quick Actions
      </h3>

      {/* Action Buttons List */}
      <div className="space-y-2 flex-1 flex flex-col justify-around">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <motion.button
              key={act.id}
              whileHover={{ x: 4, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0b0d14]/60 border border-[#1e2333] text-xs font-semibold text-zinc-300 hover:text-white transition-all"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-purple-400" />
                <span>{act.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </motion.button>
          );
        })}
      </div>

    </div>
  );
}
