"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Plus, Trash2, Clock, Users, Trophy, CheckCircle, XCircle } from "lucide-react";

const MOCK_GIVEAWAYS = [
  { id: 1, prize: 'Nitro Classic 1 Month', channelId: '#giveaways', winnerCount: 1, endsAt: new Date(Date.now() + 86400000).toISOString(), active: true, entries: 47 },
  { id: 2, prize: 'Steam Gift Card $50', channelId: '#giveaways', winnerCount: 3, endsAt: new Date(Date.now() + 172800000).toISOString(), active: true, entries: 124 },
  { id: 3, prize: 'Discord Nitro Basic', channelId: '#events', winnerCount: 1, endsAt: new Date(Date.now() - 3600000).toISOString(), active: false, entries: 89 },
];

const DURATION_OPTIONS = [
  { value: 1, label: '1 Hour' },
  { value: 6, label: '6 Hours' },
  { value: 24, label: '24 Hours' },
  { value: 48, label: '48 Hours' },
  { value: 72, label: '3 Days' },
  { value: 168, label: '7 Days' },
];

export default function GiveawaySettings() {
  const [giveaways, setGiveaways] = useState(MOCK_GIVEAWAYS);
  const [showCreator, setShowCreator] = useState(false);
  const [prize, setPrize] = useState('');
  const [channel, setChannel] = useState('#giveaways');
  const [winnerCount, setWinnerCount] = useState(1);
  const [duration, setDuration] = useState(24);
  const [requirements, setRequirements] = useState('');

  const createGiveaway = () => {
    if (!prize.trim()) return;
    const newGw = {
      id: Date.now(),
      prize: prize.trim(),
      channelId: channel,
      winnerCount,
      endsAt: new Date(Date.now() + duration * 3600000).toISOString(),
      active: true,
      entries: 0,
    };
    setGiveaways([newGw, ...giveaways]);
    setPrize('');
    setShowCreator(false);
  };

  const endGiveaway = (id) => {
    setGiveaways(giveaways.map(g => g.id === id ? { ...g, active: false } : g));
  };

  const deleteGiveaway = (id) => {
    setGiveaways(giveaways.filter(g => g.id !== id));
  };

  const timeLeft = (endsAt) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m remaining`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Gift className="w-5 h-5 text-purple-400" />
            Giveaway Creator (MEE6 / Dyno Style)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Create, manage, and end giveaways directly from the dashboard.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreator(!showCreator)}
          className="px-5 py-2 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2"
        >
          {showCreator ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreator ? 'Cancel' : 'New Giveaway'}
        </motion.button>
      </div>

      {/* Creator Form */}
      {showCreator && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="dark-panel p-6 space-y-5">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-400" />
            New Giveaway
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Prize</label>
              <input type="text" value={prize} onChange={(e) => setPrize(e.target.value)}
                placeholder="e.g. Discord Nitro, Steam Wallet..."
                className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Channel</label>
              <input type="text" value={channel} onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Winners</label>
              <input type="number" min={1} max={100} value={winnerCount} onChange={(e) => setWinnerCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Duration</label>
              <div className="flex gap-2 mt-1">
                {DURATION_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setDuration(opt.value)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${duration === opt.value ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40' : 'bg-[#0b0d14] text-zinc-400 border border-[#1e2333] hover:text-zinc-200'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] font-mono text-zinc-400 font-bold uppercase">Requirements (optional)</label>
              <input type="text" value={requirements} onChange={(e) => setRequirements(e.target.value)}
                placeholder="e.g. Must have been in server for 7 days"
                className="w-full bg-[#0b0d14] border border-[#1e2333] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={createGiveaway}
              className="px-6 py-2.5 rounded-xl gradient-active-btn text-white text-xs font-bold flex items-center gap-2"
            >
              <Gift className="w-4 h-4" />
              Launch Giveaway
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Giveaways List */}
      <div className="space-y-4">
        {giveaways.length === 0 ? (
          <div className="dark-panel p-8 text-center">
            <Gift className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No giveaways yet. Create your first one!</p>
          </div>
        ) : (
          giveaways.map((gw) => (
            <div key={gw.id} className="dark-panel p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${gw.active ? 'bg-purple-600/20 border border-purple-500/30' : 'bg-zinc-800/50 border border-zinc-700/30'}`}>
                    <Gift className={`w-5 h-5 ${gw.active ? 'text-purple-400' : 'text-zinc-500'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{gw.prize}</h3>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {gw.winnerCount} winner{gw.winnerCount > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {gw.active ? timeLeft(gw.endsAt) : 'Ended'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {gw.entries} entries
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono text-zinc-500">{gw.channelId}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {gw.active && (
                    <button onClick={() => endGiveaway(gw.id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold hover:bg-blue-600/30 transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                      End Early
                    </button>
                  )}
                  <button onClick={() => deleteGiveaway(gw.id)}
                    className="p-1.5 rounded-lg bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/30 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
