import React from "react";
import { motion } from "framer-motion";

const AssistantIcon = ({ isActive, size = 24, strokeWidth = 2 }) => {
  // Animation duration
  const DURATION = 2;

  // Transition settings for synchronized animation
  const transition = {
    duration: DURATION,
    ease: "easeInOut",
    times: [0, 0.2, 0.8, 1], // Keyframes: Start -> Fade Out -> Rotate End -> Fade In
  };

  const activeStroke = "url(#gemini-gradient)";
  const inactiveStroke = "currentColor";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={isActive ? activeStroke : inactiveStroke}
      strokeWidth={isActive ? 2.5 : strokeWidth} // Slightly thicker when active
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-sparkles"
    >
      <defs>
        <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />   {/* Blue-500 */}
          <stop offset="40%" stopColor="#a855f7" />  {/* Purple-500 */}
          <stop offset="70%" stopColor="#ec4899" />  {/* Pink-500 */}
          <stop offset="100%" stopColor="#f97316" /> {/* Orange-500 */}
        </linearGradient>
      </defs>

      {/* Main Central Star */}
      {/* Path derived from Lucide Sparkles main star */}
      <motion.path
        d="M12 3L10.088 8.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
        animate={isActive ? { rotate: [0, 0, 180, 180] } : { rotate: 0 }}
        transition={isActive ? transition : { duration: 0 }}
        style={{ originX: "12px", originY: "12px" }}
      />

      {/* Top Right Dot (Cross) - Center approx (19, 5) */}
      <motion.path
        d="M19 3v4 M17 5h4"
        animate={isActive ? { opacity: [1, 0, 0, 1], scale: [1, 0, 0, 1] } : { opacity: 1, scale: 1 }}
        transition={isActive ? transition : { duration: 0 }}
        style={{ originX: "19px", originY: "5px" }}
      />

      {/* Bottom Left Dot (Cross) - Center approx (5, 19) */}
      <motion.path
        d="M5 17v4 M3 19h4"
        animate={isActive ? { opacity: [1, 0, 0, 1], scale: [1, 0, 0, 1] } : { opacity: 1, scale: 1 }}
        transition={isActive ? transition : { duration: 0 }}
        style={{ originX: "5px", originY: "19px" }}
      />
    </svg>
  );
};

export default AssistantIcon;
