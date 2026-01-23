import React, { useId } from "react";
import { motion } from "framer-motion";

const DashboardIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  const activeStroke = `url(#${gradientId})`;
  const inactiveStroke = "currentColor";

  // Pie Chart Slices

  // Minor Slice (Top-Right Quarter: 12 o'clock to 3 o'clock)
  // Path: Center(12,12) -> Top(12,2) -> Arc to Right(22,12) -> Close
  const minorSlicePath = "M 12 12 L 12 2 A 10 10 0 0 1 22 12 Z";

  // Major Slice (The rest: 3 o'clock to 12 o'clock)
  // Path: Center(12,12) -> Right(22,12) -> Large Arc to Top(12,2) -> Close
  const majorSlicePath = "M 12 12 L 22 12 A 10 10 0 1 1 12 2 Z";

  const minorSliceVariants = {
    active: {
      x: 3, // Move Right
      y: -3, // Move Up
      transition: {
        duration: 1.5,
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    },
    inactive: {
      x: 0,
      y: 0,
      transition: { duration: 2.5, ease: "easeInOut" }
    }
  };

  const majorSliceVariants = {
    active: {
      x: -1,
      y: 1,
      scale: 0.98, // Slight shrink to emphasize separation
      transition: {
        duration: 1.5,
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    },
    inactive: {
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: 2.5, ease: "easeInOut" }
    }
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
      className="lucide lucide-pie-chart overflow-visible"
      initial="inactive"
      animate={isActive ? "active" : "inactive"}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="35%" stopColor="#ec4899" />
          <stop offset="65%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Major Slice (Pacman) */}
      <motion.path
        d={majorSlicePath}
        variants={majorSliceVariants}
      />

      {/* Minor Slice (Quarter) */}
      <motion.path
        d={minorSlicePath}
        variants={minorSliceVariants}
      />
    </motion.svg>
  );
};

export default DashboardIcon;
