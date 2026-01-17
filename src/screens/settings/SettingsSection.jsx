import React from "react";

const SettingsSection = ({
  title,
  icon: Icon,
  iconClassName = "",
  contentClassName = "",
  children,
}) => (
  <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
    <div className="p-4 border-b border-amber-100 font-bold text-rose-800 flex items-center gap-2">
      {Icon && <Icon size={18} className={iconClassName} />}
      {title}
    </div>
    <div className={`p-4 space-y-4 ${contentClassName}`.trim()}>{children}</div>
  </div>
);

export default SettingsSection;
