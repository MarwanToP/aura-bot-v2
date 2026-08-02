"use client";

import React, { useEffect, useRef } from "react";

export default function CyberBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let mouse = { x: -9999, y: -9999 };
    let tick = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });

    const NODE_COUNT = 80;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1.5,
      hue: Math.random() > 0.5 ? 270 : 190,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
    }));

    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        n.x += n.vx;
        n.y += n.vy;
        n.pulse += n.pulseSpeed;

        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          n.x -= dx * 0.003;
          n.y -= dy * 0.003;
        }

        const pulseSize = 1 + Math.sin(n.pulse) * 0.6;
        const drawRadius = n.radius * pulseSize;
        const alpha = 0.5 + Math.sin(n.pulse) * 0.3;

        ctx.beginPath();
        ctx.arc(n.x, n.y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${n.hue}, 80%, 70%, ${alpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, drawRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${n.hue}, 80%, 70%, ${alpha * 0.12})`;
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx2 = n.x - m.x;
          const dy2 = n.y - m.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < 180) {
            const lineAlpha = (1 - dist2 / 180) * 0.3;
            const avgHue = (n.hue + m.hue) / 2;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `hsla(${avgHue}, 70%, 60%, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("mouseleave", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.65 }}
    />
  );
}
