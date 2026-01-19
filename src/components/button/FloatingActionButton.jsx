import React from "react";
import { Plus } from "lucide-react";

const FloatingActionButton = ({
  onClick,
  icon: Icon = Plus,
  ariaLabel = "Action",
  className = "",
  color = "rose", // 'rose' | 'amber' | 'emerald' etc.
}) => {
  const colorClasses = {
    rose: "bg-rose-500 text-white shadow-rose-200",
    amber: "bg-amber-500 text-white shadow-amber-200",
    emerald: "bg-emerald-500 text-white shadow-emerald-200",
    blue: "bg-blue-500 text-white shadow-blue-200",
  };

  const selectedColorClass = colorClasses[color] || colorClasses.rose;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-[70] flex h-12 w-12 items-center justify-center rounded-full shadow-lg active:scale-95 transition ${selectedColorClass} ${className}`}
    >
      <Icon size={20} />
    </button>
  );
};

export default FloatingActionButton;
