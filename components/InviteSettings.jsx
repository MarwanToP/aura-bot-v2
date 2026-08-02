"use client";

import React from "react";
import { Mail, Trophy, UserCheck, ShieldAlert, Award } from "lucide-react";

export default function InviteSettings() {
  const milestones = [
    { invites: 5, role: "@Regular Member", color: "text-blue-400" },
    { invites: 15, role: "@VIP Supporter", color: "text-purple-400" },
    { invites: 30, role: "@Invite Master", color: "text-amber-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-purple-400" />
            Invite Tracker & Milestone Rewards (invite-tracker.com)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Track real vs fake invites, prevent self-invite cheating, and award automatic milestone roles.
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="dark-panel p-5">
          <div className="text-[11px] text-zinc-400 font-mono font-bold uppercase">Total Server Invites</div>
          <div className="text-2xl font-black text-white mt-1">4,892</div>
        </div>
        <div className="dark-panel p-5">
          <div className="text-[11px] text-zinc-400 font-mono font-bold uppercase">Real Joins</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">4,120</div>
        </div>
        <div className="dark-panel p-5">
          <div className="text-[11px] text-zinc-400 font-mono font-bold uppercase">Fake / Left Invites</div>
          <div className="text-2xl font-black text-rose-400 mt-1">772</div>
        </div>
      </div>

      {/* Milestone Roles List */}
      <div className="dark-panel p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" />
          Invite Milestone Role Rewards
        </h3>

        <div className="space-y-3">
          {milestones.map((m) => (
            <div key={m.invites} className="flex items-center justify-between p-3.5 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
              <span className="text-xs font-bold text-white">{m.invites} Invites Required</span>
              <span className={`text-xs font-mono font-bold ${m.color}`}>{m.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
