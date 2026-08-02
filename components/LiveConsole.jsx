"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Play, Pause, Trash2, Circle } from "lucide-react";

const INITIAL_LOGS = [
  { id: 1, type: "INFO", time: "22:01:01", msg: "Aura Core initialized. Connected to Discord Gateway v10." },
  { id: 2, type: "CMD",  time: "22:01:04", msg: "User @Kaiser issued command /rank in #general (Guild: 939799976)" },
  { id: 3, type: "WARN", time: "22:01:08", msg: "Rate-limit threshold reached for YouTube RSS polling (retrying in 5s)." },
  { id: 4, type: "INFO", time: "22:01:12", msg: "Database connection pool healthy (Active: 14, Idle: 36)." },
  { id: 5, type: "CMD",  time: "22:01:15", msg: "User @Sora issued command /play 'Lofi Beats 24/7' in #Voice-1" },
];

const MOCK_MESSAGES = [
  { type: "INFO", msg: "Voice socket connection established on US-East-Primary worker." },
  { type: "CMD",  msg: "User @CyberAdmin issued command /clear 50 in #announcements" },
  { type: "WARN", msg: "Automod detected mass mention attempt from user ID 849301. Action: Timeout 10m." },
  { type: "INFO", msg: "Auto-backup snapshot #8912 created successfully (PostgreSQL + Redis)." },
  { type: "CMD",  msg: "User @Luna issued command /apply for Moderator Position." },
  { type: "INFO", msg: "Shard #4 heartbeat ack received (Latency: 18ms)." },
];

export default function LiveConsole() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [isPaused, setIsPaused] = useState(false);
  const [filterType, setFilterType] = useState("ALL");
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const randomMsg = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];

      setLogs((prev) => [
        ...prev.slice(-40),
        { id: Date.now(), type: randomMsg.type, time: timeStr, msg: randomMsg.msg },
      ]);
    }, 2400);

    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const filteredLogs = filterType === "ALL" ? logs : logs.filter((l) => l.type === filterType);

  const getTagBadge = (type) => {
    switch (type) {
      case "INFO":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      case "WARN":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "CMD":
        return "bg-[#5865F2]/15 text-[#5865F2] border-[#5865F2]/30";
      case "ERR":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <div className="rounded-3xl ios-glass-interactive p-5 shadow-2xl flex flex-col h-[420px] relative overflow-hidden">
      {/* Specular Highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Terminal Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <Circle className="w-3 h-3 text-rose-500 fill-rose-500" />
            <Circle className="w-3 h-3 text-amber-500 fill-amber-500" />
            <Circle className="w-3 h-3 text-emerald-500 fill-emerald-500" />
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-white/10 text-xs font-mono text-zinc-300">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">aura-bot-live.log</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tag Filter Pills */}
          <div className="hidden sm:flex items-center gap-1 ios-glass-pill p-1 rounded-xl text-[10px] font-mono">
            {["ALL", "INFO", "CMD", "WARN"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  filterType === t ? "bg-[#5865F2] text-white font-bold shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl ios-glass-pill text-xs font-mono text-zinc-200 hover:text-white transition-colors"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span className="font-bold">{isPaused ? "RESUME" : "PAUSE"}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setLogs([])}
            className="p-1.5 rounded-xl ios-glass-pill text-zinc-400 hover:text-rose-400 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Logs Scroll View with AnimatePresence */}
      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-1">
        <AnimatePresence initial={false}>
          {filteredLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex items-start gap-3 hover:bg-white/10 p-2 rounded-xl transition-colors backdrop-blur-md"
            >
              <span className="text-zinc-500 shrink-0 select-none text-[11px]">[{log.time}]</span>
              <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold select-none shrink-0 ${getTagBadge(log.type)}`}>
                [{log.type}]
              </span>
              <span className="text-zinc-200 break-all leading-relaxed">{log.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={terminalEndRef} />
      </div>

    </div>
  );
}
