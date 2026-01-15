import React from "react";
import { Award, Crown, Medal } from "lucide-react";

const rankStyles = {
  1: {
    bg: "bg-amber-100",
    text: "text-amber-600",
    ring: "ring-amber-300",
    icon: Crown,
    iconColor: "text-amber-500",
  },
  2: {
    bg: "bg-slate-100",
    text: "text-slate-500",
    ring: "ring-slate-300",
    icon: Medal,
    iconColor: "text-slate-400",
  },
  3: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    ring: "ring-orange-300",
    icon: Award,
    iconColor: "text-orange-500",
  },
};

// Huy hiệu top 1-3 để tạo điểm nhấn vàng/bạc/đồng.
const RankBadge = ({ rank }) => {
  const config = rankStyles[rank];

  if (!config) {
    return (
      <span className="w-7 text-center text-xs font-semibold text-amber-500">
        #{rank}
      </span>
    );
  }

  const Icon = config.icon;

  return (
    <div
      className={`relative flex h-7 w-7 items-center justify-center rounded-full ${config.bg} ${config.text} ring-1 ${config.ring}`}
    >
      <Icon
        className={`absolute -top-1 -right-1 h-3 w-3 ${config.iconColor}`}
      />
      <span className="text-[11px] font-bold">{rank}</span>
    </div>
  );
};

export default RankBadge;
