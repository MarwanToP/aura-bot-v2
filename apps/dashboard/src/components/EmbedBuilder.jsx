"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Type,
  Image,
  Send,
  Plus,
  Trash2,
  Eye,
  Code,
  Bold,
  Italic,
  Underline,
  CheckCircle2,
  Bot,
} from "lucide-react";

/* ────────────────────────────── motion helpers ────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.03 } },
};

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/* ────────────────────────────── data ────────────────────────────── */

const COLOR_PRESETS = [
  { name: "Blurple", hex: "#5865F2" },
  { name: "Green", hex: "#57F287" },
  { name: "Yellow", hex: "#FEE75C" },
  { name: "Red", hex: "#ED4245" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Cyan", hex: "#00BFFF" },
  { name: "Orange", hex: "#FF7B2B" },
  { name: "Pink", hex: "#FF69B4" },
];

/* Channels the embed can be dispatched to. */
const CHANNELS = ["#general", "#announcements", "#bot-commands", "#support-desk"];

/* Only real URLs are ever handed to <img src>. */
const isUrl = (value) => /^https?:\/\/\S+$/i.test(String(value || "").trim());

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function EmbedBuilder() {
  const [embedTitle, setEmbedTitle] = useState("🔮 Welcome to Crystal Realm");
  const [embedDesc, setEmbedDesc] = useState(
    "You've just joined 12,645 members in Crystal Realm. Grab your roles in #general, say hi, and run /help to see everything Aura can do."
  );
  const [embedColor, setEmbedColor] = useState("#5865F2");
  const [embedAuthor, setEmbedAuthor] = useState("");
  const [embedFooter, setEmbedFooter] = useState("Crystal Realm • Aura v2.0");
  const [embedThumbnail, setEmbedThumbnail] = useState("");
  const [embedImage, setEmbedImage] = useState("");
  const [fields, setFields] = useState([
    { name: "Getting Started", value: "Run /help for the full command list", inline: true },
    { name: "Support", value: "Open a ticket in #support-desk", inline: true },
  ]);
  const [targetChannel, setTargetChannel] = useState("#general");
  const [showJson, setShowJson] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const addField = () => {
    setFields([
      ...fields,
      { name: "Community Nights", value: "Movie night every Friday at 8pm", inline: false },
    ]);
  };

  const removeField = (idx) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const updateField = (idx, key, value) => {
    const updated = [...fields];
    updated[idx] = { ...updated[idx], [key]: value };
    setFields(updated);
  };

  const embedPayload = {
    title: embedTitle,
    description: embedDesc,
    color: parseInt(embedColor.replace("#", ""), 16),
    author: embedAuthor ? { name: embedAuthor } : undefined,
    footer: embedFooter ? { text: embedFooter } : undefined,
    thumbnail: embedThumbnail ? { url: embedThumbnail } : undefined,
    image: embedImage ? { url: embedImage } : undefined,
    timestamp: showTimestamp ? new Date().toISOString() : undefined,
    fields: fields.filter((f) => f.name && f.value),
  };

  const hasThumb = isUrl(embedThumbnail);
  const hasImage = isUrl(embedImage);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="glass-dropdown fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-white shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-violet h-10 w-10 rounded-[14px]">
            <Palette className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title text-[17px]">Embed Message Builder</h2>
            <p className="card-sub mt-1 max-w-xl">
              Design rich embeds with a live preview — fields, images, thumbnails, and color presets.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            className="btn-glass"
          >
            <Code className="h-4 w-4" />
            {showJson ? "Preview" : "JSON"}
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => showToast(`Embed dispatched to ${targetChannel} — delivery confirmed`)}
            className="btn-primary"
          >
            <Send className="h-4 w-4" />
            Dispatch Embed
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left: Editor */}
        <motion.div variants={rise} className="min-w-0 space-y-4">
          <section className="glass-card rounded-[20px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="icon-tile icon-tile-violet h-10 w-10 rounded-[14px]">
                <Type className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Content</h3>
                <p className="card-sub mt-0.5">Author, title, description, and fields</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block min-w-0">
                <span className="section-label mb-1.5 block">Author</span>
                <input
                  type="text"
                  value={embedAuthor}
                  onChange={(e) => setEmbedAuthor(e.target.value)}
                  placeholder="Author name — e.g. Aurora"
                  className="glass-input"
                />
              </label>

              <label className="block min-w-0">
                <span className="section-label mb-1.5 block">Title</span>
                <input
                  type="text"
                  value={embedTitle}
                  onChange={(e) => setEmbedTitle(e.target.value)}
                  placeholder="Embed title"
                  className="glass-input"
                />
              </label>

              <label className="block min-w-0">
                <span className="section-label mb-1.5 block">Description</span>
                <textarea
                  value={embedDesc}
                  onChange={(e) => setEmbedDesc(e.target.value)}
                  rows={4}
                  placeholder="Embed description (supports markdown)"
                  className="glass-textarea resize-none"
                />
              </label>

              <div className="flex w-fit items-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1">
                <button
                  type="button"
                  title="Bold"
                  aria-label="Bold"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Italic"
                  aria-label="Italic"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Underline"
                  aria-label="Underline"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
                >
                  <Underline className="h-3.5 w-3.5" />
                </button>
                <span className="mx-1 h-5 w-px bg-white/[0.08]" />
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-[10px] font-bold text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
                >
                  LINK
                </button>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-[10px] font-bold text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
                >
                  CODE
                </button>
              </div>

              {/* Fields */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="section-label">Fields ({fields.length})</span>
                  <button
                    type="button"
                    onClick={addField}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition-colors hover:text-white cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Add field
                  </button>
                </div>
                <div className="custom-scrollbar max-h-56 space-y-2 overflow-y-auto pr-1">
                  {fields.map((field, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.12]"
                    >
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(idx, "name", e.target.value)}
                          placeholder="Field name"
                          className="glass-input"
                        />
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateField(idx, "value", e.target.value)}
                          placeholder="Field value"
                          className="glass-input text-slate-300"
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <label className="flex cursor-pointer items-center gap-2 text-[10px] text-slate-500">
                          <span
                            className={`toggle-track ${field.inline ? "toggle-track-on" : ""}`}
                            role="switch"
                            aria-checked={field.inline}
                            aria-label="Inline field"
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={field.inline}
                              onChange={(e) => updateField(idx, "inline", e.target.checked)}
                            />
                            <span className="toggle-thumb" />
                          </span>
                          Inline
                        </label>
                        <button
                          type="button"
                          onClick={() => removeField(idx)}
                          title="Remove field"
                          aria-label="Remove field"
                          className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-[#F87171]/10 hover:text-[#F87171] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <label className="block min-w-0">
                <span className="section-label mb-1.5 block">Footer</span>
                <input
                  type="text"
                  value={embedFooter}
                  onChange={(e) => setEmbedFooter(e.target.value)}
                  placeholder="Footer text"
                  className="glass-input"
                />
              </label>
            </div>
          </section>

          {/* Media */}
          <section className="glass-card rounded-[20px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="icon-tile icon-tile-blue h-10 w-10 rounded-[14px]">
                <Image className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="card-title">Media &amp; Color</h3>
                <p className="card-sub mt-0.5">Thumbnails, images, and the accent bar</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block min-w-0">
                  <span className="section-label mb-1.5 block">Thumbnail URL</span>
                  <input
                    type="text"
                    value={embedThumbnail}
                    onChange={(e) => setEmbedThumbnail(e.target.value)}
                    placeholder="Paste an image URL"
                    className="glass-input"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="section-label mb-1.5 block">Image URL</span>
                  <input
                    type="text"
                    value={embedImage}
                    onChange={(e) => setEmbedImage(e.target.value)}
                    placeholder="Paste an image URL"
                    className="glass-input"
                  />
                </label>
              </div>

              <div>
                <span className="section-label mb-2 block">Color</span>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={embedColor}
                    onChange={(e) => setEmbedColor(e.target.value)}
                    aria-label="Embed color"
                    className="h-9 w-9 cursor-pointer rounded-xl border border-white/[0.12] bg-transparent p-0.5"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setEmbedColor(c.hex)}
                        aria-label={c.name}
                        title={c.name}
                        className={`h-6 w-6 rounded-full border transition-transform duration-200 hover:scale-110 cursor-pointer ${
                          embedColor.toLowerCase() === c.hex.toLowerCase()
                            ? "border-white/80 ring-2 ring-[#7C5CFF]/70 ring-offset-2 ring-offset-[#05070D]"
                            : "border-white/15"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-xs text-slate-400">{embedColor}</span>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5">
                <span
                  className={`toggle-track ${showTimestamp ? "toggle-track-on" : ""}`}
                  role="switch"
                  aria-checked={showTimestamp}
                  aria-label="Show timestamp"
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showTimestamp}
                    onChange={(e) => setShowTimestamp(e.target.checked)}
                  />
                  <span className="toggle-thumb" />
                </span>
                <span className="text-xs text-slate-300">Show timestamp</span>
              </label>
            </div>
          </section>

          {/* Target Channel */}
          <section className="glass-card rounded-[20px] p-5">
            <span className="section-label mb-2 block">Target Channel</span>
            <div className="flex items-center gap-3">
              <select
                value={targetChannel}
                onChange={(e) => setTargetChannel(e.target.value)}
                className="glass-select flex-1"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => showToast(`Embed sent to ${targetChannel} — delivery confirmed`)}
                className="btn-primary shrink-0"
              >
                <Send className="h-4 w-4" />
                Send
              </motion.button>
            </div>
          </section>
        </motion.div>

        {/* Right: Preview */}
        <motion.div variants={rise} className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="icon-tile icon-tile-violet h-9 w-9 rounded-[13px]">
                <Eye className="h-4 w-4" />
              </span>
              <div>
                <h3 className="card-title">Live preview</h3>
                <p className="card-sub mt-0.5">Updates as you type.</p>
              </div>
            </div>
            <span className="chip chip-violet">Discord</span>
          </div>

          {showJson ? (
            <div className="glass-card rounded-[20px] p-5">
              <pre className="custom-scrollbar max-h-[600px] overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-slate-300">
                {JSON.stringify(embedPayload, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="glass-card rounded-[20px] p-4">
              <div className="flex items-start gap-3">
                <span className="avatar-ring grid h-10 w-10 shrink-0 place-items-center rounded-full">
                  <span className="grid h-full w-full place-items-center rounded-full bg-[#0A0F1A]">
                    <Bot className="h-4 w-4 text-[#BFD3FF]" />
                  </span>
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-white">Aura</span>
                    <span className="chip">BOT</span>
                    <span className="text-[10px] text-slate-500">now</span>
                  </div>

                  <div
                    className="relative mt-2 overflow-hidden rounded-xl border-l-4"
                    style={{ borderColor: embedColor, backgroundColor: "rgba(11,15,26,0.78)" }}
                  >
                    <div className={`min-w-0 space-y-3 p-4 ${hasThumb ? "pr-24" : ""}`}>
                      {embedAuthor && (
                        <div className="text-xs font-semibold text-slate-400">{embedAuthor}</div>
                      )}
                      {embedTitle && (
                        <div className="text-base font-extrabold text-white">{embedTitle}</div>
                      )}
                      {embedDesc && (
                        <div className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
                          {embedDesc}
                        </div>
                      )}
                      {fields.filter((f) => f.name && f.value).length > 0 && (
                        <div className="space-y-2">
                          {(() => {
                            const rows = [];
                            let currentRow = [];
                            fields
                              .filter((f) => f.name && f.value)
                              .forEach((f, i) => {
                                currentRow.push(f);
                                if (
                                  !f.inline ||
                                  i === fields.filter((ff) => ff.name && ff.value).length - 1
                                ) {
                                  rows.push([...currentRow]);
                                  currentRow = [];
                                }
                              });
                            if (currentRow.length > 0) rows.push(currentRow);
                            return rows.map((row, ri) => (
                              <div key={ri} className="flex gap-4">
                                {row.map((f, fi) => (
                                  <div key={fi} className={f.inline ? "min-w-0 flex-1" : "w-full"}>
                                    <div className="mb-0.5 text-[11px] font-bold text-white">{f.name}</div>
                                    <div className="text-[11px] text-slate-300">{f.value}</div>
                                  </div>
                                ))}
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                      {hasImage && (
                        <img
                          src={embedImage}
                          alt="Embed image"
                          className="max-h-64 w-full rounded-lg object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        {embedFooter && <span className="text-[10px] text-slate-500">{embedFooter}</span>}
                        {showTimestamp && embedFooter && (
                          <span className="text-[10px] text-slate-600">•</span>
                        )}
                        {showTimestamp && (
                          <span className="text-[10px] text-slate-500">
                            {new Date().toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {hasThumb && (
                      <img
                        src={embedThumbnail}
                        alt="Thumbnail"
                        className="absolute right-4 top-4 h-16 w-16 rounded-lg border border-white/10 object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick tips */}
          <div className="glass-card rounded-[20px] p-4">
            <span className="section-label">Markdown tips</span>
            <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px] text-slate-400">
              <span>
                <code className="text-[#B9A6FF]">**bold**</code> →{" "}
                <strong className="text-white">bold</strong>
              </span>
              <span>
                <code className="text-[#B9A6FF]">*italic*</code> →{" "}
                <em className="text-white">italic</em>
              </span>
              <span>
                <code className="text-[#B9A6FF]">__underline__</code> →{" "}
                <u className="text-white">underline</u>
              </span>
              <span>
                <code className="text-[#B9A6FF]">||spoiler||</code> → spoiler
              </span>
              <span>
                <code className="text-[#B9A6FF]">`code`</code> →{" "}
                <code className="text-white">code</code>
              </span>
              <span>
                <code className="text-[#B9A6FF]">[link](url)</code> → link
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
