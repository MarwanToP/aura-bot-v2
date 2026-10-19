"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

const TYPE_META = {
  command: {
    description: "Add a custom slash command to your server.",
    placeholder: "e.g. /welcome",
    success: "Command created successfully!",
    cta: "Create Command",
  },
  ticket: {
    description: "Deploy a new support ticket panel in a channel.",
    placeholder: "e.g. #support",
    success: "Ticket panel deployed!",
    cta: "Create Ticket",
  },
  giveaway: {
    description: "Launch a timed prize giveaway for your members.",
    placeholder: "e.g. Nitro Classic × 1",
    success: "Giveaway started!",
    cta: "Start Giveaway",
  },
  broadcast: {
    description: "Send an announcement embed to selected channels.",
    placeholder: "e.g. #announcements",
    success: "Broadcast queued for delivery!",
    cta: "Send Broadcast",
  },
};

export default function QuickActionModal({ action, open, isOpen, onClose, onSuccess }) {
  const visible = Boolean(open ?? isOpen) && Boolean(action);
  const meta = TYPE_META[action?.type] || TYPE_META.command;

  const [formData, setFormData] = useState({ title: "", content: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (visible) {
      setFormData({ title: "", content: "" });
      setSubmitted(false);
    }
  }, [visible]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && visible) onClose && onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      if (onSuccess) onSuccess(meta.success);
      if (onClose) onClose();
    }, 900);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="modal-scrim fixed inset-0 z-[80] flex items-center justify-center p-4"
          onClick={() => onClose && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="modal-surface relative w-full max-w-lg p-6 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onClose && onClose()}
              className="btn-icon absolute right-4 top-4 h-8 w-8 rounded-[11px]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-10">
              <span className="icon-tile icon-tile-blue h-10 w-10 rounded-[14px] text-lg">
                {action?.icon || "⚡"}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-extrabold text-white">
                  {action?.title}
                </h3>
                <p className="mt-1 font-body text-xs leading-relaxed text-slate-400">
                  {action?.description || meta.description}
                </p>
              </div>
            </div>

            <div className="hairline my-5" />

            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 18 }}
                  className="icon-tile icon-tile-green h-12 w-12 rounded-2xl"
                >
                  <CheckCircle2 className="h-6 w-6" />
                </motion.span>
                <span className="text-sm font-bold text-white">{meta.success}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="micro-label mb-1.5 block" htmlFor="quick-action-title">
                    Target / Title
                  </label>
                  <input
                    id="quick-action-title"
                    type="text"
                    required
                    autoFocus
                    value={formData.title}
                    onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                    placeholder={action?.placeholder || meta.placeholder}
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="micro-label mb-1.5 block" htmlFor="quick-action-content">
                    Description / Content
                  </label>
                  <textarea
                    id="quick-action-content"
                    rows={3}
                    value={formData.content}
                    onChange={(e) => setFormData((f) => ({ ...f, content: e.target.value }))}
                    placeholder="Provide details or parameters..."
                    className="glass-textarea min-h-[5.5rem] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-white/[0.07] pt-4">
                  <button type="button" onClick={() => onClose && onClose()} className="btn-glass">
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="btn-primary"
                  >
                    {meta.cta}
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
