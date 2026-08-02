"use client";

import React, { useState } from "react";
import { Mic, Plus, Settings, Lock, Volume2, Shield } from "lucide-react";

export default function TempVoiceSettings() {
  const [hubChannel, setHubChannel] = useState("➕ Join to Create");
  const [channelPrefix, setChannelPrefix] = useState("🔊 {user}'s Room");
  const [defaultLimit, setDefaultLimit] = useState(5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Mic className="w-5 h-5 text-purple-400" />
            Temporary Voice Generator (tempvoice.xyz)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            "Join to Create" voice channels with automated user control panels for locking, renaming, and bitrate configuration.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="dark-panel p-6 space-y-5">
        <h3 className="text-sm font-extrabold text-white border-b border-[#1e2333] pb-3">
          Voice Hub Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
          <div className="space-y-2">
            <label htmlFor="hub-channel-name" className="text-zinc-400 font-bold">Hub Channel Name:</label>
            <input
              id="hub-channel-name"
              name="hubChannelName"
              type="text"
              value={hubChannel}
              onChange={(e) => setHubChannel(e.target.value)}
              className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-3.5 py-2 text-white font-mono"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="channel-prefix-template" className="text-zinc-400 font-bold">Created Channel Name Template:</label>
            <input
              id="channel-prefix-template"
              name="channelPrefixTemplate"
              type="text"
              value={channelPrefix}
              onChange={(e) => setChannelPrefix(e.target.value)}
              className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-3.5 py-2 text-purple-400 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0b0d14] border border-[#1e2333] text-xs">
          <label htmlFor="temp-voice-user-limit" className="text-zinc-300 font-bold">Default User Limit:</label>
          <input
            id="temp-voice-user-limit"
            name="tempVoiceUserLimit"
            type="number"
            value={defaultLimit}
            onChange={(e) => setDefaultLimit(Number(e.target.value))}
            className="w-16 bg-[#121520] border border-[#1e2333] rounded-lg px-2.5 py-1 text-white font-mono text-center"
          />
        </div>
      </div>
    </div>
  );
}
