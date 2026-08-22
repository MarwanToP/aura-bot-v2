"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Plus, Trash2, Clock, Users, Trophy, CheckCircle, XCircle } from "lucide-react";

const DURATION_OPTIONS = [
  { value: 1, label: '1h' }, { value: 6, label: '6h' }, { value: 24, label: '24h' },
  { value: 48, label: '48h' }, { value: 72, label: '3d' }, { value: 168, label: '7d' },
];

export default function GiveawayModule({ guildId = "default" }) {
  const [giveaways, setGiveaways] = useState([
    { id: 1, prize: 'Nitro Classic 1 Month', channelId: '#giveaways', winnerCount: 1, endsAt: new Date(Date.now() + 86400000).toISOString(), active: true, entries: 47 },
    { id: 2, prize: 'Steam Gift Card $50', channelId: '#giveaways', winnerCount: 3, endsAt: new Date(Date.now() + 172800000).toISOString(), active: true, entries: 124 },
  ]);
  const [showCreator, setShowCreator] = useState(false);
  const [prize, setPrize] = useState('');
  const [channel, setChannel] = useState('#giveaways');
  const [winnerCount, setWinnerCount] = useState(1);
  const [duration, setDuration] = useState(24);

  const createGiveaway = () => {
    if (!prize.trim()) return;
    setGiveaways([{ id: Date.now(), prize: prize.trim(), channelId: channel, winnerCount, endsAt: new Date(Date.now() + duration * 3600000).toISOString(), active: true, entries: 0 }, ...giveaways]);
    setPrize('');
    setShowCreator(false);
  };

  const endGiveaway = (id) => setGiveaways(giveaways.map(g => g.id === id ? { ...g, active: false } : g));
  const deleteGiveaway = (id) => setGiveaways(giveaways.filter(g => g.id !== id));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">New Module</span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5 mt-2">
            <Gift className="w-5 h-5 text-cyan-400" />
            Giveaway Creator
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Create, manage, and end giveaways from the dashboard.</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreator(!showCreator)}
          className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#5865F2]/25">
          {showCreator ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreator ? 'Cancel' : 'New Giveaway'}
        </motion.button>
      </div>

      {showCreator && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-cyan-400" /> New Giveaway</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Prize</label>
              <input type="text" value={prize} onChange={e => setPrize(e.target.value)} placeholder="e.g. Discord Nitro"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white mt-1 focus:outline-none focus:border-[#5865F2]/50" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Channel</label>
              <input type="text" value={channel} onChange={e => setChannel(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white mt-1 focus:outline-none focus:border-[#5865F2]/50" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Winners</label>
              <input type="number" min={1} value={winnerCount} onChange={e => setWinnerCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white mt-1 focus:outline-none focus:border-[#5865F2]/50" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Duration</label>
              <div className="flex gap-2 mt-1">
                {DURATION_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setDuration(o.value)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${duration === o.value ? 'bg-[#5865F2]/20 text-cyan-400 border border-[#5865F2]/40' : 'bg-white/[0.05] text-zinc-400 border border-white/10 hover:text-zinc-200'}`}>{o.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={createGiveaway}
              className="px-6 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center gap-2">
              <Gift className="w-4 h-4" /> Launch Giveaway
            </motion.button>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {giveaways.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
            <Gift className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No giveaways yet.</p>
          </div>
        ) : (
          giveaways.map(gw => (
            <div key={gw.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${gw.active ? 'bg-cyan-600/20 border border-cyan-500/30' : 'bg-white/[0.03] border border-white/5'}`}>
                    <Gift className={`w-5 h-5 ${gw.active ? 'text-cyan-400' : 'text-zinc-500'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{gw.prize}</h3>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{gw.winnerCount} winner{gw.winnerCount > 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{gw.active ? `${Math.floor((new Date(gw.endsAt) - Date.now()) / 3600000)}h left` : 'Ended'}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{gw.entries} entries</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {gw.active && <button onClick={() => endGiveaway(gw.id)} className="px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold hover:bg-cyan-600/30 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus:outline-none"><CheckCircle className="w-3.5 h-3.5 inline mr-1" />End</button>}
                  <button aria-label="Delete giveaway" onClick={() => deleteGiveaway(gw.id)} className="p-1.5 rounded-lg bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/30 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus:outline-none"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
