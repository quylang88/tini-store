import React, { useId } from "react";
import { motion } from "framer-motion";

const AssistantIcon = ({
  isActive,
  size = 24,
  strokeWidth = 2,
  loop = false,
}) => {
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
      className="lucide lucide-sparkles overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" /> {/* Orange-500 */}
          <stop offset="35%" stopColor="#ec4899" /> {/* Pink-500 */}
          <stop offset="65%" stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="100%" stopColor="#22c55e" /> {/* Green-500 */}
        </linearGradient>
      </defs>

      {/* Main Star - Floating and Pulsing */}
      <motion.g
        animate={
          isActive
            ? {
                y: [0, -2, 0], // Gentle float
                scale: [1, 1.1, 1], // Gentle pulse
                rotate: [0, 5, -5, 0], // Subtle tilt
              }
            : { y: 0, scale: 1, rotate: 0 }
        }
        transition={{
          duration: 3,
          repeat: isActive && loop ? Infinity : 0,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "12px 12px" }}
      >
        <path d="M12 3L10.088 8.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </motion.g>

      {/* Orbiting Particles - Simpler Group Rotation Strategy */}
      {isActive && loop && (
        <>
          {/* Particle 1 - Fast inner orbit */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "12px 12px" }}
          >
            <circle
              cx="12"
              cy="5"
              r="1.5"
              fill={isActive ? activeStroke : "currentColor"}
              stroke="none"
              opacity={0.6}
            />
          </motion.g>

          {/* Particle 2 - Slower outer orbit reverse */}
          <motion.g
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "12px 12px" }}
          >
            <circle
              cx="12"
              cy="20"
              r="1"
              fill={isActive ? activeStroke : "currentColor"}
              stroke="none"
              opacity={0.4}
            />
          </motion.g>
        </>
      )}

      {/* Twinkling Stars (Corner elements) */}
      <motion.path
        d="M19 3v4 M17 5h4"
        animate={
          isActive
            ? { scale: [0, 1, 0], opacity: [0, 1, 0] }
            : { scale: 1, opacity: 1 }
        }
        transition={{
          duration: 2,
          repeat: isActive && loop ? Infinity : 0,
          times: [0, 0.5, 1],
          delay: 0.5,
        }}
        style={{ transformOrigin: "19px 5px" }}
      />

      <motion.path
        d="M5 17v4 M3 19h4"
        animate={
          isActive
            ? { scale: [0, 1, 0], opacity: [0, 1, 0] }
            : { scale: 1, opacity: 1 }
        }
        transition={{
          duration: 2.5,
          repeat: isActive && loop ? Infinity : 0,
          times: [0, 0.5, 1],
        }}
        style={{ transformOrigin: "5px 19px" }}
      />
    </svg>
  );
};

export default AssistantIcon;
