"use client";

import React from "react";

/**
 * Aurora canvas — the app-wide backdrop for the glass theme.
 *
 * Pure CSS/SVG (no canvas, no rAF): near-black navy base (#05070D) with soft
 * blurred aurora washes in deep blue / indigo / teal, faint diagonal light
 * streaks, a few glossy floating orbs with a blue rim glow, fine grain and a
 * vignette. Everything is pointer-events-none and sits behind the UI at z-0.
 *
 * The softness comes from wide, multi-stop radial-gradients instead of
 * filter:blur() so the fixed layer stays cheap to composite. Motion is limited
 * to slow transform-only drifts and is disabled by the reduced-motion media
 * query in globals.css.
 */
export default function CyberBackground() {
  return (
    <div className="aura-canvas fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Aurora washes */}
      <div className="aura-blob aura-blob-indigo animate-aurora-drift" />
      <div
        className="aura-blob aura-blob-blue animate-aurora-drift"
        style={{ animationDelay: "-12s", animationDuration: "42s" }}
      />
      <div
        className="aura-blob aura-blob-teal animate-aurora-drift"
        style={{ animationDelay: "-24s", animationDuration: "50s" }}
      />

      {/* Bright corner glow (reference: the aurora "lamp" behind the sidebar) */}
      <div className="aura-blob aura-blob-glow" style={{ animationDuration: "26s" }} />

      {/* Wide accent-blue wash along the bottom edge */}
      <div className="aura-blob aura-blob-bottom" style={{ animationDuration: "48s" }} />

      {/* Faint diagonal light streaks */}
      <div className="aura-streak aura-streak-1" />
      <div className="aura-streak aura-streak-2" />
      <div className="aura-streak aura-streak-3" />

      {/* Floating glossy orbs with a blue rim glow */}
      <span className="aura-orb aura-orb-1 animate-orb-float" />
      <span className="aura-orb aura-orb-2 animate-orb-float" />
      <span className="aura-orb aura-orb-3 animate-orb-float" />

      {/* Grain + vignette */}
      <div className="aura-noise" />
      <div className="aura-vignette" />
    </div>
  );
}
