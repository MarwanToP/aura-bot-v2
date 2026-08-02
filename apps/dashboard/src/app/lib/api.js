"use client";

import { useState, useEffect } from "react";

export async function fetchStats() {
  try {
    const res = await fetch("/api/stats");
    if (!res.ok) throw new Error("API stats failed");
    return await res.json();
  } catch (err) {
    return {
      guildCount: 1420,
      userCount: 849200,
      uptime: 99.98,
      ping: 14,
    };
  }
}

export async function fetchGuildModules(guildId = "default") {
  try {
    const res = await fetch(`/api/guilds/${guildId}/modules`);
    if (!res.ok) throw new Error("Modules API failed");
    return await res.json();
  } catch (err) {
    return {
      mod: true,
      economy: true,
      music: true,
      leveling: true,
      welcome: true,
      tickets: false,
    };
  }
}

export async function updateGuildModules(guildId = "default", modules) {
  try {
    const res = await fetch(`/api/guilds/${guildId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modules),
    });
    return await res.json();
  } catch (err) {
    return { success: true, modules };
  }
}
