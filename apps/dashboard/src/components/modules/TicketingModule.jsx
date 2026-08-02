"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Star,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Shield,
  Check,
  X,
  Sliders,
  MessageSquare,
  Award,
  ArrowRight,
  Settings,
  Users,
  Sparkles,
  RefreshCw,
  Send,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
  Layers,
  ChevronRight,
  Eye,
  Save,
  Tag
} from "lucide-react";

// Default Preset Question Templates for Application Form Builder
const PRESET_TEMPLATES = {
  staff: [
    { id: "age", label: "What is your age & timezone?", placeholder: "e.g. 20 years old, UTC+3", style: "Short", required: true },
    { id: "experience", label: "Describe your previous moderation experience:", placeholder: "List servers, roles, and key responsibilities...", style: "Paragraph", required: true },
    { id: "motivation", label: "Why do you want to join our moderation staff?", placeholder: "Explain your motivation and goals...", style: "Paragraph", required: true },
    { id: "commitment", label: "How many hours per week can you commit?", placeholder: "e.g. 15-20 hours", style: "Short", required: true },
    { id: "scenario", label: "How would you handle a disruptive member in voice chat?", placeholder: "Detail your steps and resolution...", style: "Paragraph", required: true },
  ],
  vip: [
    { id: "social_link", label: "Link to your primary platform or profile:", placeholder: "https://twitch.tv/... or YouTube channel", style: "Short", required: true },
    { id: "community_size", label: "Current subscriber or follower count:", placeholder: "e.g. 5,000 members", style: "Short", required: true },
    { id: "reason", label: "Why are you applying for VIP Partnership?", placeholder: "Explain how we can collaborate...", style: "Paragraph", required: true },
  ]
};

