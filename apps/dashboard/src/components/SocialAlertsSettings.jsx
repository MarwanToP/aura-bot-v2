"use client";

import React, { useState } from "react";
import { Tv, Youtube, Radio, Globe, Plus, Bell } from "lucide-react";

export default function SocialAlertsSettings() {
  const [alerts, setAlerts] = useState([
    { id: "1", platform: "Twitch", channel: "Shroud", pingRole: "@Stream Notification" },
    { id: "2", platform: "YouTube", channel: "Aura Official", pingRole: "@Subscriber" },
    { id: "3", platform: "Kick", channel: "xQc", pingRole: "@Kick Notification" },
    { id: "4", platform: "Reddit", channel: "r/Discord", pingRole: "@Reddit Feed" },
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-purple-400" />
            Social Alerts & Feeds (notifyme.bot)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure automated live stream notifications for Twitch, YouTube, Kick, and Reddit feeds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {alerts.map((al) => (
          <div key={al.id} className="dark-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2333] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">{al.platform}: {al.channel}</h3>
                  <span className="text-[10px] font-mono text-purple-400 font-bold">{al.pingRole}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
