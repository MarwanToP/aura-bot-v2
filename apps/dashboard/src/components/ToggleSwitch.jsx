"use client";

import React from 'react';

export default function ToggleSwitch({ enabled, onToggle, disabled = false, ariaLabel = "Toggle switch" }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      type="button"
      disabled={disabled}
      onClick={() => onToggle && onToggle(!enabled)}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none ${
        enabled ? 'bg-purple-600 justify-end' : 'bg-slate-700 justify-start'
      }`}
    >
      <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
    </button>
  );
}
