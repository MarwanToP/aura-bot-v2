"use client";

import React from 'react';

export default function ToggleSwitch({ enabled, onToggle, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle && onToggle(!enabled)}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer disabled:opacity-50 ${
        enabled ? 'bg-purple-600 justify-end' : 'bg-slate-700 justify-start'
      }`}
    >
      <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
    </button>
  );
}
