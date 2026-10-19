"use client";

import { useState, useEffect } from "react";

/* Guest mode (no real guild) — the module flags the dashboard falls back to.
   Same shape the endpoint returns, so the caller's existing handling keeps working. */
const GUEST_MODULES = {
  mod: true,
  economy: true,
  music: true,
  leveling: true,
  welcome: true,
  tickets: false,
};

export async function fetchGuildModules(guildId = "default") {
  /* No real guild (guest visitor) — resolve with the same envelope without
     performing any request. "default" is the legacy no-guild sentinel, not a
     Discord guild id, so it is treated as guest too. */
  if (!guildId || guildId === "default") {
    return { ...GUEST_MODULES };
  }
  try {
    const res = await fetch(`/api/guilds/${guildId}/modules`);
    if (!res.ok) throw new Error("Modules API failed");
    return await res.json();
  } catch (err) {
    return { ...GUEST_MODULES };
  }
}

export async function updateGuildModules(guildId = "default", modules) {
  /* No real guild (guest visitor) — there is nothing to persist, so the panel
     must not fire a request (it would target /api/guilds/null/modules).
     The caller reverts the optimistic toggle and shows this message, which is
     the honest outcome: guest toggles are demo-only and are never saved. */
  if (!guildId || guildId === "default") {
    return {
      success: false,
      error: "Sign in with Discord to save module settings",
    };
  }
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
