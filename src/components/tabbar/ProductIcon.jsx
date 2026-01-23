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
      className="lucide lucide-package overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="35%" stopColor="#ec4899" />
          <stop offset="65%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Floating Item (Star/Sparkle) */}
      <motion.path
        d="M12 8m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"
        stroke={isActive ? activeStroke : "none"}
        fill={isActive ? activeStroke : "none"}
        opacity={0}
        animate={
          isActive
            ? { opacity: [0, 1, 0], y: [0, -6, 0], scale: [0, 1, 0] }
            : { opacity: 0, y: 0, scale: 0 }
        }
        transition={{
          duration: 2.5,
          repeat: loop ? Infinity : 0,
          times: [0, 0.5, 1],
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "12px 8px" }}
      />

      {/* Box Body */}
      {/* Left Wall */}
      <path d="M3 8v8.7a2 2 0 0 0 1 1.73l7 4" />
      {/* Right Wall */}
      <path d="M12 22.43l7-4a2 2 0 0 0 1-1.73V8" />
      {/* Center Vertical Line */}
      <path d="M12 22.43V13" />

      {/* Lid - Floating */}
      <motion.path
        d="M3 8l9-4.5 9 4.5-9 4.5z"
        animate={
          isActive
            ? { y: [0, -5, 0], rotate: [0, -5, 0] }
            : { y: 0, rotate: 0 }
        }
        transition={{
          duration: 2.5,
          repeat: loop ? Infinity : 0,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "12px 8px" }}
      />
    </svg>
  );
};

export default ProductIcon;
