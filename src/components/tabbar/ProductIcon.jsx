import React, { useId } from "react";
import { motion } from "framer-motion";

const ProductIcon = ({
  isActive,
  size = 24,
  strokeWidth = 2,
  loop = false,
}) => {
  const gradientId = useId().replace(/:/g, "");
  const activeStroke = `url(#${gradientId})`;
  const inactiveStroke = "currentColor";

  // 3D Cube Faces Variants
  // Top Face
  const topFaceVariants = {
    active: {
      y: -4,
      rotate: -10,
      opacity: 0.8,
      transition: {
        duration: 2,
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        ease: "easeInOut",
      },
    },
    inactive: {
      y: 0,
      rotate: 0,
      opacity: 1,
      transition: { duration: 2.5, ease: "easeInOut" },
    },
  };

  // Left Face
  const leftFaceVariants = {
    active: {
      x: -3,
      y: 2,
      rotate: -5,
      opacity: 0.8,
      transition: {
        duration: 2,
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: 0.1,
      },
    },
    inactive: {
      x: 0,
      y: 0,
      rotate: 0,
      opacity: 1,
      transition: { duration: 2.5, ease: "easeInOut" },
    },
  };

  // Right Face
  const rightFaceVariants = {
    active: {
      x: 3,
      y: 2,
      rotate: 5,
      opacity: 0.8,
      transition: {
        duration: 2,
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: 0.2,
      },
    },
    inactive: {
      x: 0,
      y: 0,
      rotate: 0,
      opacity: 1,
      transition: { duration: 2.5, ease: "easeInOut" },
    },
  };

  // Inner Glow Core (Only visible when active)
  const coreVariants = {
    active: {
      scale: [0, 1, 0.8],
      opacity: [0, 1, 0.5],
      rotate: 180,
      transition: {
        duration: 2,
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        ease: "easeInOut",
      },
    },
    inactive: {
      scale: 0,
      opacity: 0,
      transition: { duration: 1.5, ease: "fadeOut" },
    },
  };

  return (
    <motion.svg
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
      initial="inactive"
      animate={isActive ? "active" : "inactive"}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="35%" stopColor="#ec4899" />
          <stop offset="65%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Inner Core (Glow) */}
      <motion.circle
        cx="12"
        cy="12"
        r="3"
        fill={isActive ? activeStroke : "none"}
        stroke="none"
        variants={coreVariants}
      />

      {/* Top Face (Diamond) */}
      <motion.path
        d="M12 3l7 4-7 4-7-4 7-4z"
        variants={topFaceVariants}
        style={{ transformOrigin: "12px 12px" }}
      />

      {/* Left Face */}
      <motion.path
        d="M5 7v10l7 4v-10l-7-4z"
        variants={leftFaceVariants}
        style={{ transformOrigin: "12px 12px" }}
      />

      {/* Right Face */}
      <motion.path
        d="M19 7v10l-7 4v-10l7-4z"
        variants={rightFaceVariants}
        style={{ transformOrigin: "12px 12px" }}
      />
    </motion.svg>
  );
};

export default ProductIcon;
