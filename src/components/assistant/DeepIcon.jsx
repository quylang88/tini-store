import React, { useId } from "react";
import { motion } from "framer-motion";

const DeepIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");

  const activeStroke = `url(#${gradientId})`;
  const inactiveStroke = "currentColor";

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
      className="lucide overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" /> {/* Yellow-500 */}
          <stop offset="35%" stopColor="#ec4899" /> {/* Pink-500 */}
          <stop offset="65%" stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="100%" stopColor="#22c55e" /> {/* Green-500 */}
        </linearGradient>
      </defs>

      {/* Central Core - Brain/Node */}
      <motion.g
        animate={
          isActive
            ? {
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8],
              }
            : { scale: 1, opacity: 1 }
        }
        transition={{
          duration: 2,
          repeat: isActive && loop ? Infinity : 0,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "12px 12px" }}
      >
        <circle cx="12" cy="12" r="3" fill={isActive ? activeStroke : "none"} fillOpacity={0.2} />
        <circle cx="12" cy="12" r="1.5" fill={isActive ? activeStroke : "currentColor"} />
      </motion.g>

      {/* Inner Ring - Rotating Clockwise */}
      <motion.g
        animate={isActive ? { rotate: 360 } : { rotate: 0 }}
        transition={{
          duration: 4,
          repeat: isActive && loop ? Infinity : 0,
          ease: "linear",
        }}
        style={{ transformOrigin: "12px 12px" }}
      >
        <path d="M12 7v2" />
        <path d="M12 15v2" />
        <path d="M7 12h2" />
        <path d="M15 12h2" />
        <path d="M17.6 8.4l-1.4 1.4" />
        <path d="M7.8 14.2l-1.4 1.4" />
      </motion.g>

      {/* Outer Ring Segments - Rotating Counter-Clockwise */}
      <motion.g
        animate={isActive ? { rotate: -360 } : { rotate: 0 }}
        transition={{
          duration: 6,
          repeat: isActive && loop ? Infinity : 0,
          ease: "linear",
        }}
        style={{ transformOrigin: "12px 12px" }}
      >
        <path d="M12 2a10 10 0 0 1 10 10" strokeDasharray="6 4" />
        <path d="M12 22a10 10 0 0 1-10-10" strokeDasharray="6 4" />
      </motion.g>
    </svg>
  );
};

export default DeepIcon;
