import React from "react";

const MetricCard = ({
  icon: Icon,
  label,
  value,
  className = "",
  onClick,
  ...props
}) => {
  const isInteractive = !!onClick;

  const handleKeyDown = (e) => {
    if (isInteractive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      className={`text-white p-4 rounded-2xl shadow-lg relative overflow-hidden select-none ${
        isInteractive
          ? "cursor-pointer active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          : ""
      } ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
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
