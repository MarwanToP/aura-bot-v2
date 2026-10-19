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

const inputCls =
  "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C5CFF]/50 transition-colors";

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

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 text-white">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="fixed bottom-6 right-6 z-[90] panel px-4 py-3 flex items-center gap-2.5 text-xs font-semibold shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="w-4 h-4 text-[#39D98A]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <Palette className="h-4 w-4" />
            </span>
            Embed Message Builder
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Design rich embeds with a live preview — fields, images, thumbnails, and color presets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer"
          >
            <Code className="w-4 h-4" />
            {showJson ? "Preview" : "JSON"}
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => showToast(`Embed dispatched to ${targetChannel} — delivery confirmed`)}
            className="inline-flex items-center gap-2 bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Dispatch Embed
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Editor */}
        <motion.div variants={rise} className="space-y-5 min-w-0">
          <section className="panel panel-hover p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/25 flex items-center justify-center text-[#7C5CFF] shrink-0">
                <Type className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">Content</h3>
                <p className="text-xs text-slate-500 mt-0.5">Author, title, description, and fields</p>
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
                  className={inputCls}
                />
              </label>

              <label className="block min-w-0">
                <span className="section-label mb-1.5 block">Title</span>
                <input
                  type="text"
                  value={embedTitle}
                  onChange={(e) => setEmbedTitle(e.target.value)}
                  placeholder="Embed title"
                  className={inputCls}
                />
              </label>

              <label className="block min-w-0">
                <span className="section-label mb-1.5 block">Description</span>
                <textarea
                  value={embedDesc}
                  onChange={(e) => setEmbedDesc(e.target.value)}
                  rows={4}
                  placeholder="Embed description (supports markdown)"
                  className={`${inputCls} resize-none`}
                />
              </label>

              <div className="flex items-center gap-1 p-1 bg-white/[0.02] border border-white/[0.08] rounded-lg w-fit">
                <button
                  type="button"
                  title="Bold"
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Italic"
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Underline"
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <span className="w-px h-5 bg-white/[0.08] mx-1" />
                <button
                  type="button"
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.04] text-[10px] font-bold transition-colors cursor-pointer"
                >
                  LINK
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.04] text-[10px] font-bold transition-colors cursor-pointer"
                >
                  CODE
                </button>
              </div>

              {/* Fields */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="section-label">Fields ({fields.length})</span>
                  <button
                    type="button"
                    onClick={addField}
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 hover:text-[#7C5CFF] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add field
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {fields.map((field, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition-colors hover:border-white/[0.1]"
                    >
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(idx, "name", e.target.value)}
                          placeholder="Field name"
                          className={inputCls}
                        />
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateField(idx, "value", e.target.value)}
                          placeholder="Field value"
                          className={`${inputCls} text-slate-300`}
                        />
                        <label className="flex items-center gap-2 text-[10px] text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.inline}
                            onChange={(e) => updateField(idx, "inline", e.target.checked)}
                            className="accent-[#7C5CFF]"
                          />
                          Inline
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeField(idx)}
                        title="Remove field"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#FF5C7A] hover:bg-[#FF5C7A]/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
                  className={inputCls}
                />
              </label>
            </div>
          </section>

          {/* Media */}
          <section className="panel panel-hover p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/25 flex items-center justify-center text-[#7C5CFF] shrink-0">
                <Image className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">Media & Color</h3>
                <p className="text-xs text-slate-500 mt-0.5">Thumbnails, images, and the accent bar</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block min-w-0">
                  <span className="section-label mb-1.5 block">Thumbnail URL</span>
                  <input
                    type="text"
                    value={embedThumbnail}
                    onChange={(e) => setEmbedThumbnail(e.target.value)}
                    placeholder="Paste an image URL"
                    className={inputCls}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="section-label mb-1.5 block">Image URL</span>
                  <input
                    type="text"
                    value={embedImage}
                    onChange={(e) => setEmbedImage(e.target.value)}
                    placeholder="Paste an image URL"
                    className={inputCls}
                  />
                </label>
              </div>

              <div>
                <span className="section-label mb-1.5 block">Color</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={embedColor}
                    onChange={(e) => setEmbedColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-white/[0.08] bg-transparent cursor-pointer"
                  />
                  <div className="flex gap-1.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setEmbedColor(c.hex)}
                        className="w-6 h-6 rounded-full border-2 border-white/10 hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-mono text-slate-400">{embedColor}</span>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTimestamp}
                  onChange={(e) => setShowTimestamp(e.target.checked)}
                  className="accent-[#7C5CFF]"
                />
                Show timestamp
              </label>
            </div>
          </section>

          {/* Target Channel */}
          <section className="panel panel-hover p-5">
            <span className="section-label mb-1.5 block">Target Channel</span>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={targetChannel}
                onChange={(e) => setTargetChannel(e.target.value)}
                className={`${inputCls} flex-1`}
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => showToast(`Embed sent to ${targetChannel} — delivery confirmed`)}
                className="inline-flex items-center gap-2 bg-[#7C5CFF] hover:bg-[#6a4cf0] text-white text-xs font-semibold rounded-lg px-3.5 py-2 transition-colors shadow-[0_0_18px_rgba(124,92,255,0.35)] cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                Send
              </motion.button>
            </div>
          </section>
        </motion.div>

        {/* Right: Preview */}
        <motion.div variants={rise} className="space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#7C5CFF]" />
              <h3 className="text-sm font-bold text-white">Live preview</h3>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold text-slate-500">
              Discord
            </span>
          </div>

          {showJson ? (
            <div className="panel p-5">
              <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-[600px] custom-scrollbar">
                {JSON.stringify(embedPayload, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="panel overflow-hidden">
              <div className="relative flex border-l-4" style={{ borderColor: embedColor }}>
                <div className="flex-1 min-w-0 p-5 space-y-3">
                  {embedAuthor && (
                    <div className="text-xs text-slate-400 font-semibold">{embedAuthor}</div>
                  )}
                  {embedTitle && (
                    <div className="text-base font-extrabold text-white">{embedTitle}</div>
                  )}
                  {embedDesc && (
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
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
                              <div key={fi} className={f.inline ? "flex-1 min-w-0" : "w-full"}>
                                <div className="text-[11px] font-bold text-white mb-0.5">{f.name}</div>
                                <div className="text-[11px] text-slate-300">{f.value}</div>
                              </div>
                            ))}
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                  {embedImage && (
                    <img
                      src={embedImage}
                      alt="Embed image"
                      className="w-full rounded-lg max-h-64 object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    {embedFooter && <span className="text-[10px] text-slate-500">{embedFooter}</span>}
                    {showTimestamp && embedFooter && <span className="text-[10px] text-slate-600">•</span>}
                    {showTimestamp && (
                      <span className="text-[10px] text-slate-500">{new Date().toLocaleString()}</span>
                    )}
                  </div>
                </div>
                {embedThumbnail && (
                  <img
                    src={embedThumbnail}
                    alt="Thumbnail"
                    className="absolute top-5 right-5 w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Quick tips */}
          <div className="panel p-4">
            <h4 className="text-xs font-bold text-white mb-2">Markdown tips</h4>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400">
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
