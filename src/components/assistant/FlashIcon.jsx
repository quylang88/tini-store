import React, { useId } from "react";
import { motion } from "framer-motion";

const FlashIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  // Animation duration
  const DURATION = 2;

  // Transition settings for synchronized animation
  const transition = {
    duration: DURATION,
    ease: "easeInOut",
    times: [0, 0.2, 0.8, 1],
    repeat: isActive && loop ? Infinity : 0,
    repeatDelay: 1,
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
      strokeWidth={isActive ? 2.5 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-zap"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" /> {/* Yellow-500 */}
          <stop offset="35%" stopColor="#ec4899" /> {/* Pink-500 */}
          <stop offset="65%" stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="100%" stopColor="#22c55e" /> {/* Green-500 */}
        </linearGradient>
      </defs>

      {/* Lightning Bolt Path */}
      <motion.path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        animate={
          isActive
            ? {
                scale: [1, 1, 1.2, 1], // Pulse effect
                fillOpacity: [0, 0, 0.1, 0], // Slight flash
              }
            : { scale: 1, fillOpacity: 0 }
        }
        transition={isActive ? transition : { duration: 0 }}
        style={{ transformOrigin: "12px 12px" }}
      />
    </svg>
  );
};

export default FlashIcon;
