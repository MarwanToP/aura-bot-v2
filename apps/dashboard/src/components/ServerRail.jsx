"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Fish, Feather, Code, Headphones, Plus } from "lucide-react";

const servers = [
  { id: "moon", name: "MOON (Active Server)", icon: Moon, color: "from-emerald-600 to-amber-600", textColor: "text-emerald-300", active: true },
  { id: "shark", name: "Blue Shark Gaming", icon: Fish, color: "from-cyan-600 to-emerald-600", textColor: "text-cyan-300", active: false },
  { id: "bird", name: "Bird Realm", icon: Feather, color: "from-amber-600 to-orange-600", textColor: "text-amber-300", active: false },
  { id: "dev", name: "Developers Hub", icon: Code, color: "from-violet-600 to-emerald-600", textColor: "text-violet-300", active: false },
  { id: "lofi", name: "Lofi Sanctuary", icon: Headphones, color: "from-pink-600 to-amber-500", textColor: "text-pink-300", active: false },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
};

export default function ServerRail({ activeServer = "moon", onSelectServer }) {
  const [currentServer, setCurrentServer] = useState(activeServer);

  const handleSelect = (id) => {
    setCurrentServer(id);
    if (onSelectServer) onSelectServer(id);
  };

  return (
    <aside className="w-16 bg-[#07080d] border-r border-[#1e2333] flex flex-col items-center py-4 space-y-3 h-screen sticky top-0 z-50 select-none">
      
      {/* Bot Icon Brand Badge at Top */}
      <motion.div
        whileHover={{ scale: 1.08, rotate: 5 }}
        whileTap={{ scale: 0.92 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-amber-600 p-[1px] shadow-lg shadow-emerald-900/40 flex items-center justify-center cursor-pointer mb-1"
        title="Aura Bot Central"
      >
        <div className="w-full h-full bg-[#050608] rounded-[15px] flex items-center justify-center">
          <Moon className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
        </div>
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="w-8 h-[1px] bg-emerald-500/20"
      />

      {/* Server List Vertical Column */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 w-full flex flex-col items-center space-y-3 overflow-y-auto overflow-x-hidden py-1"
      >
        {servers.map((s) => {
          const Icon = s.icon;
          const isActive = currentServer === s.id;
          return (
            <motion.div key={s.id} variants={itemVariants} className="relative group flex items-center justify-center w-full">
              {/* Active Indicator Bar on Left Edge */}
              <span
                className={`absolute left-0 w-1 rounded-r-full bg-emerald-500 transition-all duration-200 ${
                  isActive ? "h-7 opacity-100" : "h-0 opacity-0 group-hover:h-4 group-hover:opacity-70"
                }`}
              />

              <motion.button
                whileHover={{ scale: 1.08, borderRadius: "14px" }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleSelect(s.id)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  isActive
                    ? `bg-gradient-to-tr ${s.color} border-2 border-emerald-400 shadow-emerald-950/60`
                    : `bg-[#0b0c10] border border-[#1a1f2e] hover:bg-gradient-to-tr ${s.color} hover:border-emerald-400/50`
                }`}
                title={s.name}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : s.textColor}`} />
              </motion.button>
            </motion.div>
          );
        })}

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="w-8 h-[1px] bg-[#1e2333] my-1"
        />

        {/* Add Server Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
          whileHover={{ scale: 1.12, rotate: 90 }}
          whileTap={{ scale: 0.92 }}
          className="w-10 h-10 rounded-2xl bg-[#121520] hover:bg-emerald-500/20 border border-[#1e2333] hover:border-emerald-500/40 text-zinc-400 hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
          title="Add Bot to New Server"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </motion.div>

    </aside>
  );
}
