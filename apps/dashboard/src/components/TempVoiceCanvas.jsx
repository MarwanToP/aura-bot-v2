"use client";

import React, { useState } from 'react';
import ToggleSwitch from './ToggleSwitch.jsx';

export default function TempVoiceCanvas({ config }) {
  const [template, setTemplate] = useState(config?.namingTemplate || "🔊 {user}'s Room");
  const [enabled, setEnabled] = useState(config?.enabled ?? true);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20 backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Dynamic TempVoice Hubs</h2>
            <p className="text-sm text-slate-400">Join-to-Create private on-demand voice rooms.</p>
          </div>
          <ToggleSwitch enabled={enabled} onToggle={setEnabled} />
        </div>

        {/* Naming Template Input */}
        <div className="space-y-2 mb-6">
          <label className="text-sm text-slate-300 font-medium block">Room Naming Template</label>
          <input
            type="text"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder="🔊 {user}'s Room"
          />
          <p className="text-xs text-slate-500">Variables supported: <code>{'{user}'}</code>, <code>{'{game}'}</code>, <code>{'{count}'}</code></p>
        </div>

        <button className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold text-sm shadow-lg shadow-purple-900/40">
          Save TempVoice Settings
        </button>
      </div>
    </div>
  );
}
