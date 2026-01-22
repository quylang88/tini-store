import React, { useId } from "react";
import { motion } from "framer-motion";

const LiteIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  // Animation duration
  const DURATION = 2;

  // Transition settings for synchronized animation
  const transition = {
    duration: DURATION,
    ease: "easeInOut",
    times: [0, 0.2, 0.8, 1], // Consistent with other icons
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
      className="lucide lucide-feather"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" /> {/* Yellow-500 */}
          <stop offset="35%" stopColor="#ec4899" /> {/* Pink-500 */}
          <stop offset="65%" stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="100%" stopColor="#22c55e" /> {/* Green-500 */}
        </linearGradient>
      </defs>

      {/* Feather Path */}
      <motion.path
        d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z M16 8 2 22 M17.5 15H9"
        animate={
          isActive
            ? {
                rotate: [0, -10, 10, 0], // Sways back and forth
                scale: [1, 1.1, 1.1, 1], // Slight scale
              }
            : { rotate: 0, scale: 1 }
        }
        transition={transition}
        style={{ transformOrigin: "12px 12px" }}
      />
    </svg>
  );
};

export default LiteIcon;
