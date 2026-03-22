import React from "react";
import { AnimatePresence, motion } from "framer-motion";

const SelectionActionButton = ({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  tone = "secondary",
}) => {
  const toneClass =
    tone === "primary"
      ? disabled
        ? "bg-rose-200 text-rose-400 border-transparent"
        : "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-200"
      : "bg-white/85 text-slate-700 border-white/80";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
        disabled ? "cursor-not-allowed" : "active:scale-[0.98]"
      } ${toneClass}`}
    >
      {Icon && <Icon size={18} />}
      <span>{label}</span>
    </button>
  );
};

const SelectionActionBar = ({
  visible,
  count,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
}) => {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50"
        >
          <div className="overflow-hidden rounded-[28px] border border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,241,242,0.94)_48%,rgba(255,247,237,0.96))] p-3 shadow-[0_20px_48px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-end gap-3">
                  <div className="flex h-14 min-w-[3.5rem] items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-200">
                    <span className="text-2xl font-black">{count}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800">
                      {title}
                    </div>
                    {subtitle && (
                      <div className="mt-1 text-xs leading-5 text-slate-500">
                        {subtitle}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <SelectionActionButton
                {...secondaryAction}
                tone="secondary"
              />
              <SelectionActionButton {...primaryAction} tone="primary" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SelectionActionBar;
