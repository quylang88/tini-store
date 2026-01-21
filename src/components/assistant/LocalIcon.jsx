import React, { useId } from "react";
import { motion } from "framer-motion";

const LocalIcon = ({ isActive, size = 24, strokeWidth = 2 }) => {
  const gradientId = useId().replace(/:/g, "");
  // Animation duration
  const DURATION = 2;

  // Transition settings for synchronized animation
  const transition = {
    duration: DURATION,
    ease: "easeInOut",
    times: [0, 0.2, 0.8, 1],
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
      className="lucide lucide-cpu"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" /> {/* Yellow-500 */}
          <stop offset="35%" stopColor="#ec4899" /> {/* Pink-500 */}
          <stop offset="65%" stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="100%" stopColor="#22c55e" /> {/* Green-500 */}
        </linearGradient>
      </defs>

      {/* CPU Body */}
      <motion.rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        animate={
          isActive
            ? {
                scale: [1, 1, 1.1, 1],
              }
            : { scale: 1 }
        }
        transition={isActive ? transition : { duration: 0 }}
        style={{ transformOrigin: "12px 12px" }}
      />

      {/* Internal Core */}
      <motion.path
        d="M9 9h6v6H9z"
        animate={
          isActive
            ? {
                opacity: [1, 0.5, 1, 1],
              }
            : { opacity: 1 }
        }
        transition={isActive ? transition : { duration: 0 }}
      />

      {/* Pins - Top/Bottom/Left/Right */}
      <path d="M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 15h3 M1 9h3 M1 15h3" />
    </svg>
  );
};

export default LocalIcon;
