"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Plus, Trash2, Send, ToggleRight, RefreshCw } from "lucide-react";

const INTERVAL_OPTIONS = [
  { value: 60000, label: '1 min' }, { value: 300000, label: '5 min' }, { value: 600000, label: '10 min' },
  { value: 3600000, label: '1 hour' }, { value: 21600000, label: '6 hours' }, { value: 86400000, label: '1 day' },
];

export default function TimedMessagesModule({ guildId = "default" }) {
  const [messages, setMessages] = useState([
    { id: 1, channelId: '#announcements', content: 'Remember to check the rules!', interval: 3600000, enabled: true, lastSentAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 2, channelId: '#general', content: 'Need help? Type `/help`.', interval: 7200000, enabled: true, lastSentAt: new Date(Date.now() - 3600000).toISOString() },
  ]);
  const [showCreator, setShowCreator] = useState(false);
  const [newChannel, setNewChannel] = useState('#announcements');
  const [newContent, setNewContent] = useState('');
  const [newInterval, setNewInterval] = useState(3600000);

  const createMessage = () => {
    if (!newContent.trim()) return;
    setMessages([{ id: Date.now(), channelId: newChannel.trim(), content: newContent.trim(), interval: newInterval, enabled: true, lastSentAt: null }, ...messages]);
    setNewContent('');
    setShowCreator(false);
  };

  const toggleMessage = (id) => setMessages(messages.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  const deleteMessage = (id) => setMessages(messages.filter(m => m.id !== id));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">New Module</span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5 mt-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Timed / Repeating Messages
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Schedule messages to repeat in channels at set intervals.</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreator(!showCreator)}
          className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#5865F2]/25">
          {showCreator ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreator ? 'Cancel' : 'New Message'}
        </motion.button>
      </div>

      {showCreator && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-cyan-400" /> Schedule New Message</h3>
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Channel</label>
            <input type="text" value={newChannel} onChange={e => setNewChannel(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white mt-1 focus:outline-none focus:border-[#5865F2]/50" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Content</label>
            <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={3} placeholder="Message to repeat..."
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white mt-1 resize-none focus:outline-none focus:border-[#5865F2]/50" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Interval</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {INTERVAL_OPTIONS.map(o => (
                <button key={o.value} onClick={() => setNewInterval(o.value)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${newInterval === o.value ? 'bg-[#5865F2]/20 text-cyan-400 border border-[#5865F2]/40' : 'bg-white/[0.05] text-zinc-400 border border-white/10 hover:text-zinc-200'}`}>{o.label}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={createMessage}
              className="px-6 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-2">
              <Send className="w-4 h-4" /> Schedule
            </motion.button>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={`p-2.5 rounded-xl ${msg.enabled ? 'bg-cyan-600/20 border border-cyan-500/30' : 'bg-white/[0.03] border border-white/5'}`}>
                  <RefreshCw className={`w-4 h-4 ${msg.enabled ? 'text-cyan-400' : 'text-zinc-500'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{msg.channelId}</span>
                    <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.05] px-2 py-0.5 rounded-lg border border-white/5">
                      Every {msg.interval < 3600000 ? `${msg.interval / 60000}m` : `${msg.interval / 3600000}h`}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${msg.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-500/20 text-zinc-400'}`}>
                      {msg.enabled ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1.5 truncate">{msg.content}</p>
                  {msg.lastSentAt && <p className="text-[10px] text-zinc-500 mt-1">Last sent {new Date(msg.lastSentAt).toLocaleString()}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button onClick={() => toggleMessage(msg.id)}
                  aria-label={msg.enabled ? 'Pause message' : 'Resume message'}
                  title={msg.enabled ? 'Pause message' : 'Resume message'}
                  className={`p-2 rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${msg.enabled ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/[0.05] text-zinc-400 border border-white/10'}`}>
                  <ToggleRight className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMessage(msg.id)} aria-label="Delete message" title="Delete message" className="p-2 rounded-lg bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
