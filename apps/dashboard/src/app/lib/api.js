"use client";

import { useState, useEffect } from "react";

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
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { success: false, error: body?.error || "Failed to save module settings" };
    }
    return await res.json();
  } catch (err) {
    return { success: false, error: "Network error" };
  }
}
