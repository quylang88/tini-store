import React, { useId } from "react";
import { motion } from "framer-motion";

const FlashIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
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
      strokeWidth={isActive ? 2.5 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-zap overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" /> {/* Yellow-500 */}
          <stop offset="35%" stopColor="#ec4899" /> {/* Pink-500 */}
          <stop offset="65%" stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="100%" stopColor="#22c55e" /> {/* Green-500 */}
        </linearGradient>
      </defs>

      {/* Main Bolt - Zaps and Shakes */}
      <motion.path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        animate={
          isActive
            ? {
                pathLength: [0, 1, 1], // Draws quickly
                fillOpacity: [0, 0, 0.3, 0], // Flashes
                x: [0, -1, 1, -1, 0], // Shakes/Vibrates
              }
            : { pathLength: 1, fillOpacity: 0, x: 0 }
        }
        transition={{
          duration: 1.5,
          times: [0, 0.3, 1],
          repeat: isActive && loop ? Infinity : 0,
          repeatDelay: 0.5,
          ease: "circOut",
        }}
      />

      {/* Radiating Sparks/Speed Lines */}
      {isActive && loop && (
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 0.5,
            times: [0.3, 0.5, 0.8], // Syncs with bolt strike
          }}
          style={{ transformOrigin: "12px 12px" }}
        >
           <line x1="12" y1="0" x2="12" y2="-3" strokeWidth="2" />
           <line x1="24" y1="12" x2="27" y2="12" strokeWidth="2" />
           <line x1="0" y1="12" x2="-3" y2="12" strokeWidth="2" />
           <line x1="12" y1="24" x2="12" y2="27" strokeWidth="2" />
        </motion.g>
      )}
    </svg>
  );
};

export default FlashIcon;
