import React, { useId } from "react";
import { motion } from "framer-motion";

const ProductIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
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
      className="lucide lucide-box overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="35%" stopColor="#ec4899" />
          <stop offset="65%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Box Group - Morphs out */}
      <motion.g
        animate={
          isActive
            ? { scale: [1, 0, 0, 1], opacity: [1, 0, 0, 1], rotate: [0, 180, 0, 0] }
            : { scale: 1, opacity: 1, rotate: 0 }
        }
        transition={{
          duration: 4,
          repeat: loop ? Infinity : 0,
          times: [0, 0.3, 0.7, 1],
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "12px 12px" }}
      >
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22v-9" />
      </motion.g>

      {/* Magic Star/Sparkle - Morphs in */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={
          isActive
            ? { scale: [0, 1.2, 1.2, 0], opacity: [0, 1, 1, 0], rotate: [0, 90, 180, 360] }
            : { scale: 0, opacity: 0 }
        }
        transition={{
          duration: 4,
          repeat: loop ? Infinity : 0,
          times: [0, 0.3, 0.7, 1],
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "12px 12px" }}
      >
        <path
          d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
          fill={isActive ? activeStroke : "none"}
          stroke={isActive ? activeStroke : "none"}
        />
        {/* Orbiting particles around the star */}
        <circle cx="12" cy="12" r="8" stroke={isActive ? activeStroke : "none"} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
      </motion.g>
    </svg>
  );
};

export default ProductIcon;
