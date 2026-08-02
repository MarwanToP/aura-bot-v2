"use client";

import { useEffect, useRef } from "react";

export default function MouseGlow() {
  const glowRef = useRef(null);
  const pos = useRef({ x: -200, y: -200 });

  useEffect(() => {
    const handleMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX - 150}px, ${e.clientY - 150}px)`;
      }
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={glowRef}
      className="fixed top-0 left-0 w-[300px] h-[300px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none z-0 transition-transform duration-300 ease-out"
      style={{ willChange: "transform" }}
    />
  );
}
