import React from 'react';
import { Award, Crown, Medal } from 'lucide-react';

// Badge trang trí cho top 1-2-3 để tạo cảm giác nổi bật.
const RankBadge = ({ rank }) => {
  const rankMap = {
    1: { label: '1', icon: Crown, bg: 'bg-amber-400', text: 'text-white', ring: 'ring-amber-200' },
    2: { label: '2', icon: Medal, bg: 'bg-slate-300', text: 'text-slate-700', ring: 'ring-slate-200' },
    3: { label: '3', icon: Award, bg: 'bg-orange-300', text: 'text-orange-900', ring: 'ring-orange-200' },
  };

  const config = rankMap[rank];

  if (!config) {
    return (
      <div className="w-8 text-xs font-semibold text-gray-400">#{rank}</div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1 w-14">
      <div className={`h-8 w-8 rounded-full ${config.bg} ${config.text} flex items-center justify-center text-sm font-bold shadow-sm ring-2 ${config.ring}`}>
        {config.label}
      </div>
      <Icon size={14} className={config.text} />
    </div>
  );
};

export default RankBadge;
