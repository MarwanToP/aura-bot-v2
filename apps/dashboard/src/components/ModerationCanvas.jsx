"use client";

import React, { useState } from 'react';

export default function ModerationCanvas({ config }) {
  const [sensitivity, setSensitivity] = useState(config?.neuralModeration?.sensitivityScore || 75);
  const [action, setAction] = useState(config?.neuralModeration?.action || 'timeout');
  const [enabled, setEnabled] = useState(config?.neuralModeration?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/guilds/123456789012345678/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          neuralModerationEnabled: enabled,
          sensitivityScore: sensitivity,
          action,
        }),
      });
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-purple-500/20 backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Neural Auto-Moderation (Gemini 1.5 Flash)</h2>
            <p className="text-sm text-slate-400">AI-powered toxicity, scam, and phishing detection.</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              enabled ? 'bg-purple-600 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
          </button>
        </div>

        {/* Sensitivity Range Slider */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300 font-medium">Neural Sensitivity Threshold</span>
            <span className="text-purple-400 font-bold font-mono">{sensitivity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Relaxed (0%)</span>
            <span>Balanced (50%)</span>
            <span>Strict (100%)</span>
          </div>
        </div>

        {/* Escalation Action Selector */}
        <div className="space-y-2 mb-6">
          <label className="text-sm text-slate-300 font-medium block">Automated Escalation Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="warn" className="bg-slate-900">Warn Author</option>
            <option value="delete" className="bg-slate-900">Delete Message Only</option>
            <option value="timeout" className="bg-slate-900">Delete & 1-Hour Timeout</option>
            <option value="ban" className="bg-slate-900">Immediate Ban (Threat Level High)</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-sm shadow-lg shadow-purple-900/40 transition disabled:opacity-50"
        >
          {saving ? 'Saving Changes...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
