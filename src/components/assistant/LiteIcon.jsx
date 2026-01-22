import React, { useId } from "react";
import { motion } from "framer-motion";

const LiteIcon = ({ isActive, size = 24, strokeWidth = 2 }) => {
  const gradientId = useId().replace(/:/g, "");
  // Animation duration
  const DURATION = 2;

  // Transition settings for synchronized animation
  const transition = {
    duration: DURATION,
    ease: "easeInOut",
    repeat: isActive ? Infinity : 0,
    repeatType: "reverse",
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
      className="lucide lucide-feather"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" /> {/* Blue-400 */}
          <stop offset="50%" stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="100%" stopColor="#22d3ee" /> {/* Cyan-400 */}
        </linearGradient>
      </defs>

      {/* Feather Path */}
      <motion.path
        d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z M16 8 2 22 M17.5 15H9"
        animate={
            isActive
              ? {
                  rotate: [0, -10, 0],
                  y: [0, -2, 0],
                }
              : { rotate: 0, y: 0 }
          }
        transition={transition}
        style={{ transformOrigin: "12px 12px" }}
      />
    </svg>
  );
};

export default LiteIcon;
