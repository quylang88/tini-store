import React from 'react';

const SettingsSection = ({ title, icon: Icon, iconClassName = '', contentClassName = '', children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-4 border-b border-gray-50 font-bold text-amber-800 flex items-center gap-2">
      {Icon && <Icon size={18} className={iconClassName} />}
      {title}
    </div>
    <div className={`p-4 space-y-4 ${contentClassName}`.trim()}>
      {children}
    </div>
  </div>
);

export default SettingsSection;
