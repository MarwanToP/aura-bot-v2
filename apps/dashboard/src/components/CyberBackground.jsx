"use client";

import React from "react";

/**
 * Aurora canvas — the app-wide backdrop for the glass theme.
 *
 * Pure CSS/SVG (no canvas, no rAF): a near-black navy base (--aura-canvas
 * #05070D) with soft blurred aurora washes in deep blue / indigo / teal, a
 * bright accent lamp along the top edge, faint diagonal light veils, the
 * concentric orbital arcs from the reference, glossy floating orbs, a fine
 * grain overlay and a vignette.
 *
 * Every layer is pointer-events-none and the root is fixed at z-0, so the
 * atmosphere can never intercept a click and always sits behind the UI.
 *
 * The aurora washes are built from wide, multi-stop radial-gradients (no
 * filter:blur() on the big layers) so the fixed layer stays cheap to
 * composite; only the small veils and the teal counter-glow are blurred.
 * Motion is limited to slow transform-only drifts and is disabled by the
 * reduced-motion media query in globals.css.
 */
export default function CyberBackground() {
  return (
    <div
      className="aura-canvas fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* ── 1. Aurora washes — indigo / blue / teal radials in three corners ── */}
      <div className="aura-blob aura-blob-indigo animate-aurora-drift" />
      <div
        className="aura-blob aura-blob-blue animate-aurora-drift"
        style={{ animationDelay: "-12s", animationDuration: "42s" }}
      />
      <div
        className="aura-blob aura-blob-teal animate-aurora-drift"
        style={{ animationDelay: "-24s", animationDuration: "50s" }}
      />

      {/* Bright accent-blue lamp behind the top-left corner (brand / rail) */}
      <div
        className="aura-blob aura-blob-glow animate-aurora-drift"
        style={{ animationDelay: "-6s", animationDuration: "26s" }}
      />

      {/* Wide accent-blue wash hugging the bottom edge */}
      <div
        className="aura-blob aura-blob-bottom animate-aurora-drift"
        style={{ animationDuration: "48s" }}
      />

      {/* ── 2. Aurora lamp along the top edge (the bright veil over the frame) ── */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-[16vh] h-[38vh]"
        style={{
          background:
            "radial-gradient(ellipse 62% 100% at 50% 100%, rgba(76,125,255,0.22) 0%, rgba(124,92,255,0.10) 44%, rgba(5,7,13,0) 74%)",
        }}
      />

      {/* Faint teal counter-glow in the lower right */}
      <div
        className="pointer-events-none absolute -right-[18vw] bottom-[6vh] h-[52vh] w-[52vw] rounded-full blur-[90px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(14,58,74,0.55) 0%, rgba(14,58,74,0.16) 46%, rgba(14,58,74,0) 74%)",
        }}
      />

      {/* ── 3. Orbital arcs — the concentric rings sweeping through the corners ── */}
      <div className="pointer-events-none absolute -left-[36vw] -top-[40vw] h-[92vw] w-[92vw] rounded-full border border-[#4C7DFF]/10 shadow-[0_0_80px_rgba(76,125,255,0.10)]" />
      <div className="pointer-events-none absolute -left-[52vw] -top-[56vw] h-[124vw] w-[124vw] rounded-full border border-white/[0.035]" />
      <div className="pointer-events-none absolute -right-[30vw] -top-[34vw] h-[74vw] w-[74vw] rounded-full border border-[#7C5CFF]/10 shadow-[0_0_70px_rgba(124,92,255,0.10)]" />
      <div className="pointer-events-none absolute -left-[44vw] bottom-[-58vw] h-[104vw] w-[104vw] rounded-full border border-[#4C7DFF]/[0.07]" />

      {/* ── 4. Diagonal light veils (the aurora streaks across the reference) ── */}
      <div
        className="pointer-events-none absolute -left-[25vw] top-[4vh] h-[14vh] w-[140vw] rotate-[-17deg] blur-[70px]"
        style={{
          background:
            "linear-gradient(90deg, rgba(76,125,255,0) 0%, rgba(76,125,255,0.16) 40%, rgba(124,92,255,0.11) 66%, rgba(76,125,255,0) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute -left-[20vw] top-[58vh] h-[11vh] w-[130vw] rotate-[-12deg] blur-[80px]"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,7,13,0) 0%, rgba(34,211,238,0.10) 46%, rgba(76,125,255,0.07) 72%, rgba(5,7,13,0) 100%)",
        }}
      />

      {/* Faint diagonal light streaks */}
      <div className="aura-streak aura-streak-1 pointer-events-none" />
      <div className="aura-streak aura-streak-2 pointer-events-none" />
      <div className="aura-streak aura-streak-3 pointer-events-none" />

      {/* ── 5. Floating glossy orbs with a blue rim glow ── */}
      <span className="aura-orb aura-orb-1 animate-orb-float pointer-events-none" />
      <span className="aura-orb aura-orb-2 animate-orb-float pointer-events-none" />
      <span className="aura-orb aura-orb-3 animate-orb-float pointer-events-none" />

      {/* ── 6. Grain + vignette ── */}
      <div className="aura-noise" />
      <div className="aura-vignette" />
    </div>
  );
}
