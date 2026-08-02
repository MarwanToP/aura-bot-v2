"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Type, Image, Send, Plus, Trash2, Eye, Code, Bold, Italic } from "lucide-react";

const COLOR_PRESETS = [
  { name: 'Blurple', hex: '#5865F2' }, { name: 'Green', hex: '#57F287' }, { name: 'Yellow', hex: '#FEE75C' },
  { name: 'Red', hex: '#ED4245' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Cyan', hex: '#00BFFF' },
];

export default function EmbedModule({ guildId = "default" }) {
  const [title, setTitle] = useState('Welcome to Aura Bot!');
  const [desc, setDesc] = useState('Fully customizable embed message.');
  const [color, setColor] = useState('#5865F2');
  const [author, setAuthor] = useState('');
  const [footer, setFooter] = useState('Aura Bot v2.0');
  const [thumbnail, setThumbnail] = useState('');
  const [image, setImage] = useState('');
  const [fields, setFields] = useState([{ name: 'Getting Started', value: 'Use `/help`', inline: true }]);
  const [showJson, setShowJson] = useState(false);

  const addField = () => setFields([...fields, { name: '', value: '', inline: false }]);
  const removeField = (i) => setFields(fields.filter((_, idx) => idx !== i));

  const embedPayload = {
    title, description: desc, color: parseInt(color.replace('#', ''), 16),
    author: author ? { name: author } : undefined, footer: footer ? { text: footer } : undefined,
    thumbnail: thumbnail ? { url: thumbnail } : undefined, image: image ? { url: image } : undefined,
    timestamp: new Date().toISOString(), fields: fields.filter(f => f.name && f.value),
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">New Module</span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5 mt-2">
            <Palette className="w-5 h-5 text-cyan-400" />
            Embed Message Builder
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Design rich Discord embeds with live preview, fields, images, and colors.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowJson(!showJson)}
            className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-400 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer">
            <Code className="w-4 h-4" /> {showJson ? 'Preview' : 'JSON'}
          </button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#5865F2]/25">
            <Send className="w-4 h-4" /> Dispatch
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Type className="w-4 h-4 text-cyan-400" /> Content</h3>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Author</label>
              <input type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-xs text-white mt-1 focus:outline-none focus:border-[#5865F2]/50" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-xs text-white mt-1 focus:outline-none focus:border-[#5865F2]/50" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-xs text-white mt-1 resize-none focus:outline-none focus:border-[#5865F2]/50" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Fields ({fields.length})</span>
                <button onClick={addField} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"><Plus className="w-3 h-3" /> Add</button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {fields.map((f, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex-1 space-y-1">
                      <input type="text" value={f.name} onChange={e => { const n = [...fields]; n[idx].name = e.target.value; setFields(n); }} placeholder="Name" className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#5865F2]/50" />
                      <input type="text" value={f.value} onChange={e => { const n = [...fields]; n[idx].value = e.target.value; setFields(n); }} placeholder="Value" className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-[#5865F2]/50" />
                    </div>
                    <button onClick={() => removeField(idx)} className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Footer</label>
              <input type="text" value={footer} onChange={e => setFooter(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-xs text-white mt-1 focus:outline-none focus:border-[#5865F2]/50" />
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Image className="w-4 h-4 text-cyan-400" /> Media & Color</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Thumbnail URL</label>
                <input type="text" value={thumbnail} onChange={e => setThumbnail(e.target.value)} placeholder="https://..." className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-xs text-white mt-1 focus:outline-none focus:border-[#5865F2]/50" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Image URL</label>
                <input type="text" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-xs text-white mt-1 focus:outline-none focus:border-[#5865F2]/50" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Color</span>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
              <div className="flex gap-1.5">
                {COLOR_PRESETS.map(c => (
                  <button key={c.hex} onClick={() => setColor(c.hex)} className="w-5 h-5 rounded-full border border-white/10 hover:scale-110 transition-all cursor-pointer" style={{ backgroundColor: c.hex }} title={c.name}></button>
                ))}
              </div>
              <span className="text-[10px] font-mono text-zinc-400">{color}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Eye className="w-4 h-4 text-cyan-400" /> Live Preview</h3>
          {showJson ? (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <pre className="text-[11px] text-zinc-300 font-mono whitespace-pre-wrap max-h-[600px] overflow-x-auto">{JSON.stringify(embedPayload, null, 2)}</pre>
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex border-l-4 p-5 space-y-3 flex-col" style={{ borderColor: color }}>
                {author && <div className="text-xs text-zinc-400 font-semibold">{author}</div>}
                {title && <div className="text-base font-extrabold text-white">{title}</div>}
                {desc && <div className="text-xs text-zinc-300 leading-relaxed">{desc}</div>}
                {fields.filter(f => f.name && f.value).length > 0 && (
                  <div className="flex gap-4 flex-wrap">
                    {fields.filter(f => f.name && f.value).map((f, i) => (
                      <div key={i} className={f.inline ? 'flex-1 min-w-0' : 'w-full'}>
                        <div className="text-[11px] font-bold text-white">{f.name}</div>
                        <div className="text-[11px] text-zinc-300">{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {image && <img src={image} alt="" className="w-full rounded-lg max-h-64 object-cover" onError={e => e.target.style.display = 'none'} />}
                <div className="flex items-center gap-2 pt-1 text-[10px] text-zinc-500">
                  {footer && <span>{footer}</span>}
                  {footer && <span>•</span>}
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
