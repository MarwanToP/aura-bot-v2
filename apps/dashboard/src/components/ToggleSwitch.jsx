"use client";

import React from 'react';

export default function ToggleSwitch({ enabled, onToggle, disabled = false, ariaLabel = "Toggle switch" }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={enabled}
      aria-label={ariaLabel}
      onClick={() => onToggle && onToggle(!enabled)}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
        enabled ? 'bg-purple-600 justify-end' : 'bg-slate-700 justify-start'
      }`}
    >
      <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
    </button>
  );
}
