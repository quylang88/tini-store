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

  return (
    <div
      className={`text-white p-4 rounded-2xl shadow-lg relative overflow-hidden select-none ${
        isInteractive
          ? "cursor-pointer active:scale-95 transition-transform"
          : ""
      } ${className}`}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
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
