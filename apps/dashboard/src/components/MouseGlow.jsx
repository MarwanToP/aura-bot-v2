"use client";

import { useEffect, useRef } from "react";

/**
 * Soft blue/violet spotlight that trails the cursor over the aurora canvas.
 *
 * Visual only: no state, no props, no data. The listener is skipped for
 * reduced-motion users and touch/coarse pointers, and the position is written
 * straight to the element transform (rAF-throttled) so it never re-renders
 * React. Size/colour live in the `.mouse-glow` recipe in globals.css.
 */
export default function MouseGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return undefined;
    if (typeof window.matchMedia !== "function") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    if (window.matchMedia("(pointer: coarse)").matches) return undefined;

    let frame = 0;
    let x = -640;
    let y = -640;

    const apply = () => {
      frame = 0;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const handleMove = (e) => {
      x = e.clientX - 320;
      y = e.clientY - 320;
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="mouse-glow fixed top-0 left-0 pointer-events-none z-0"
    />
  );
}
