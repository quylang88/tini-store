import React, { useId } from "react";
import { motion } from "framer-motion";

const DashboardIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  const activeStroke = `url(#${gradientId})`;
  const inactiveStroke = "currentColor";

  // Bars animate height in a wave pattern
  const barVariants = {
    active: (i) => ({
      scaleY: [1, 1.5, 0.5, 1], // Pulse up and down
      transition: {
        duration: 2,
        repeat: loop ? Infinity : 0,
        ease: "easeInOut",
        delay: i * 0.2, // Stagger effect
      },
    }),
    inactive: {
      scaleY: 1,
      transition: {
        duration: 2.5, // Slow return to normal
        ease: "easeInOut",
      },
    },
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={isActive ? activeStroke : inactiveStroke}
      strokeWidth={isActive ? 2 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-bar-chart-3 overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="35%" stopColor="#ec4899" />
          <stop offset="65%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Bar 1 (Left) */}
      <motion.path
        d="M3 3v18h18" // Axis
        stroke={isActive ? activeStroke : inactiveStroke}
        strokeWidth={isActive ? 2 : strokeWidth}
      />

      {/* Bar 1 */}
      <motion.rect
        x="7" y="10" width="3" height="11" rx="1"
        style={{ transformOrigin: "bottom" }}
        variants={barVariants}
        custom={0}
        animate={isActive ? "active" : "inactive"}
        fill={isActive ? activeStroke : "none"}
        stroke={isActive ? "none" : inactiveStroke}
      />

      {/* Bar 2 */}
      <motion.rect
        x="12" y="5" width="3" height="16" rx="1"
        style={{ transformOrigin: "bottom" }}
        variants={barVariants}
        custom={1}
        animate={isActive ? "active" : "inactive"}
        fill={isActive ? activeStroke : "none"}
        stroke={isActive ? "none" : inactiveStroke}
      />

      {/* Bar 3 */}
      <motion.rect
        x="17" y="14" width="3" height="7" rx="1"
        style={{ transformOrigin: "bottom" }}
        variants={barVariants}
        custom={2}
        animate={isActive ? "active" : "inactive"}
        fill={isActive ? activeStroke : "none"}
        stroke={isActive ? "none" : inactiveStroke}
      />
    </svg>
  );
};

export default DashboardIcon;
