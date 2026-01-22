import React, { useId } from "react";
import { motion } from "framer-motion";

const DeepIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  // Animation duration
  const DURATION = 2;

  // Transition settings for synchronized animation
  const transition = {
    duration: DURATION,
    ease: "linear",
    times: [0, 0.5, 1],
    repeat: isActive && loop ? Infinity : 0,
    repeatDelay: 0,
  };

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
      strokeWidth={isActive ? 2.2 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-scan-search overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" /> {/* Yellow-500 */}
          <stop offset="35%" stopColor="#ec4899" /> {/* Pink-500 */}
          <stop offset="65%" stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="100%" stopColor="#22c55e" /> {/* Green-500 */}
        </linearGradient>
      </defs>

      {/* Viewfinder Corners */}
      <path d="M16 21h2a2 2 0 0 0 2-2v-2" />
      <path d="M20 7V5a2 2 0 0 0-2-2h-2" />
      <path d="M4 7V5a2 2 0 0 1 2-2h2" />
      <path d="M8 21H6a2 2 0 0 1-2-2v-2" />

      {/* Magnifying Glass */}
      <circle cx="12" cy="12" r="3.5" />
      <path d="m14.5 14.5 2.5 2.5" />

      {/* Scan Line - Animated */}
      <motion.line
        x1="2"
        y1="4"
        x2="22"
        y2="4"
        strokeOpacity={0.8}
        strokeDasharray="2 2"
        animate={
          isActive
            ? {
                y: [0, 16, 0], // Scans down and up
                opacity: [0, 1, 0], // Fades in/out at edges
              }
            : { y: 8, opacity: 0 } // Hidden when inactive
        }
        transition={transition}
      />
    </svg>
  );
};

export default DeepIcon;
