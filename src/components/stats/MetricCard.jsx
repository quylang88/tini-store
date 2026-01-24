import React from "react";

const MetricCard = ({ icon: Icon, label, value, className = "", onClick, ...props }) => {
  const isInteractive = !!onClick;

  const handleKeyDown = (e) => {
    if (isInteractive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      className={`text-white p-4 rounded-2xl shadow-lg relative overflow-hidden transition-transform ${
        isInteractive
          ? "cursor-pointer focus-visible:ring-4 focus-visible:ring-white/50 outline-none"
          : ""
      } ${className}`}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div className="flex items-center gap-2 opacity-90 mb-2">
        {Icon && <Icon size={18} />}
        <span className="text-xs font-bold uppercase">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
};

export default MetricCard;
