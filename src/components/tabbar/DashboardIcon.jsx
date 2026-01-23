import React, { useId } from "react";
import { motion } from "framer-motion";

const DashboardIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  const activeStroke = `url(#${gradientId})`;
  const inactiveStroke = "currentColor";

  const rectVariants = {
    active: (custom) => ({
      scale: [1, 1.15, 1],
      transition: {
        delay: custom * 0.1,
        duration: 2,
        repeat: loop ? Infinity : 0,
        ease: "easeInOut"
      }
    }),
    inactive: { scale: 1 }
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

      <motion.rect
        x="3"
        y="3"
        width="7"
        height="9"
        rx="1"
        variants={rectVariants}
        custom={0}
        animate={isActive ? "active" : "inactive"}
        style={{ transformOrigin: "6.5px 7.5px" }}
      />
      <motion.rect
        x="14"
        y="3"
        width="7"
        height="5"
        rx="1"
        variants={rectVariants}
        custom={1}
        animate={isActive ? "active" : "inactive"}
        style={{ transformOrigin: "17.5px 5.5px" }}
      />
      <motion.rect
        x="14"
        y="12"
        width="7"
        height="9"
        rx="1"
        variants={rectVariants}
        custom={2}
        animate={isActive ? "active" : "inactive"}
        style={{ transformOrigin: "17.5px 16.5px" }}
      />
      <motion.rect
        x="3"
        y="16"
        width="7"
        height="5"
        rx="1"
        variants={rectVariants}
        custom={3}
        animate={isActive ? "active" : "inactive"}
        style={{ transformOrigin: "6.5px 18.5px" }}
      />
    </svg>
  );
};

export default DashboardIcon;
