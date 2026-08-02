"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Lock, UserX, AlertTriangle, Key, Bot, Eye, RefreshCw } from "lucide-react";

export default function SecuritySettings({ guildId = "1" }) {
  const [antiNuke, setAntiNuke] = useState(true);
  const [captchaGate, setCaptchaGate] = useState(true);
  const [minAccountAge, setMinAccountAge] = useState(7);
  const [antiBotJoin, setAntiBotJoin] = useState(true);
  const [massBanLimit, setMassBanLimit] = useState(5);
  const [massRoleDeleteLimit, setMassRoleDeleteLimit] = useState(3);
  const [quarantineRole, setQuarantineRole] = useState("@Quarantine");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            Security Shield & Anti-Nuke Control (Wicks & SecurityBot)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Enterprise defense against unauthorized bot invites, mass-deletions, raids, and rogue admin actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold">
            SHIELD ACTIVE
          </span>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Anti-Nuke & Mass Action Protection */}
        <div className="dark-panel p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#1e2333] pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Anti-Nuke Protection</h3>
                <p className="text-[11px] text-zinc-400">Automatically ban administrators who attempt mass destruction.</p>
              </div>
            </div>
            <button
              onClick={() => setAntiNuke(!antiNuke)}
              className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${
                antiNuke ? "bg-purple-600" : "bg-[#1e2333]"
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${antiNuke ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="space-y-4 text-xs font-medium">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
              <label htmlFor="mass-ban-limit" className="text-zinc-300">Mass Ban Threshold (per 10 sec):</label>
              <input
                id="mass-ban-limit"
                name="massBanLimit"
                type="number"
                value={massBanLimit}
                onChange={(e) => setMassBanLimit(Number(e.target.value))}
                className="w-16 bg-[#121520] border border-[#1e2333] rounded-lg px-2.5 py-1 text-white font-mono text-center focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
              <label htmlFor="mass-role-limit" className="text-zinc-300">Mass Role Delete Limit:</label>
              <input
                id="mass-role-limit"
                name="massRoleDeleteLimit"
                type="number"
                value={massRoleDeleteLimit}
                onChange={(e) => setMassRoleDeleteLimit(Number(e.target.value))}
                className="w-16 bg-[#121520] border border-[#1e2333] rounded-lg px-2.5 py-1 text-white font-mono text-center focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
              <span className="text-zinc-300 font-medium">Block Unauthorized Bot Additions</span>
              <button
                onClick={() => setAntiBotJoin(!antiBotJoin)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                  antiBotJoin ? "bg-emerald-600" : "bg-[#1e2333]"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${antiBotJoin ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Verification & Anti-Raid Gate */}
        <div className="dark-panel p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#1e2333] pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Captcha Verification Gate</h3>
                <p className="text-[11px] text-zinc-400">Require web/button captcha before unlocking channels.</p>
              </div>
            </div>
            <button
              onClick={() => setCaptchaGate(!captchaGate)}
              className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${
                captchaGate ? "bg-purple-600" : "bg-[#1e2333]"
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${captchaGate ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="space-y-4 text-xs font-medium">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
              <label htmlFor="min-account-age" className="text-zinc-300">Minimum Account Age (Days):</label>
              <input
                id="min-account-age"
                name="minAccountAge"
                type="number"
                value={minAccountAge}
                onChange={(e) => setMinAccountAge(Number(e.target.value))}
                className="w-16 bg-[#121520] border border-[#1e2333] rounded-lg px-2.5 py-1 text-white font-mono text-center focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
              <label htmlFor="quarantine-role" className="text-zinc-300">Quarantine Role Name:</label>
              <input
                id="quarantine-role"
                name="quarantineRole"
                type="text"
                value={quarantineRole}
                onChange={(e) => setQuarantineRole(e.target.value)}
                className="w-32 bg-[#121520] border border-[#1e2333] rounded-lg px-2.5 py-1 text-purple-400 font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-[#1e2333] flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-2.5 rounded-xl gradient-active-btn text-white font-bold text-xs shadow-lg"
        >
          Save Security Settings
        </motion.button>
      </div>
    </div>
  );
}
