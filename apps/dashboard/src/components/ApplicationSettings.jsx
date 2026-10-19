"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ChevronUp,
  ChevronDown,
  Trash2,
  Search,
  Settings2,
  Eye,
  ShieldCheck,
  Timer,
  Inbox,
  PenLine,
  BadgeCheck,
  GripVertical,
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

/* Count-up hook (respects reduced motion) */
function useCountUp(target, { duration = 1100 } = {}) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVal(target);
      return;
    }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}

/* ────────────────────────────── helpers ────────────────────────────── */

const clone = (v) => JSON.parse(JSON.stringify(v));

function timeAgo(minutes) {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  const h = minutes / 60;
  if (h < 24) return `${h < 10 ? h.toFixed(1) : Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function fmtReview(m) {
  if (m == null) return "—";
  if (m < 60) return `${Math.round(m)}m`;
  return `${(m / 60).toFixed(1)}h`;
}

/* ────────────────────────────── api mapping ────────────────────────────── */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => UUID_RE.test(String(v || ""));

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

/* Server answers: { [questionId]: { question, answer } } → [{ q, a }] */
function mapAnswers(answers) {
  if (!answers) return [];
  const list = Array.isArray(answers) ? answers : Object.values(answers);
  return list.map((a) => ({ q: a?.question ?? "", a: a?.answer ?? "N/A" }));
}

/* ApplicationForm row → builder view shape */
function mapForm(f) {
  return {
    id: f.id,
    name: f.name || "Application",
    description: f.description || "",
    enabled: Boolean(f.enabled),
    questions: (Array.isArray(f.questions) ? f.questions : []).map((q, i) => ({
      id: String(q?.id || `q${i + 1}`),
      label: q?.label || "",
      type: q?.style === "short" ? "short" : "paragraph",
      required: q?.required !== false,
    })),
    acceptRole: f.roleRewardId || null,
    rejectRole: f.denyRoleId || null,
    removeRole: f.removeRoleId || null,
    requiredRole: f.requiredRoleId || null,
    pingRole: f.pingRoleId || null,
    managerRole: f.managerRoleId || null,
    logChannel: f.logChannelId || "",
    cooldownHours: Math.round((Number(f.cooldown) || 0) / 3600),
  };
}

/* StaffApplication row → submission row shape */
function mapSubmission(s) {
  const created = new Date(s.createdAt).getTime();
  const reviewed = s.reviewedAt ? new Date(s.reviewedAt).getTime() : null;
  return {
    id: s.id,
    user: s.userId || "Unknown",
    tag: String(s.userId || "").toLowerCase(),
    hue: hashHue(String(s.userId || s.id || "")),
    formId: s.formId,
    status: s.status || "pending",
    minutesAgo: Number.isFinite(created) ? Math.max(0, (Date.now() - created) / 60000) : 0,
    reviewMinutes:
      reviewed != null && Number.isFinite(created) ? Math.max(0, (reviewed - created) / 60000) : null,
    reviewer: s.moderatorId || null,
    answers: mapAnswers(s.answers),
  };
}

const STATUS_META = {
  pending: { label: "Pending", color: "#FFB547", icon: Clock },
  approved: { label: "Approved", color: "#39D98A", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "#FF5C7A", icon: XCircle },
};

const ROLE_PRESETS = [
  "@Member",
  "@Verified",
  "@Moderator",
  "@Trial Mod",
  "@Admin Council",
  "@Event Team",
  "@Partner",
  "@Applicant",
  "@Applicant (Denied)",
];

/* ────────────────────────────── seed data ────────────────────────────── */

const INITIAL_FORMS = [
  {
    id: "form-staff",
    name: "Staff Moderator Application",
    description:
      "Join the moderation team. Applications are reviewed by the Admin Council within 48 hours.",
    enabled: true,
    questions: [
      { id: "age", label: "What is your age?", type: "short", required: true },
      { id: "motivation", label: "Why do you want to join the team?", type: "paragraph", required: true },
      { id: "experience", label: "Previous moderation experience?", type: "paragraph", required: true },
      { id: "commitment", label: "Weekly commitment (hours)?", type: "short", required: true },
    ],
    acceptRole: "@Moderator",
    rejectRole: "@Applicant (Denied)",
    removeRole: "@Applicant",
    requiredRole: "@Member",
    pingRole: "@Admin Council",
    managerRole: "@Admin Council",
    logChannel: "#application-review",
    cooldownHours: 24,
  },
  {
    id: "form-event",
    name: "Event Host Application",
    description: "Host movie nights, game tournaments, and community events for the server.",
    enabled: true,
    questions: [
      { id: "event_idea", label: "What event would you host first?", type: "paragraph", required: true },
      { id: "availability", label: "When are you usually available?", type: "short", required: true },
      { id: "mic", label: "Do you have a working microphone?", type: "short", required: true },
    ],
    acceptRole: "@Event Team",
    rejectRole: null,
    removeRole: null,
    requiredRole: "@Member",
    pingRole: "@Event Team",
    managerRole: "@Admin Council",
    logChannel: "#event-staff",
    cooldownHours: 72,
  },
  {
    id: "form-partner",
    name: "Partnership Request",
    description: "For communities and creators interested in partnering with Crystal Realm.",
    enabled: false,
    questions: [
      { id: "community", label: "Tell us about your community", type: "paragraph", required: true },
      { id: "size", label: "How many members do you have?", type: "short", required: true },
      { id: "pitch", label: "What does a partnership look like to you?", type: "paragraph", required: false },
    ],
    acceptRole: "@Partner",
    rejectRole: null,
    removeRole: null,
    requiredRole: null,
    pingRole: "@Admin Council",
    managerRole: "@Admin Council",
    logChannel: "#partnerships",
    cooldownHours: 168,
  },
];

const INITIAL_SUBMISSIONS = [
  {
    id: "sub-1", user: "NovaStar", tag: "novastar", hue: 268, formId: "form-staff",
    status: "pending", minutesAgo: 42, reviewMinutes: null, reviewer: null,
    answers: [
      { q: "What is your age?", a: "19" },
      { q: "Why do you want to join the team?", a: "I've been active here for over a year and want to help keep the community as welcoming as it was for me." },
      { q: "Previous moderation experience?", a: "Moderated a 40k-member gaming server for 8 months; handled tickets and raid incidents." },
      { q: "Weekly commitment (hours)?", a: "15-20" },
    ],
  },
  {
    id: "sub-2", user: "pixelForge", tag: "pixelforge", hue: 210, formId: "form-staff",
    status: "pending", minutesAgo: 178, reviewMinutes: null, reviewer: null,
    answers: [
      { q: "What is your age?", a: "23" },
      { q: "Why do you want to join the team?", a: "I enjoy de-escalating conflicts and I'm online during EU nights when coverage is thin." },
      { q: "Previous moderation experience?", a: "2 years as head mod on a study community, plus discord.py bot development." },
      { q: "Weekly commitment (hours)?", a: "10-12" },
    ],
  },
  {
    id: "sub-3", user: "LunaByte", tag: "lunabyte", hue: 190, formId: "form-event",
    status: "pending", minutesAgo: 310, reviewMinutes: null, reviewer: null,
    answers: [
      { q: "What event would you host first?", a: "A retro game night with a bracket tournament and small Nitro prizes." },
      { q: "When are you usually available?", a: "Weekends after 6pm GMT" },
      { q: "Do you have a working microphone?", a: "Yes — Shure MV7, no background noise." },
    ],
  },
  {
    id: "sub-4", user: "CodeWraith", tag: "codewraith", hue: 285, formId: "form-staff",
    status: "approved", minutesAgo: 1560, reviewMinutes: 34, reviewer: "Aurora",
    answers: [
      { q: "What is your age?", a: "21" },
      { q: "Why do you want to join the team?", a: "I want to give back to the server that taught me everything about community building." },
      { q: "Previous moderation experience?", a: "Led a 12k member support server; wrote their automod rules." },
      { q: "Weekly commitment (hours)?", a: "20+" },
    ],
  },
  {
    id: "sub-5", user: "MiraGlow", tag: "miraglow", hue: 152, formId: "form-event",
    status: "approved", minutesAgo: 2880, reviewMinutes: 122, reviewer: "Kai",
    answers: [
      { q: "What event would you host first?", a: "An art contest with community voting and a spotlight stream for the winners." },
      { q: "When are you usually available?", a: "Weekday evenings" },
      { q: "Do you have a working microphone?", a: "Yes" },
    ],
  },
  {
    id: "sub-6", user: "ByteNomad", tag: "bytenomad", hue: 330, formId: "form-staff",
    status: "rejected", minutesAgo: 4320, reviewMinutes: 55, reviewer: "Aurora",
    answers: [
      { q: "What is your age?", a: "16" },
      { q: "Why do you want to join the team?", a: "I want moderator powers to mute annoying people." },
      { q: "Previous moderation experience?", a: "None" },
      { q: "Weekly commitment (hours)?", a: "Depends" },
    ],
  },
  {
    id: "sub-7", user: "EchoVortex", tag: "echovortex", hue: 225, formId: "form-staff",
    status: "pending", minutesAgo: 480, reviewMinutes: null, reviewer: null,
    answers: [
      { q: "What is your age?", a: "25" },
      { q: "Why do you want to join the team?", a: "I've run moderation teams professionally and can help structure the appeals process." },
      { q: "Previous moderation experience?", a: "Community manager for a 100k+ creator; built escalation workflows." },
      { q: "Weekly commitment (hours)?", a: "12-15" },
    ],
  },
  {
    id: "sub-8", user: "SableFox", tag: "sablefox", hue: 175, formId: "form-staff",
    status: "approved", minutesAgo: 5760, reviewMinutes: 41, reviewer: "Kai",
    answers: [
      { q: "What is your age?", a: "22" },
      { q: "Why do you want to join the team?", a: "Night shift coverage — I'm active between 1am and 6am CET when the server is unmoderated." },
      { q: "Previous moderation experience?", a: "3 years across two communities; familiar with ticket tooling." },
      { q: "Weekly commitment (hours)?", a: "18" },
    ],
  },
  {
    id: "sub-9", user: "QuantumRae", tag: "quantumrae", hue: 300, formId: "form-event",
    status: "rejected", minutesAgo: 7200, reviewMinutes: 190, reviewer: "Aurora",
    answers: [
      { q: "What event would you host first?", a: "A 24-hour stream marathon." },
      { q: "When are you usually available?", a: "Rarely" },
      { q: "Do you have a working microphone?", a: "No" },
    ],
  },
  {
    id: "sub-10", user: "AstraKid", tag: "astrakid", hue: 240, formId: "form-partner",
    status: "pending", minutesAgo: 1440, reviewMinutes: null, reviewer: null,
    answers: [
      { q: "Tell us about your community", a: "A 6k-member indie dev community focused on game jams." },
      { q: "How many members do you have?", a: "6,200" },
      { q: "What does a partnership look like to you?", a: "Cross-promoted events and a shared resources channel." },
    ],
  },
];

/* ────────────────────────────── shared UI atoms ────────────────────────────── */

const inputCls =
  "w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-colors focus:border-[#7C5CFF]/60 focus:bg-white/[0.05]";

const selectCls =
  "rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 outline-none transition-colors focus:border-[#7C5CFF]/60 cursor-pointer [&>option]:bg-[#12141B] [&>option]:text-slate-200";

const btnPrimary =
  "inline-flex items-center gap-2 rounded-xl bg-[#7C5CFF] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#7C5CFF]/25 transition-all hover:bg-[#6a4bf0] active:scale-[0.98]";

const btnGhost =
  "inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.06]";

function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="section-label mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[10px] text-slate-600">{hint}</span>}
    </label>
  );
}

function RoleSelect({ value, onChange }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={`${selectCls} w-full py-2.5 text-xs`}
    >
      <option value="">— None —</option>
      {value && !ROLE_PRESETS.includes(value) && <option value={value}>{value}</option>}
      {ROLE_PRESETS.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
        enabled ? "border-[#7C5CFF]/50 bg-[#7C5CFF]/80" : "border-white/[0.08] bg-white/[0.05]"
      }`}
      aria-pressed={enabled}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow ${
          enabled ? "left-[25px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

function IconBtn({ onClick, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5 text-slate-500 transition-colors hover:border-[#7C5CFF]/30 hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function MiniStat({ label, value, suffix = "", format, color, icon: Icon, index }) {
  const count = useCountUp(value, { duration: 700 + index * 90 });
  return (
    <div className="panel panel-hover p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="section-label">{label}</span>
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      </div>
      <div className="mt-2 text-xl font-extrabold text-white">
        {format ? format(count) : `${Math.round(count)}${suffix}`}
      </div>
    </div>
  );
}

/* ────────────────────────────── submission row ────────────────────────────── */

function SubmissionRow({ s, formName, expanded, onToggle, onReview }) {
  const meta = STATUS_META[s.status] || STATUS_META.pending;
  const StatusIcon = meta.icon;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{
            background: `linear-gradient(135deg, hsl(${s.hue} 70% 55%), hsl(${s.hue + 40} 70% 45%))`,
          }}
        >
          {s.user?.[0] ?? "?"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold text-white">{s.user}</span>
          <span className="block truncate text-[10px] text-slate-500">
            {formName} · {timeAgo(s.minutesAgo)}
          </span>
        </span>
        <span className="hidden text-[10px] text-slate-500 sm:block">
          {s.reviewMinutes != null ? `reviewed in ${fmtReview(s.reviewMinutes)}` : "awaiting review"}
        </span>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
          style={{ borderColor: `${meta.color}40`, color: meta.color, background: `${meta.color}12` }}
        >
          <StatusIcon className="h-3 w-3" />
          {meta.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-600 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="space-y-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5">
                {s.answers.map((a) => (
                  <div key={a.q}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {a.q}
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-300">{a.a}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {s.status === "pending" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onReview(s.id, "approved")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#39D98A]/30 bg-[#39D98A]/10 px-3 py-1.5 text-[11px] font-bold text-[#39D98A] transition-colors hover:bg-[#39D98A]/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve & grant role
                    </button>
                    <button
                      type="button"
                      onClick={() => onReview(s.id, "rejected")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF5C7A]/30 bg-[#FF5C7A]/10 px-3 py-1.5 text-[11px] font-bold text-[#FF5C7A] transition-colors hover:bg-[#FF5C7A]/20"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                    <span className="ml-auto text-[10px] text-slate-600">
                      Role automation runs on review
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-500">
                    Reviewed by <b className="text-slate-300">{s.reviewer || "staff"}</b>
                    {s.reviewMinutes != null &&
                      ` · ${fmtReview(s.reviewMinutes)} after submission`}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────── builder view ────────────────────────────── */

function BuilderView({
  forms,
  activeForm,
  dirty,
  setActiveFormId,
  patchForm,
  patchQuestion,
  addQuestion,
  removeQuestion,
  moveQuestion,
  saveForm,
  resetForm,
  deleteForm,
  onToggleEnabled,
}) {
  const atMax = activeForm.questions.length >= 5;

  return (
    <motion.div
      key="builder"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: EASE }}
      className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"
    >
      {/* ── left: editor ── */}
      <div className="min-w-0 space-y-5">
        {/* form switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {forms.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFormId(f.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                f.id === activeForm.id
                  ? "border-[#7C5CFF]/40 bg-[#7C5CFF]/10 text-white"
                  : "border-white/[0.06] bg-white/[0.02] text-slate-500 hover:text-slate-300"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  f.enabled ? "bg-[#39D98A]" : "bg-slate-600"
                }`}
              />
              {f.name}
            </button>
          ))}
        </div>

        {/* form details */}
        <section className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <PenLine className="h-4 w-4 text-[#7C5CFF]" />
              <h3 className="text-sm font-bold">Form details</h3>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  activeForm.enabled ? "text-[#39D98A]" : "text-slate-600"
                }`}
              >
                {activeForm.enabled ? "Open" : "Closed"}
              </span>
              <Toggle enabled={activeForm.enabled} onChange={onToggleEnabled} />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Form name">
              <input
                className={inputCls}
                value={activeForm.name}
                onChange={(e) => patchForm({ name: e.target.value })}
                placeholder="Staff Moderator Application"
              />
            </Field>
            <Field label="Description" hint="Shown on the apply panel and above the form.">
              <textarea
                rows={2}
                className={`${inputCls} resize-none`}
                value={activeForm.description || ""}
                onChange={(e) => patchForm({ description: e.target.value })}
                placeholder="Tell applicants what this role involves..."
              />
            </Field>
          </div>
        </section>

        {/* questions */}
        <section className="panel p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <FileText className="h-4 w-4 text-[#7C5CFF]" />
            <h3 className="text-sm font-bold">Questions</h3>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold text-slate-400">
              {activeForm.questions.length}/5
            </span>
            <span className="ml-auto text-[10px] text-slate-600">
              Discord modals support up to 5 questions
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {activeForm.questions.map((q, i) => (
              <div
                key={q.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1]"
              >
                <div className="flex items-center gap-2.5">
                  <GripVertical className="h-4 w-4 shrink-0 text-slate-700" />
                  <input
                    className={`${inputCls} flex-1 text-xs`}
                    value={q.label}
                    onChange={(e) => patchQuestion(q.id, { label: e.target.value })}
                    placeholder={`Question ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    title="Remove question"
                    className="shrink-0 rounded-lg p-2 text-slate-600 transition-colors hover:bg-[#FF5C7A]/10 hover:text-[#FF5C7A]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-6">
                  <select
                    value={q.type}
                    onChange={(e) => patchQuestion(q.id, { type: e.target.value })}
                    className={selectCls}
                  >
                    <option value="short">Short text</option>
                    <option value="paragraph">Paragraph</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => patchQuestion(q.id, { required: !q.required })}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      q.required
                        ? "border-[#7C5CFF]/40 bg-[#7C5CFF]/10 text-[#B9A6FF]"
                        : "border-white/[0.08] bg-white/[0.03] text-slate-500"
                    }`}
                  >
                    <BadgeCheck className="h-3 w-3" />
                    {q.required ? "Required" : "Optional"}
                  </button>

                  <span className="hidden text-[10px] text-slate-600 sm:block">
                    {q.type === "short" ? "Single line input" : "Multi-line input"}
                  </span>

                  <div className="ml-auto flex items-center gap-1">
                    <IconBtn
                      onClick={() => moveQuestion(q.id, -1)}
                      disabled={i === 0}
                      title="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      onClick={() => moveQuestion(q.id, 1)}
                      disabled={i === activeForm.questions.length - 1}
                      title="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            disabled={atMax}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-xs font-bold transition-colors ${
              atMax
                ? "cursor-not-allowed border-white/[0.05] text-slate-700"
                : "border-white/[0.12] text-slate-400 hover:border-[#7C5CFF]/40 hover:text-[#B9A6FF]"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            {atMax ? "Modal limit reached (5/5)" : "Add question"}
          </button>
        </section>

        {/* role automation */}
        <section className="panel p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[#7C5CFF]" />
            <h3 className="text-sm font-bold">Role automation</h3>
            <span className="ml-auto text-[10px] text-slate-600">
              Applied automatically when a reviewer decides
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Accept role" hint="Granted when approved">
              <RoleSelect value={activeForm.acceptRole} onChange={(v) => patchForm({ acceptRole: v })} />
            </Field>
            <Field label="Reject role" hint="Granted when rejected">
              <RoleSelect value={activeForm.rejectRole} onChange={(v) => patchForm({ rejectRole: v })} />
            </Field>
            <Field label="Remove on accept" hint="Stripped from the member when approved">
              <RoleSelect value={activeForm.removeRole} onChange={(v) => patchForm({ removeRole: v })} />
            </Field>
            <Field label="Required to apply" hint="Applicants must already have this role">
              <RoleSelect
                value={activeForm.requiredRole}
                onChange={(v) => patchForm({ requiredRole: v })}
              />
            </Field>
            <Field label="Ping on submission" hint="Mentioned in the review channel">
              <RoleSelect value={activeForm.pingRole} onChange={(v) => patchForm({ pingRole: v })} />
            </Field>
            <Field label="Reviewer role" hint="Who can approve or deny">
              <RoleSelect
                value={activeForm.managerRole}
                onChange={(v) => patchForm({ managerRole: v })}
              />
            </Field>
          </div>
        </section>

        {/* workflow */}
        <section className="panel p-5">
          <div className="flex items-center gap-2.5">
            <Timer className="h-4 w-4 text-[#7C5CFF]" />
            <h3 className="text-sm font-bold">Review workflow</h3>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Review channel" hint="Where new submissions are posted with Approve / Reject buttons">
              <input
                className={inputCls}
                value={activeForm.logChannel || ""}
                onChange={(e) => patchForm({ logChannel: e.target.value })}
                placeholder="#application-review"
              />
            </Field>
            <Field label="Cooldown (hours)" hint="How long applicants must wait before applying again">
              <input
                type="number"
                min="0"
                className={inputCls}
                value={activeForm.cooldownHours}
                onChange={(e) =>
                  patchForm({ cooldownHours: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </Field>
          </div>
        </section>

        {/* save bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <span
            className={`text-[11px] font-semibold ${
              dirty ? "text-[#FFB547]" : "text-slate-600"
            }`}
          >
            {dirty ? "● Unsaved changes" : "✓ All changes saved"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {forms.length > 1 && (
              <button
                type="button"
                onClick={deleteForm}
                className="px-2 text-[11px] font-semibold text-slate-600 transition-colors hover:text-[#FF5C7A]"
              >
                Delete form
              </button>
            )}
            <button
              type="button"
              onClick={resetForm}
              disabled={!dirty}
              className={`${btnGhost} ${!dirty ? "pointer-events-none opacity-40" : ""}`}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={saveForm}
              disabled={!dirty}
              className={`${btnPrimary} ${!dirty ? "pointer-events-none opacity-40" : ""}`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Save form
            </button>
          </div>
        </div>
      </div>

      {/* ── right: live preview ── */}
      <div className="min-w-0 space-y-4 xl:sticky xl:top-5 xl:self-start">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#7C5CFF]" />
              <h3 className="text-sm font-bold">Live preview</h3>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold text-slate-500">
              Discord
            </span>
          </div>

          {/* apply panel */}
          <div className="mt-4">
            <span className="section-label">Apply panel</span>
            <div className="mt-2 rounded-xl border border-white/[0.06] bg-[#151823] p-3.5">
              <div className="flex gap-3">
                <div className="w-1 shrink-0 rounded-full bg-[#7C5CFF]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <ClipboardList className="h-3.5 w-3.5 shrink-0 text-[#7C5CFF]" />
                    <span className="truncate">{activeForm.name || "Untitled Application"}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    {activeForm.description || "No description yet."}
                  </p>
                </div>
              </div>
              <div className="mt-3 w-full rounded-lg bg-[#4E5D94]/60 py-2 text-center text-[11px] font-bold text-white">
                📝 Apply Now
              </div>
            </div>
          </div>

          {/* modal preview */}
          <div className="mt-4">
            <span className="section-label">
              Modal form · {activeForm.questions.length}/5 questions
            </span>
            <div className="mt-2 space-y-2.5 rounded-xl border border-white/[0.06] bg-[#111320] p-3.5">
              <div className="border-b border-white/[0.05] pb-2 text-xs font-bold text-white">
                {(activeForm.name || "Application").slice(0, 45)}
              </div>
              {activeForm.questions.length === 0 && (
                <div className="py-2 text-center text-[10px] text-slate-600">
                  No questions yet — add one to shape the modal.
                </div>
              )}
              {activeForm.questions.map((q) => (
                <div key={q.id}>
                  <div className="text-[10px] font-semibold text-slate-400">
                    {q.label || "Untitled question"}
                    {q.required && <span className="ml-1 text-[#FF5C7A]">*</span>}
                  </div>
                  <div
                    className={`mt-1 flex items-center rounded-md border border-white/[0.05] bg-white/[0.04] px-2 text-[9px] text-slate-600 ${
                      q.type === "paragraph" ? "h-8" : "h-5"
                    }`}
                  >
                    {q.type === "paragraph" ? "Write your answer..." : "Short answer..."}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* review message preview */}
          <div className="mt-4">
            <span className="section-label">Review message</span>
            <div className="mt-2 rounded-xl border border-white/[0.06] bg-[#151823] p-3.5">
              <div className="truncate text-[11px] font-bold text-white">
                📝 New Application — {activeForm.name || "Untitled"}
              </div>
              <div className="mt-1.5 text-[10px] text-slate-500">
                User: @applicant · ID: a1b2c3…
              </div>
              <div className="mt-2 space-y-1.5">
                {activeForm.questions.slice(0, 2).map((q) => (
                  <div key={q.id} className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
                    <div className="truncate text-[9px] font-bold text-slate-500">
                      {q.label || "Untitled question"}
                    </div>
                    <div className="text-[10px] italic text-slate-400">applicant response…</div>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex gap-2">
                <span className="flex-1 rounded-md border border-[#39D98A]/25 bg-[#39D98A]/15 py-1.5 text-center text-[10px] font-bold text-[#39D98A]">
                  ✓ Approve
                </span>
                <span className="flex-1 rounded-md border border-[#FF5C7A]/25 bg-[#FF5C7A]/15 py-1.5 text-center text-[10px] font-bold text-[#FF5C7A]">
                  ✕ Reject
                </span>
              </div>
              <div className="mt-2 text-[9px] text-slate-600">
                {activeForm.pingRole
                  ? `Pings ${activeForm.pingRole} on new submissions`
                  : "No ping role set"}
                {activeForm.logChannel ? ` · posted to ${activeForm.logChannel}` : ""}
              </div>
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#39D98A]" />
            <span>
              Submissions are reviewed with <b className="text-slate-300">/apply</b> flow — members
              run <b className="text-slate-300">/apply start</b> to open this modal.
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────── submissions view ────────────────────────────── */

function SubmissionsView({
  submissions,
  forms,
  filter,
  setFilter,
  query,
  setQuery,
  expandedId,
  setExpandedId,
  onReview,
}) {
  const formName = (fid) => forms.find((f) => f.id === fid)?.name || "—";
  const q = query.trim().toLowerCase();

  const counts = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  const filtered = submissions.filter(
    (s) =>
      (filter === "all" || s.status === filter) &&
      (!q ||
        (s.user || "").toLowerCase().includes(q) ||
        (s.tag || "").includes(q) ||
        formName(s.formId).toLowerCase().includes(q))
  );

  const chips = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <motion.div
      key="submissions"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: EASE }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
              filter === c.id
                ? "border-[#7C5CFF]/40 bg-[#7C5CFF]/10 text-[#B9A6FF]"
                : "border-white/[0.07] bg-white/[0.02] text-slate-500 hover:text-slate-300"
            }`}
          >
            {c.label} <span className="opacity-60">{counts[c.id]}</span>
          </button>
        ))}

        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applicants or forms…"
            className={`${inputCls} py-2 pl-9 text-xs`}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center gap-2 py-14 text-center">
          <Inbox className="h-8 w-8 text-slate-700" />
          <p className="text-sm font-bold text-slate-400">No submissions found</p>
          <p className="text-[11px] text-slate-600">
            {query ? "Try a different search." : "Applications will appear here the moment they arrive."}
          </p>
        </div>
      ) : (
        <div className="panel divide-y divide-white/[0.04] overflow-hidden">
          {filtered.map((s) => (
            <SubmissionRow
              key={s.id}
              s={s}
              formName={formName(s.formId)}
              expanded={expandedId === s.id}
              onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
              onReview={onReview}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════ main ══════════════════════════════ */

export default function ApplicationSettings({ guildId }) {
  const [view, setView] = useState("builder");
  const [forms, setForms] = useState(() => clone(INITIAL_FORMS));
  const [savedForms, setSavedForms] = useState(() => clone(INITIAL_FORMS));
  const [submissions, setSubmissions] = useState(() => clone(INITIAL_SUBMISSIONS));
  const [activeFormId, setActiveFormId] = useState(INITIAL_FORMS[0].id);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const activeForm = forms.find((f) => f.id === activeFormId) || forms[0];
  const dirty = JSON.stringify(forms) !== JSON.stringify(savedForms);

  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /* request guards — only the latest load per resource may write state */
  const formsRequestSeq = useRef(0);
  const submissionsRequestSeq = useRef(0);

  /* real data — forms + submissions; demo arrays are fallback for guest mode / fetch failure */
  const loadForms = useCallback(async () => {
    const requestId = ++formsRequestSeq.current;
    if (!guildId) {
      setForms(clone(INITIAL_FORMS));
      setSavedForms(clone(INITIAL_FORMS));
      setActiveFormId(INITIAL_FORMS[0].id);
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/applications`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== formsRequestSeq.current) return; // stale response from a previous guild
      const mapped = (Array.isArray(data?.forms) ? data.forms : []).map(mapForm);
      setForms(mapped);
      setSavedForms(clone(mapped));
      setActiveFormId((prev) => (mapped.some((f) => f.id === prev) ? prev : mapped[0]?.id ?? null));
    } catch (err) {
      if (requestId !== formsRequestSeq.current) return; // stale failure — ignore
      console.error("[ApplicationSettings] Failed to load forms — showing demo data:", err);
      setForms(clone(INITIAL_FORMS));
      setSavedForms(clone(INITIAL_FORMS));
      setActiveFormId(INITIAL_FORMS[0].id);
    }
  }, [guildId]);

  const loadSubmissions = useCallback(async () => {
    const requestId = ++submissionsRequestSeq.current;
    if (!guildId) {
      setSubmissions(clone(INITIAL_SUBMISSIONS));
      return;
    }
    try {
      const res = await fetch(`/api/guilds/${guildId}/applications/submissions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== submissionsRequestSeq.current) return; // stale response from a previous guild
      setSubmissions((Array.isArray(data) ? data : []).map(mapSubmission));
    } catch (err) {
      if (requestId !== submissionsRequestSeq.current) return; // stale failure — ignore
      console.error("[ApplicationSettings] Failed to load submissions — showing demo data:", err);
      setSubmissions(clone(INITIAL_SUBMISSIONS));
    }
  }, [guildId]);

  useEffect(() => {
    loadForms();
    loadSubmissions();
    return () => {
      // Invalidate in-flight loads so a previous guild's response can't clobber state.
      formsRequestSeq.current += 1;
      submissionsRequestSeq.current += 1;
    };
  }, [loadForms, loadSubmissions]);

  /* derived stats */
  const total = submissions.length;
  const pending = submissions.filter((s) => s.status === "pending").length;
  const approved = submissions.filter((s) => s.status === "approved").length;
  const rejected = submissions.filter((s) => s.status === "rejected").length;
  const reviewedCount = approved + rejected;
  const approvalRate = reviewedCount ? Math.round((approved / reviewedCount) * 100) : 0;
  const reviewTimes = submissions
    .filter((s) => s.reviewMinutes != null)
    .map((s) => s.reviewMinutes);
  const avgReview = reviewTimes.length
    ? reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length
    : 0;

  /* form editing */
  const patchForm = (patch) => {
    setForms((list) =>
      list.map((f) => (f.id === activeForm.id ? { ...f, ...patch } : f))
    );
  };

  const patchQuestion = (qid, patch) => {
    setForms((list) =>
      list.map((f) =>
        f.id === activeForm.id
          ? { ...f, questions: f.questions.map((qq) => (qq.id === qid ? { ...qq, ...patch } : qq)) }
          : f
      )
    );
  };

  const addQuestion = () => {
    if (activeForm.questions.length >= 5) return;
    patchForm({
      questions: [
        ...activeForm.questions,
        { id: `q_${Date.now()}`, label: "", type: "short", required: true },
      ],
    });
  };

  const removeQuestion = (qid) =>
    patchForm({ questions: activeForm.questions.filter((qq) => qq.id !== qid) });

  const moveQuestion = (qid, dir) => {
    const idx = activeForm.questions.findIndex((qq) => qq.id === qid);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= activeForm.questions.length) return;
    const qs = [...activeForm.questions];
    [qs[idx], qs[to]] = [qs[to], qs[idx]];
    patchForm({ questions: qs });
  };

  const createForm = () => {
    const id = `form-${Date.now()}`;
    const fresh = {
      id,
      name: "Untitled Application",
      description: "",
      enabled: false,
      questions: [
        { id: `q_${Date.now()}`, label: "What should we know about you?", type: "paragraph", required: true },
      ],
      acceptRole: null,
      rejectRole: null,
      removeRole: null,
      requiredRole: null,
      pingRole: null,
      managerRole: null,
      logChannel: "",
      cooldownHours: 24,
    };
    setForms((list) => [...list, fresh]);
    setActiveFormId(id);
    setView("builder");
    showToast("Draft form created — configure it, then hit Save");
  };

  const saveForm = async () => {
    if (!guildId) {
      setSavedForms(clone(forms));
      showToast("Form saved — /apply start serves it instantly");
      return;
    }

    const payload = {
      ...(isUuid(activeForm.id) ? { id: activeForm.id } : {}),
      name: activeForm.name,
      description: activeForm.description || "",
      enabled: activeForm.enabled,
      questions: activeForm.questions.map((q) => ({
        id: String(q.id).slice(0, 90),
        label: q.label,
        placeholder: "",
        style: q.type === "short" ? "short" : "paragraph",
        required: q.required !== false,
      })),
      roleRewardId: activeForm.acceptRole,
      denyRoleId: activeForm.rejectRole,
      removeRoleId: activeForm.removeRole,
      requiredRoleId: activeForm.requiredRole,
      pingRoleId: activeForm.pingRole,
      managerRoleId: activeForm.managerRole,
      logChannelId: activeForm.logChannel || null,
      cooldown: Math.max(0, Math.round((Number(activeForm.cooldownHours) || 0) * 3600)),
    };

    try {
      const res = await fetch(`/api/guilds/${guildId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.form) {
        showToast(data.error || "Failed to save form");
        return;
      }
      const saved = mapForm(data.form);
      setForms((list) => list.map((f) => (f.id === activeForm.id ? saved : f)));
      setSavedForms((list) => list.map((f) => (f.id === activeForm.id ? clone(saved) : f)));
      setActiveFormId(saved.id);
      showToast("Form saved — /apply start serves it instantly");
    } catch (err) {
      console.error("[ApplicationSettings] Failed to save form:", err);
      showToast("Network error while saving form");
    }
  };

  const resetForm = () => {
    setForms(clone(savedForms));
    showToast("Changes reverted to last save");
  };

  const deleteForm = async () => {
    if (forms.length <= 1) return;
    const target = activeForm;

    if (guildId && isUuid(target.id)) {
      try {
        const res = await fetch(`/api/guilds/${guildId}/applications/${target.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || "Failed to delete form");
          return;
        }
      } catch (err) {
        console.error("[ApplicationSettings] Failed to delete form:", err);
        showToast("Network error while deleting form");
        return;
      }
    }

    const remaining = forms.filter((f) => f.id !== target.id);
    setForms(remaining);
    setSavedForms((list) => list.filter((f) => f.id !== target.id));
    setActiveFormId(remaining[0].id);
    showToast("Form deleted");
  };

  const toggleFormEnabled = async (value) => {
    const target = activeForm;

    if (guildId && isUuid(target.id)) {
      try {
        const res = await fetch(`/api/guilds/${guildId}/applications/${target.id}/toggle`, {
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(data.error || "Failed to update form");
          return;
        }
        const enabled = typeof data.enabled === "boolean" ? data.enabled : value;
        setForms((list) => list.map((f) => (f.id === target.id ? { ...f, enabled } : f)));
        setSavedForms((list) => list.map((f) => (f.id === target.id ? { ...f, enabled } : f)));
      } catch (err) {
        console.error("[ApplicationSettings] Failed to toggle form:", err);
        showToast("Network error while updating form");
      }
      return;
    }

    patchForm({ enabled: value });
  };

  const reviewSubmission = async (id, status) => {
    const toastMsg =
      status === "approved"
        ? "Application approved — role automation queued"
        : "Application rejected — applicant notified";

    if (guildId && isUuid(id)) {
      try {
        const res = await fetch(
          `/api/guilds/${guildId}/applications/submissions/${id}/review`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: status === "approved" ? "approve" : "reject" }),
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || "Failed to review application");
          return;
        }
      } catch (err) {
        console.error("[ApplicationSettings] Failed to review application:", err);
        showToast("Network error while reviewing application");
        return;
      }
      showToast(toastMsg);
      await loadSubmissions();
      return;
    }

    setSubmissions((list) =>
      list.map((s) =>
        s.id === id ? { ...s, status, reviewMinutes: 0.6, reviewer: "You" } : s
      )
    );
    showToast(toastMsg);
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-5 text-white"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="panel fixed bottom-6 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 text-xs font-semibold shadow-2xl shadow-black/60"
          >
            <CheckCircle2 className="h-4 w-4 text-[#39D98A]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        variants={rise}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/10 text-[#7C5CFF]">
              <ClipboardList className="h-4 w-4" />
            </span>
            Applications
          </h2>
          <p className="mt-1.5 font-body text-xs text-slate-500">
            Appy-grade form builder — staff intake, role automation, and a review inbox in one place.
          </p>
        </div>
        <button type="button" onClick={createForm} className={btnPrimary}>
          <Plus className="h-3.5 w-3.5" /> New form
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={rise}
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      >
        <MiniStat label="Total submissions" value={total} icon={Inbox} color="#5B8CFF" index={0} />
        <MiniStat label="Pending review" value={pending} icon={Clock} color="#FFB547" index={1} />
        <MiniStat label="Approved" value={approved} icon={CheckCircle2} color="#39D98A" index={2} />
        <MiniStat label="Rejected" value={rejected} icon={XCircle} color="#FF5C7A" index={3} />
        <MiniStat
          label="Approval rate"
          value={approvalRate}
          suffix="%"
          icon={BadgeCheck}
          color="#7C5CFF"
          index={4}
        />
        <MiniStat
          label="Avg review time"
          value={avgReview}
          format={fmtReview}
          icon={Timer}
          color="#58BFC5"
          index={5}
        />
      </motion.div>

      {/* Segmented control */}
      <motion.div variants={rise} className="panel inline-flex items-center gap-1 p-1">
        {[
          { id: "builder", label: "Form builder", icon: Settings2, badge: 0 },
          { id: "submissions", label: "Submissions", icon: Inbox, badge: pending },
        ].map((t) => {
          const TabIcon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                view === t.id ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {view === t.id && (
                <motion.span
                  layoutId="app-seg"
                  className="absolute inset-0 rounded-xl border border-[#7C5CFF]/30 bg-[#7C5CFF]/15"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <TabIcon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{t.label}</span>
              {t.badge > 0 && (
                <span className="relative z-10 rounded-full border border-[#FFB547]/30 bg-[#FFB547]/15 px-1.5 py-0.5 text-[9px] font-extrabold text-[#FFB547]">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Views */}
      <AnimatePresence mode="wait">
        {view === "builder" ? (
          activeForm ? (
            <BuilderView
              key="builder"
              forms={forms}
              activeForm={activeForm}
              dirty={dirty}
              setActiveFormId={setActiveFormId}
              patchForm={patchForm}
              patchQuestion={patchQuestion}
              addQuestion={addQuestion}
              removeQuestion={removeQuestion}
              moveQuestion={moveQuestion}
              saveForm={saveForm}
              resetForm={resetForm}
              deleteForm={deleteForm}
              onToggleEnabled={toggleFormEnabled}
            />
          ) : (
            <motion.div
              key="no-forms"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="panel flex flex-col items-center justify-center gap-2 py-14 text-center"
            >
              <ClipboardList className="h-8 w-8 text-slate-700" />
              <p className="text-sm font-bold text-slate-400">No forms yet</p>
              <p className="text-[11px] text-slate-600">
                Create your first application form to get started.
              </p>
            </motion.div>
          )
        ) : (
          <SubmissionsView
            key="submissions"
            submissions={submissions}
            forms={forms}
            filter={filter}
            setFilter={setFilter}
            query={query}
            setQuery={setQuery}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            onReview={reviewSubmission}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