// Initial Mock / Fallback State for CSAT Feedback Data
const INITIAL_CSAT = {
  averageRating: 4.8,
  totalResponses: 142,
  satisfactionPercentage: 95.8,
  ratingBreakdown: { 5: 116, 4: 20, 3: 4, 2: 1, 1: 1 },
  ticketsSummary: { open: 12, closed: 185 },
  recentFeedback: [
    {
      id: 1,
      ticketId: "TKT-0042",
      userId: "939799976308011018",
      userTag: "Alex#1337",
      rating: 5,
      feedback: "Extremely fast response! Staff member resolved my payment role issue in less than 3 minutes.",
      staffId: "192837465012345678",
      staffTag: "ModeratorNova",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 2,
      ticketId: "TKT-0039",
      userId: "284910293847561029",
      userTag: "ShadowByte",
      rating: 5,
      feedback: "Great technical help with bot permissions setup. Very polite and patient.",
      staffId: "382710928374651029",
      staffTag: "DevKuro",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 3,
      ticketId: "TKT-0035",
      userId: "574839201928374651",
      userTag: "Valkyrie",
      rating: 4,
      feedback: "Helpful response, issue escalated smoothly to Tier 2 management.",
      staffId: "192837465012345678",
      staffTag: "ModeratorNova",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ],
  staffMetrics: [
    { staffId: "192837465012345678", staffTag: "ModeratorNova", totalResponses: 48, averageRating: 4.9, satisfactionPercentage: 98.0 },
    { staffId: "382710928374651029", staffTag: "DevKuro", totalResponses: 35, averageRating: 4.85, satisfactionPercentage: 97.1 },
    { staffId: "473829102938475610", staffTag: "AdminZeus", totalResponses: 22, averageRating: 4.75, satisfactionPercentage: 95.4 }
  ]
};

export default function TicketingModule({ guildId = "939799976308011018" }) {
  const [activeTab, setActiveTab] = useState("panels"); // 'panels' | 'csat' | 'appy'
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // ── 1. Ticket Panels State ──
  const [panels, setPanels] = useState([
    {
      id: 1,
      panelId: "support_portal",
      title: "🎫 Aura Support & Help Center",
      description: "Welcome to support. Click a department button below to open a private ticket with our staff.",
      channelId: "109827364501928374",
      active: true,
      categories: [
        { name: "Technical", label: "🔧 Technical Support", emoji: "🔧", roleId: "102938475610293847", color: "Primary" },
        { name: "Billing", label: "💳 Billing & Premium", emoji: "💳", roleId: "102938475610293848", color: "Success" },
        { name: "Security", label: "🛡️ Report Incident", emoji: "🛡️", roleId: "102938475610293849", color: "Danger" },
      ]
    }
  ]);
  const [editingPanel, setEditingPanel] = useState(null);

  // Skill-tag Routing Rules State
  const [skillTags, setSkillTags] = useState([
    { tag: "tech", roleName: "Tech Support Team", roleId: "102938475610293847", enabled: true },
    { tag: "billing", roleName: "Finance & Billing", roleId: "102938475610293848", enabled: true },
    { tag: "security", roleName: "Moderator Shield", roleId: "102938475610293849", enabled: true },
    { tag: "management", roleName: "Executive Staff", roleId: "102938475610293850", enabled: true },
  ]);

  // ── 2. CSAT Feedback State ──
  const [csatData, setCsatData] = useState(INITIAL_CSAT);

  // ── 3. Application Form Builder State (Appy Synthesis) ──
  const [appForm, setAppForm] = useState({
    enabled: true,
    logChannelId: "109827364501928374",
    roleRewardId: "102938475610293851", // Auto-role on approval
    denyRoleId: "102938475610293852",   // Auto-role on rejection
    cooldown: 86400, // 24 hours in seconds
    questions: PRESET_TEMPLATES.staff
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // ── Fetch Initial Data from REST APIs ──
  useEffect(() => {
    async function fetchData() {
      if (!guildId) return;
      setLoading(true);
      try {
        // Fetch Ticket Panels
        const panelsRes = await fetch(`/api/guilds/${guildId}/ticket-panels`);
        if (panelsRes.ok) {
          const panelsData = await panelsRes.json();
          if (Array.isArray(panelsData) && panelsData.length > 0) {
            setPanels(panelsData);
          }
        }

        // Fetch CSAT Telemetry
        const csatRes = await fetch(`/api/guilds/${guildId}/tickets/csat`);
        if (csatRes.ok) {
          const csatJson = await csatRes.json();
          setCsatData((prev) => ({
            ...prev,
            ...csatJson,
            recentFeedback: csatJson.recentFeedback?.length ? csatJson.recentFeedback : prev.recentFeedback
          }));
        }

        // Fetch Application Form Config
        const appRes = await fetch(`/api/guilds/${guildId}/applications`);
        if (appRes.ok) {
          const appJson = await appRes.json();
          if (appJson.form) {
            setAppForm((prev) => ({
              ...prev,
              ...appJson.form,
              questions: appJson.form.questions?.length ? appJson.form.questions : prev.questions
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load TicketingModule data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [guildId]);

  // ── Save Application Form Handler ──
  const handleSaveAppForm = async () => {
    setLoading(true);
    setSaveStatus(null);
    try {
      const res = await fetch(`/api/guilds/${guildId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appForm)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.form) setAppForm(data.form);
        setSaveStatus({ type: "success", msg: "Application form saved & synced!" });
      } else {
        setSaveStatus({ type: "error", msg: "Failed to save application form." });
      }
    } catch (err) {
      setSaveStatus({ type: "error", msg: "Network error saving application form." });
    } finally {
      setLoading(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // ── Toggle Application Form Handler ──
  const handleToggleAppForm = async () => {
    const newEnabled = !appForm.enabled;
    setAppForm((prev) => ({ ...prev, enabled: newEnabled }));
    try {
      await fetch(`/api/guilds/${guildId}/applications/${guildId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled })
      });
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  // ── Save Ticket Panel Handler ──
  const handleSavePanel = async (panelToSave) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/ticket-panels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(panelToSave)
      });
      if (res.ok) {
        const saved = await res.json();
        setPanels((prev) => {
          const idx = prev.findIndex((p) => p.panelId === saved.panelId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = saved;
            return updated;
          }
          return [...prev, saved];
        });
        setEditingPanel(null);
        setSaveStatus({ type: "success", msg: "Ticket panel saved successfully!" });
      }
    } catch (err) {
      setSaveStatus({ type: "error", msg: "Error saving ticket panel." });
    } finally {
      setLoading(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // ── Question List Helpers ──
  const handleAddQuestion = () => {
    if (appForm.questions.length >= 10) return;
    const newQ = {
      id: `q_${Date.now().toString(36)}`,
      label: "New Application Question",
      placeholder: "User answer placeholder...",
      style: "Paragraph",
      required: true
    };
    setAppForm((prev) => ({ ...prev, questions: [...prev.questions, newQ] }));
  };

  const handleUpdateQuestion = (index, field, value) => {
    setAppForm((prev) => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const handleRemoveQuestion = (index) => {
    setAppForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleLoadPreset = (presetKey) => {
    if (PRESET_TEMPLATES[presetKey]) {
      setAppForm((prev) => ({ ...prev, questions: PRESET_TEMPLATES[presetKey] }));
    }
  };

  return (
    <div className="bg-[#09090b] text-zinc-100 p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl space-y-8 my-8 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#5865F2]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/10 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2]">
              <Ticket className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Ticketing & Applications Hub
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30">
              SYNTHESIS v2.0
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Synthesizing Ticket Tool & Appy — Enterprise Multi-Panel Ticket Manager, Skill-Tag Routing, CSAT Metrics & Form Builder.
          </p>
        </div>

        {/* Global Action Badges & Refresh */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PANELS: <strong className="text-white">{panels.length} ACTIVE</strong></span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>CSAT AVG: <strong className="text-amber-400">{csatData.averageRating} ★</strong></span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Save Status Notification Banner */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
              saveStatus.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {saveStatus.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{saveStatus.msg}</span>
            </div>
            <button onClick={() => setSaveStatus(null)} className="opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto relative z-10">
        <button
          onClick={() => setActiveTab("panels")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "panels"
              ? "bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/25"
              : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ticket Panels & Skill Routing</span>
        </button>

        <button
          onClick={() => setActiveTab("csat")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "csat"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25"
              : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
          }`}
        >
          <Star className="w-4 h-4 fill-current" />
          <span>CSAT Feedback & Metrics</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/20 text-black font-mono">
            {csatData.totalResponses}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("appy")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "appy"
              ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/25"
              : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Application Form Builder</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${appForm.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
            {appForm.enabled ? "ACTIVE" : "OFF"}
          </span>
        </button>
      </div>

      {/* ── TAB 1: TICKET PANELS & SKILL ROUTING ── */}
      {activeTab === "panels" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Top Panel Manager Toolbar */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#5865F2]" />
                Multi-Panel Ticket Manager
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure distinct interactive ticket panels for different server channels & departments.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingPanel({
                  panelId: `panel_${Date.now().toString(36)}`,
                  title: "🎫 Support & Inquiry Portal",
                  description: "Select a department category below to create your support ticket.",
                  channelId: "",
                  active: true,
                  categories: [
                    { name: "Technical", label: "🔧 Technical", emoji: "🔧", color: "Primary" },
                    { name: "General", label: "❓ Inquiry", emoji: "❓", color: "Secondary" }
                  ]
                })
              }
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs shadow-lg shadow-[#5865F2]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Ticket Panel</span>
            </button>
          </div>

          {/* Ticket Panels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {panels.map((panel) => (
              <div
                key={panel.panelId}
                className="bg-zinc-950/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative flex flex-col justify-between hover:border-white/20 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <h4 className="text-base font-bold text-white">{panel.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      ID: {panel.panelId}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    {panel.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                      Department Categories ({panel.categories?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {panel.categories?.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-zinc-200 flex items-center gap-1.5"
                        >
                          <span>{cat.emoji || "🎫"}</span>
                          <span>{cat.label || cat.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono">
                    Channel: {panel.channelId ? `#${panel.channelId}` : "Not Set"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingPanel(panel)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-zinc-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Edit Panel</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Panel Editor Modal / Inline Form */}
          {editingPanel && (
            <div className="bg-zinc-950/90 border border-white/20 rounded-2xl p-6 backdrop-blur-2xl space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-cyan-400" />
                  Editing Panel: <span className="text-cyan-400 font-mono">{editingPanel.panelId}</span>
                </h4>
                <button
                  onClick={() => setEditingPanel(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Panel ID (Unique Key)</label>
                  <input
                    type="text"
                    value={editingPanel.panelId}
                    onChange={(e) => setEditingPanel({ ...editingPanel, panelId: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Target Channel ID</label>
                  <input
                    type="text"
                    value={editingPanel.channelId || ""}
                    onChange={(e) => setEditingPanel({ ...editingPanel, channelId: e.target.value })}
                    placeholder="e.g. 109827364501928374"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Embed Title</label>
                  <input
                    type="text"
                    value={editingPanel.title || ""}
                    onChange={(e) => setEditingPanel({ ...editingPanel, title: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Embed Description</label>
                  <textarea
                    rows={3}
                    value={editingPanel.description || ""}
                    onChange={(e) => setEditingPanel({ ...editingPanel, description: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Categories Configuration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Interactive Category Buttons ({editingPanel.categories?.length || 0})
                  </label>
                  <button
                    onClick={() =>
                      setEditingPanel({
                        ...editingPanel,
                        categories: [
                          ...(editingPanel.categories || []),
                          { name: "New Category", label: "New Ticket", emoji: "🎫", color: "Primary" }
                        ]
                      })
                    }
                    className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Category
                  </button>
                </div>

                <div className="space-y-3">
                  {editingPanel.categories?.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-zinc-900/60 p-3 rounded-xl border border-white/10">
                      <input
                        type="text"
                        value={cat.emoji || ""}
                        onChange={(e) => {
                          const updated = [...editingPanel.categories];
                          updated[idx].emoji = e.target.value;
                          setEditingPanel({ ...editingPanel, categories: updated });
                        }}
                        placeholder="Emoji 🔧"
                        className="w-16 bg-zinc-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-center text-white"
                      />
                      <input
                        type="text"
                        value={cat.label || ""}
                        onChange={(e) => {
                          const updated = [...editingPanel.categories];
                          updated[idx].label = e.target.value;
                          setEditingPanel({ ...editingPanel, categories: updated });
                        }}
                        placeholder="Button Label"
                        className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={cat.name || ""}
                        onChange={(e) => {
                          const updated = [...editingPanel.categories];
                          updated[idx].name = e.target.value;
                          setEditingPanel({ ...editingPanel, categories: updated });
                        }}
                        placeholder="System Key"
                        className="w-32 bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                      <button
                        onClick={() => {
                          const updated = editingPanel.categories.filter((_, i) => i !== idx);
                          setEditingPanel({ ...editingPanel, categories: updated });
                        }}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setEditingPanel(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSavePanel(editingPanel)}
                  className="px-5 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs shadow-lg shadow-[#5865F2]/25 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Panel Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* Skill-Tag Routing Settings Section */}
          <div className="bg-zinc-950/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-400" />
                  Skill-Tag Intelligent Routing Settings
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Match ticket tags to specialized staff roles & automatically alert online specialists.
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                TRIAGE PROTOCOL READY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skillTags.map((st, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-mono text-xs border border-purple-500/30">
                      #{st.tag}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">{st.roleName}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">Role ID: {st.roleId}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const updated = [...skillTags];
                      updated[idx].enabled = !updated[idx].enabled;
                      setSkillTags(updated);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      st.enabled
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    }`}
                  >
                    {st.enabled ? "ACTIVE" : "INACTIVE"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TAB 2: CSAT FEEDBACK DASHBOARD CARD ── */}
      {activeTab === "csat" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Top CSAT Overview Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-zinc-950/40 border border-amber-500/20 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden">
              <div className="text-xs font-semibold text-zinc-400 mb-1">Average CSAT Score</div>
              <div className="text-3xl font-black text-amber-400 flex items-center gap-2">
                <span>{csatData.averageRating}</span>
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">Out of 5.0 maximum rating</p>
            </div>

            <div className="bg-zinc-950/40 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
              <div className="text-xs font-semibold text-zinc-400 mb-1">Total Survey Feedback</div>
              <div className="text-3xl font-black text-white">{csatData.totalResponses}</div>
              <p className="text-[10px] text-emerald-400 mt-2 font-mono">✓ High response rate (+12% this week)</p>
            </div>

            <div className="bg-zinc-950/40 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
              <div className="text-xs font-semibold text-zinc-400 mb-1">Satisfaction Rate</div>
              <div className="text-3xl font-black text-emerald-400">{csatData.satisfactionPercentage}%</div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">Ratings of 4★ or 5★ stars</p>
            </div>

            <div className="bg-zinc-950/40 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
              <div className="text-xs font-semibold text-zinc-400 mb-1">Closed Tickets Surveyed</div>
              <div className="text-3xl font-black text-cyan-400">{csatData.ticketsSummary?.closed || 185}</div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">{csatData.ticketsSummary?.open || 12} currently open</p>
            </div>
          </div>

          {/* Rating Breakdown & Feed Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 5-Star Distribution Breakdown */}
            <div className="bg-zinc-950/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4 lg:col-span-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Rating Star Distribution
              </h4>

              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = csatData.ratingBreakdown?.[star] || 0;
                  const pct = csatData.totalResponses ? Math.round((count / csatData.totalResponses) * 100) : 0;
                  return (
                    <div key={star} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-300 flex items-center gap-1">
                          {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </span>
                        <span className="text-zinc-400">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Feedback Submissions Feed */}
            <div className="bg-zinc-950/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  Recent User CSAT Feedback & Reviews
                </h4>
                <span className="text-[11px] font-mono text-zinc-500">Live Log</span>
              </div>

              <div className="space-y-4">
                {csatData.recentFeedback?.map((item, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2 hover:border-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-xs font-bold text-[#5865F2]">
                          {item.userTag?.[0] || "U"}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white">{item.userTag || item.userId}</span>
                          <span className="text-[10px] text-zinc-500 font-mono ml-2">Ticket: {item.ticketId}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(item.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed italic bg-zinc-900/40 p-2.5 rounded-lg border border-white/5">
                      "{item.feedback || "User rated without written comment."}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                      <span>Staff Handler: <strong className="text-zinc-300">{item.staffTag || item.staffId || "Support Bot"}</strong></span>
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TAB 3: CUSTOM APPLICATION FORM BUILDER (APPY SYNTHESIS) ── */}
      {activeTab === "appy" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Form Controls Bar */}
          <div className="bg-zinc-950/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Custom Application Form Builder
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono ${appForm.enabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}>
                  {appForm.enabled ? "ENABLED" : "DISABLED"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Synthesizes Appy features: Build multi-question staff forms, assign automatic roles on approval or denial, and set re-application cooldowns.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleToggleAppForm}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                  appForm.enabled
                    ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {appForm.enabled ? "✓ System Online" : "Disabled"}
              </button>

              <button
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Preview Discord Modal</span>
              </button>

              <button
                onClick={handleSaveAppForm}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Form Config</span>
              </button>
            </div>
          </div>

          {/* Configuration Grid: Auto-Roles, Cooldown & Log Channel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Approval Auto-Role Card */}
            <div className="bg-zinc-950/40 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <UserCheck className="w-4 h-4" />
                <span>Approval Auto-Role</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Role automatically awarded to the applicant upon moderator approval.
              </p>
              <input
                type="text"
                value={appForm.roleRewardId || ""}
                onChange={(e) => setAppForm({ ...appForm, roleRewardId: e.target.value })}
                placeholder="Role ID e.g. 102938475610293851"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>

            {/* Denial Auto-Role Card */}
            <div className="bg-zinc-950/40 border border-rose-500/20 rounded-2xl p-5 backdrop-blur-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <UserX className="w-4 h-4" />
                <span>Denial Auto-Role</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Role automatically assigned when application is rejected (e.g. Applicant Cooldown).
              </p>
              <input
                type="text"
                value={appForm.denyRoleId || ""}
                onChange={(e) => setAppForm({ ...appForm, denyRoleId: e.target.value })}
                placeholder="Role ID e.g. 102938475610293852"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-400 font-mono"
              />
            </div>

            {/* Cooldown & Log Channel Card */}
            <div className="bg-zinc-950/40 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Cooldown & Audit Log</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Re-Apply Cooldown</label>
                  <select
                    value={appForm.cooldown}
                    onChange={(e) => setAppForm({ ...appForm, cooldown: parseInt(e.target.value) })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value={43200}>12 Hours</option>
                    <option value={86400}>24 Hours (1 Day)</option>
                    <option value={259200}>3 Days</option>
                    <option value={604800}>7 Days (1 Week)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Log Channel ID</label>
                  <input
                    type="text"
                    value={appForm.logChannelId || ""}
                    onChange={(e) => setAppForm({ ...appForm, logChannelId: e.target.value })}
                    placeholder="Channel ID"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Question Builder Section */}
          <div className="bg-zinc-950/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Form Question List ({appForm.questions?.length || 0} / 5 Max Discord Modal limit)
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Define custom questions asked in the Discord popup modal.
                </p>
              </div>

              {/* Preset Template Loaders */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-mono">Load Presets:</span>
                <button
                  onClick={() => handleLoadPreset("staff")}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/10 text-xs text-cyan-300 font-semibold border border-white/10"
                >
                  Staff Template
                </button>
                <button
                  onClick={() => handleLoadPreset("vip")}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/10 text-xs text-purple-300 font-semibold border border-white/10"
                >
                  VIP Template
                </button>
                <button
                  onClick={handleAddQuestion}
                  disabled={appForm.questions?.length >= 5}
                  className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {appForm.questions?.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 space-y-3 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold font-mono flex items-center justify-center border border-cyan-500/30">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">Question #{idx + 1}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.required !== false}
                          onChange={(e) => handleUpdateQuestion(idx, "required", e.target.checked)}
                          className="rounded bg-zinc-950 border-white/20 text-cyan-500 focus:ring-0"
                        />
                        <span>Required</span>
                      </label>

                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Question Label</label>
                      <input
                        type="text"
                        value={q.label || ""}
                        onChange={(e) => handleUpdateQuestion(idx, "label", e.target.value)}
                        placeholder="e.g. Why do you want to join our team?"
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Input Field Type</label>
                      <select
                        value={q.style || "Paragraph"}
                        onChange={(e) => handleUpdateQuestion(idx, "style", e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="Short">Short Text Line</option>
                        <option value="Paragraph">Multi-line Paragraph</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Placeholder Text</label>
                      <input
                        type="text"
                        value={q.placeholder || ""}
                        onChange={(e) => handleUpdateQuestion(idx, "placeholder", e.target.value)}
                        placeholder="Guidance text inside input box..."
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview Modal Overlay */}
          {showPreviewModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#313338] text-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-white/10">
                <div className="bg-[#2b2d31] px-5 py-4 flex items-center justify-between border-b border-black/20">
                  <h4 className="text-sm font-extrabold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#5865F2]" />
                    Staff Application Modal Preview
                  </h4>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="p-1 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  {appForm.questions?.map((q, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300 flex items-center gap-1 uppercase tracking-wider">
                        <span>{q.label}</span>
                        {q.required !== false && <span className="text-rose-400">*</span>}
                      </label>
                      {q.style === "Short" ? (
                        <input
                          disabled
                          placeholder={q.placeholder || "Enter your answer..."}
                          className="w-full bg-[#1e1f22] border border-black/40 rounded-lg px-3 py-2 text-xs text-zinc-300"
                        />
                      ) : (
                        <textarea
                          disabled
                          rows={3}
                          placeholder={q.placeholder || "Enter your detailed response..."}
                          className="w-full bg-[#1e1f22] border border-black/40 rounded-lg px-3 py-2 text-xs text-zinc-300 resize-none"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-[#2b2d31] px-5 py-3 flex items-center justify-end gap-3 border-t border-black/20">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-4 py-1.5 rounded-md bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs shadow-md"
                  >
                    Submit Application
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
