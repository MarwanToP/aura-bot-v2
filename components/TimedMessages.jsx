"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Plus, Trash2, Send, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";

const MOCK_MESSAGES = [
  { id: 1, channelId: '#announcements', content: 'Remember to check the rules in #rules-and-info!', interval: 3600000, enabled: true, lastSentAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 2, channelId: '#general', content: 'Need help? Type `/help` to see all available commands.', interval: 7200000, enabled: true, lastSentAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, channelId: '#events', content: '🎉 We have active giveaways! Check them out with `/giveaways list`.', interval: 86400000, enabled: false, lastSentAt: new Date(Date.now() - 43200000).toISOString() },
];

const INTERVAL_OPTIONS = [
  { value: 60000, label: '1 min' },
  { value: 300000, label: '5 min' },
  { value: 600000, label: '10 min' },
  { value: 3600000, label: '1 hour' },
  { value: 21600000, label: '6 hours' },
  { value: 86400000, label: '1 day' },
  { value: 604800000, label: '7 days' },
];

export default function TimedMessages() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [showCreator, setShowCreator] = useState(false);
  const [newChannel, setNewChannel] = useState('#announcements');
  const [newContent, setNewContent] = useState('');
  const [newInterval, setNewInterval] = useState(3600000);

  const createMessage = () => {
    if (!newContent.trim() || !newChannel.trim()) return;
    const msg = {
      id: Date.now(),
      channelId: newChannel.trim(),
      content: newContent.trim(),
      interval: newInterval,
      enabled: true,
      lastSentAt: null,
    };
    setMessages([msg, ...messages]);
    setNewContent('');
    setShowCreator(false);
  };

  const toggleMessage = (id) => {
    setMessages(messages.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const deleteMessage = (id) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  const formatInterval = (ms) => {
    if (ms < 60000) return `${ms / 1000}s`;
    if (ms < 3600000) return `${ms / 60000}m`;
    if (ms < 86400000) return `${ms / 3600000}h`;
    return `${ms / 86400000}d`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-purple-400" />
            Timed / Repeating Messages (Carl-bot Style)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Schedule messages to automatically repeat in your channels at set intervals.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreator(!showCreator)}
          className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2"
        >
          {showCreator ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreator ? 'Cancel' : 'New Message'}
        </motion.button>
      </div>

      {/* Creator Form */}
      {showCreator && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="dark-panel p-6 space-y-5">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-400" />
            Schedule New Repeating Message
          </h3>
          <div>
            <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Target Channel</label>
            <input type="text" value={newChannel} onChange={(e) => setNewChannel(e.target.value)}
              className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 mt-1"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Message Content</label>
            <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={3}
              placeholder="Enter the message content to repeat..."
              className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 mt-1 resize-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Repeat Interval</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {INTERVAL_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setNewInterval(opt.value)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${newInterval === opt.value ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40' : 'bg-[#0b0d14] text-zinc-400 border border-[#1e2333] hover:text-zinc-200'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={createMessage}
              className="px-6 py-2.5 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Schedule Message
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="dark-panel p-8 text-center">
            <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No timed messages scheduled.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="dark-panel p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${msg.enabled ? 'bg-purple-600/20 border border-purple-500/30' : 'bg-zinc-800/50 border border-zinc-700/30'}`}>
                      <RefreshCw className={`w-4 h-4 ${msg.enabled ? 'text-purple-400' : 'text-zinc-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{msg.channelId}</span>
                        <span className="text-[10px] font-mono text-zinc-500 bg-[#121520] px-2 py-0.5 rounded-lg border border-[#1e2333]">
                          Every {formatInterval(msg.interval)}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${msg.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-500/20 text-zinc-400'}`}>
                          {msg.enabled ? 'ACTIVE' : 'PAUSED'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1.5 truncate">{msg.content}</p>
                      {msg.lastSentAt && (
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Last sent {new Date(msg.lastSentAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button onClick={() => toggleMessage(msg.id)}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${msg.enabled ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-700/20 text-zinc-400 border border-zinc-600/30'}`}
                  >
                    {msg.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteMessage(msg.id)}
                    className="p-2 rounded-lg bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/30 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
