import React, { useId } from "react";
import { motion } from "framer-motion";

const DashboardIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  const activeStroke = `url(#${gradientId})`;
  const inactiveStroke = "currentColor";

  // Needle Rotation
  const needleVariants = {
    active: {
      rotate: [0, 180], // Sweep from left to right
      transition: {
        duration: 1, // Fast sweep
        type: "spring",
        stiffness: 120,
        damping: 10,
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        repeatDelay: 0.5
      }
    },
    inactive: {
      rotate: 0, // Return to start
      transition: {
        duration: 2.5, // Slow return
        ease: "easeInOut"
      }
    }
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
      className="lucide lucide-gauge overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="35%" stopColor="#ec4899" />
          <stop offset="65%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Gauge Arc */}
      <path d="m12 15 2 2" opacity="0" /> {/* Spacer */}
      <path d="M12 22 c5.52 0 10-4.48 10-10 S17.52 2 12 2 2 6.48 2 12c0 1.6.4 3.1 1.1 4.4" opacity="0.1" /> {/* Background Arc Reference */}

      {/* Main Gauge Arc (Semi-circle approx) */}
      <path d="M3 13 a9 9 0 0 1 18 0" stroke={isActive ? activeStroke : inactiveStroke} strokeWidth="2.5" />
      <path d="M12 13 v1" stroke="none" /> {/* Center pivot */}

      {/* Needle */}
      <motion.g
        variants={needleVariants}
        animate={isActive ? "active" : "inactive"}
        style={{ transformOrigin: "12px 13px" }} // Pivot at center bottom of arc
      >
        <path d="M12 13 L5 13" stroke={isActive ? activeStroke : inactiveStroke} strokeWidth="2.5" />
        <circle cx="12" cy="13" r="2" fill={isActive ? activeStroke : inactiveStroke} stroke="none" />
      </motion.g>
    </svg>
  );
};

export default DashboardIcon;
