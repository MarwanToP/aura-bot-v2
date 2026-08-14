"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Type, Image, Send, Plus, Trash2, Eye, Code, Bold, Italic, Underline } from "lucide-react";

const COLOR_PRESETS = [
  { name: 'Blurple', hex: '#5865F2' },
  { name: 'Green', hex: '#57F287' },
  { name: 'Yellow', hex: '#FEE75C' },
  { name: 'Red', hex: '#ED4245' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Cyan', hex: '#00BFFF' },
  { name: 'Orange', hex: '#FF7B2B' },
  { name: 'Pink', hex: '#FF69B4' },
];

export default function EmbedBuilder() {
  const [embedTitle, setEmbedTitle] = useState('Welcome to Aura Bot!');
  const [embedDesc, setEmbedDesc] = useState('This is a fully customizable embed message. Use the controls on the right to change colors, add fields, images, and more.');
  const [embedColor, setEmbedColor] = useState('#5865F2');
  const [embedAuthor, setEmbedAuthor] = useState('');
  const [embedFooter, setEmbedFooter] = useState('Aura Bot v2.0 • Powered by Discord');
  const [embedThumbnail, setEmbedThumbnail] = useState('');
  const [embedImage, setEmbedImage] = useState('');
  const [fields, setFields] = useState([
    { name: 'Getting Started', value: 'Use `/help` to see all commands', inline: true },
    { name: 'Support', value: 'Join our Discord for help', inline: true },
  ]);
  const [targetChannel, setTargetChannel] = useState('#general');
  const [showJson, setShowJson] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(true);

  const addField = () => {
    setFields([...fields, { name: 'New Field', value: 'Field value', inline: false }]);
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
    color: parseInt(embedColor.replace('#', ''), 16),
    author: embedAuthor ? { name: embedAuthor } : undefined,
    footer: embedFooter ? { text: embedFooter } : undefined,
    thumbnail: embedThumbnail ? { url: embedThumbnail } : undefined,
    image: embedImage ? { url: embedImage } : undefined,
    timestamp: showTimestamp ? new Date().toISOString() : undefined,
    fields: fields.filter(f => f.name && f.value),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-purple-400" />
            Embed Message Builder (Carl-bot / ProBot Style)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Design rich Discord embeds with live preview. Supports fields, images, thumbnails, and color picker.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowJson(!showJson)}
            className="px-4 py-2 rounded-xl bg-[#121520] border border-[#1e2333] text-zinc-400 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Code className="w-4 h-4" />
            {showJson ? 'Preview' : 'JSON'}
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Dispatch Embed
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Editor */}
        <div className="space-y-5">
          <div className="dark-panel p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-purple-400" />
              Content
            </h3>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Author</label>
              <input type="text" value={embedAuthor} onChange={(e) => setEmbedAuthor(e.target.value)}
                placeholder="Author name (optional)"
                className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Title</label>
              <input type="text" value={embedTitle} onChange={(e) => setEmbedTitle(e.target.value)}
                placeholder="Embed title"
                className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Description</label>
              <textarea value={embedDesc} onChange={(e) => setEmbedDesc(e.target.value)} rows={4}
                placeholder="Embed description (supports markdown)"
                className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 mt-1 resize-none"
              />
            </div>

            <div className="flex items-center gap-1 p-1.5 bg-[#0b0d14] border border-[#1e2333] rounded-xl w-fit">
              <button aria-label="Bold text" className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"><Bold className="w-3.5 h-3.5" /></button>
              <button aria-label="Italic text" className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"><Italic className="w-3.5 h-3.5" /></button>
              <button aria-label="Underline text" className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"><Underline className="w-3.5 h-3.5" /></button>
              <span className="w-px h-5 bg-[#1e2333] mx-1"></span>
              <button className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-bold cursor-pointer">LINK</button>
              <button className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-bold cursor-pointer">CODE</button>
            </div>

            {/* Fields */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Fields ({fields.length})</label>
                <button onClick={addField} className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3 h-3" /> Add Field
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {fields.map((field, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
                    <div className="flex-1 space-y-1">
                      <input type="text" value={field.name} onChange={(e) => updateField(idx, 'name', e.target.value)}
                        placeholder="Field name"
                        className="w-full bg-transparent border border-[#1e2333] rounded-lg px-2 py-1 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                      <input type="text" value={field.value} onChange={(e) => updateField(idx, 'value', e.target.value)}
                        placeholder="Field value"
                        className="w-full bg-transparent border border-[#1e2333] rounded-lg px-2 py-1 text-[11px] text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                      <label className="flex items-center gap-2 text-[10px] text-zinc-500 cursor-pointer">
                        <input type="checkbox" checked={field.inline} onChange={(e) => updateField(idx, 'inline', e.target.checked)} className="accent-purple-500" />
                        Inline
                      </label>
                    </div>
                    <button onClick={() => removeField(idx)} className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Footer</label>
              <input type="text" value={embedFooter} onChange={(e) => setEmbedFooter(e.target.value)}
                className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
          </div>

          {/* Media */}
          <div className="dark-panel p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Image className="w-4 h-4 text-purple-400" />
              Media & Color
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Thumbnail URL</label>
                <input type="text" value={embedThumbnail} onChange={(e) => setEmbedThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Image URL</label>
                <input type="text" value={embedImage} onChange={(e) => setEmbedImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Color</label>
              <div className="flex items-center gap-3 mt-1">
                <input type="color" value={embedColor} onChange={(e) => setEmbedColor(e.target.value)} className="w-10 h-10 rounded-xl border border-[#1e2333] bg-transparent cursor-pointer" />
                <div className="flex gap-1.5">
                  {COLOR_PRESETS.map((c) => (
                    <button key={c.hex} onClick={() => setEmbedColor(c.hex)}
                      className="w-6 h-6 rounded-full border-2 border-white/10 hover:scale-110 transition-all cursor-pointer" style={{ backgroundColor: c.hex }}
                      title={c.name}
                    ></button>
                  ))}
                </div>
                <span className="text-xs font-mono text-zinc-400">{embedColor}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input type="checkbox" checked={showTimestamp} onChange={(e) => setShowTimestamp(e.target.checked)} className="accent-purple-500" />
                Show Timestamp
              </label>
            </div>
          </div>

          {/* Target Channel */}
          <div className="dark-panel p-5">
            <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Target Channel</label>
            <div className="flex items-center gap-3 mt-1">
              <input type="text" value={targetChannel} onChange={(e) => setTargetChannel(e.target.value)}
                className="flex-1 bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            Live Preview
          </h3>

          {showJson ? (
            <div className="dark-panel p-5">
              <pre className="text-[11px] text-zinc-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-[600px]">
                {JSON.stringify(embedPayload, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="dark-panel p-0 overflow-hidden">
              <div className="flex border-l-4" style={{ borderColor: embedColor }}>
                <div className="flex-1 p-5 space-y-3">
                  {embedAuthor && (
                    <div className="text-xs text-zinc-400 font-semibold">{embedAuthor}</div>
                  )}
                  {embedTitle && (
                    <div className="text-base font-extrabold text-white">{embedTitle}</div>
                  )}
                  {embedDesc && (
                    <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{embedDesc}</div>
                  )}
                  {fields.filter(f => f.name && f.value).length > 0 && (
                    <div className="space-y-2">
                      {(() => {
                        const rows = [];
                        let currentRow = [];
                        fields.filter(f => f.name && f.value).forEach((f, i) => {
                          currentRow.push(f);
                          if (!f.inline || i === fields.filter(ff => ff.name && ff.value).length - 1) {
                            rows.push([...currentRow]);
                            currentRow = [];
                          }
                        });
                        if (currentRow.length > 0) rows.push(currentRow);
                        return rows.map((row, ri) => (
                          <div key={ri} className="flex gap-4">
                            {row.map((f, fi) => (
                              <div key={fi} className={f.inline ? 'flex-1 min-w-0' : 'w-full'}>
                                <div className="text-[11px] font-bold text-white mb-0.5">{f.name}</div>
                                <div className="text-[11px] text-zinc-300">{f.value}</div>
                              </div>
                            ))}
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                  {embedImage && (
                    <img src={embedImage} alt="Embed image" className="w-full rounded-lg max-h-64 object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    {embedFooter && (
                      <span className="text-[10px] text-zinc-500">{embedFooter}</span>
                    )}
                    {showTimestamp && embedFooter && (
                      <span className="text-[10px] text-zinc-600">•</span>
                    )}
                    {showTimestamp && (
                      <span className="text-[10px] text-zinc-500">{new Date().toLocaleString()}</span>
                    )}
                  </div>
                  {embedThumbnail && (
                    <img src={embedThumbnail} alt="Thumbnail" className="absolute top-5 right-5 w-16 h-16 rounded-lg object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick tips */}
          <div className="dark-panel p-4">
            <h4 className="text-xs font-bold text-white mb-2">Markdown Tips</h4>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-zinc-400">
              <span><code className="text-purple-400">**bold**</code> → <strong className="text-white">bold</strong></span>
              <span><code className="text-purple-400">*italic*</code> → <em className="text-white">italic</em></span>
              <span><code className="text-purple-400">__underline__</code> → <u className="text-white">underline</u></span>
              <span><code className="text-purple-400">||spoiler||</code> → spoiler</span>
              <span><code className="text-purple-400">`code`</code> → <code className="text-white">code</code></span>
              <span><code className="text-purple-400">[link](url)</code> → link</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
