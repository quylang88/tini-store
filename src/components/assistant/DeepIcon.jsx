import React, { useId } from "react";
import { motion } from "framer-motion";

const DeepIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  // Animation duration
  const DURATION = 2;

  // Transition settings for synchronized animation
  const transition = {
    duration: DURATION,
    ease: "easeInOut",
    times: [0, 0.5, 1],
    repeat: isActive && loop ? Infinity : 0,
    repeatDelay: 0.5,
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
      className="lucide lucide-microscope overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" /> {/* Yellow-500 */}
          <stop offset="35%" stopColor="#ec4899" /> {/* Pink-500 */}
          <stop offset="65%" stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="100%" stopColor="#22c55e" /> {/* Green-500 */}
        </linearGradient>
      </defs>

      {/* Base */}
      <path d="M6 18h12" />
      <path d="M3 22h18" />

      {/* Arm - Static */}
      <path d="M14 22a7 7 0 1 0 0-14h-1" />

      {/* Tube / Lens - Animating (Focusing up and down) */}
      <motion.g
        animate={
          isActive
            ? {
                y: [0, -1.5, 0], // Moving up and down like focusing
              }
            : { y: 0 }
        }
        transition={transition}
      >
        <path d="M9 14h2" /> {/* Stage/Slide holder */}
        <path d="M9 12a2 2 0 0 1 2-2v6h-2z" /> {/* Objective Lens */}
        <path d="M12 6a2 2 0 0 1 2 2v6h-2V8a2 2 0 0 1 2-2z" /> {/* Main Tube */}
      </motion.g>
    </svg>
  );
};

export default DeepIcon;
