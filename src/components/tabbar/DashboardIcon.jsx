import React, { useId } from "react";
import { motion } from "framer-motion";

const DashboardIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  const activeStroke = `url(#${gradientId})`;
  const inactiveStroke = "currentColor";

  // Grid items: Active = Explode out; Inactive = Slow gather back
  const itemVariants = {
    active: (i) => ({
      x: [0, i % 2 === 0 ? -8 : 8],
      y: [0, i < 2 ? -8 : 8],
      rotate: [0, 90],
      scale: [1, 0.8],
      opacity: 1,
      transition: {
        duration: 2, // Slower active phase
        repeat: loop ? Infinity : 0,
        repeatType: "reverse", // Yo-yo effect if looping
        ease: "easeInOut",
        delay: 0.5, // Wait for initial rotation
      },
    }),
    inactive: {
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      opacity: 1,
      transition: {
        duration: 2.5, // Slow reverse!
        ease: "easeInOut", // Smooth slow landing
      },
    },
  };

  // Whole Group Rotation
  const groupVariants = {
    active: {
      rotate: 360,
      transition: { duration: 1, ease: "circOut" }
    },
    inactive: {
      rotate: 0,
      transition: { duration: 2.5, ease: "easeInOut" } // Unwind slowly or just settle
    }
  };

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
      className="lucide lucide-layout-dashboard overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="35%" stopColor="#ec4899" />
          <stop offset="65%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      <motion.g
        variants={groupVariants}
        animate={isActive ? "active" : "inactive"}
        style={{ transformOrigin: "12px 12px" }}
      >
        {/* Item 1 (Top Left) */}
        <motion.rect
          x="3"
          y="3"
          width="7"
          height="9"
          rx="1"
          variants={itemVariants}
          custom={0}
          style={{ transformOrigin: "6.5px 7.5px" }}
        />

        {/* Item 2 (Top Right) */}
        <motion.rect
          x="14"
          y="3"
          width="7"
          height="5"
          rx="1"
          variants={itemVariants}
          custom={1}
          style={{ transformOrigin: "17.5px 5.5px" }}
        />

        {/* Item 3 (Bottom Right) */}
        <motion.rect
          x="14"
          y="12"
          width="7"
          height="9"
          rx="1"
          variants={itemVariants}
          custom={2}
          style={{ transformOrigin: "17.5px 16.5px" }}
        />

        {/* Item 4 (Bottom Left) */}
        <motion.rect
          x="3"
          y="16"
          width="7"
          height="5"
          rx="1"
          variants={itemVariants}
          custom={3}
          style={{ transformOrigin: "6.5px 18.5px" }}
        />
      </motion.g>
    </svg>
  );
};

export default DashboardIcon;
