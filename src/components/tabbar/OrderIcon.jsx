import React, { useId } from "react";
import { motion } from "framer-motion";

const OrderIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  const activeStroke = `url(#${gradientId})`;
  const inactiveStroke = "currentColor";

  // Cart Jump Animation
  const cartVariants = {
    active: {
      y: [0, 4, -8, 0], // Anticipation (down), Jump (up), Land
      rotate: [0, -5, 5, 0], // Tilt mid-air
      scale: [1, 1.1, 0.9, 1], // Stretch/Squash
      transition: {
        duration: 0.8,
        repeat: loop ? Infinity : 0,
        repeatDelay: 1,
        ease: "easeInOut"
      }
    },
    inactive: {
      y: 0,
      rotate: 0,
      scale: 1,
      transition: {
        duration: 2, // Slow settle
        ease: "spring", // Gentle wobble
        stiffness: 50,
        damping: 10
      }
    }
  };

  // Wheels Spin
  const wheelVariants = {
    active: {
      rotate: 360,
      transition: {
        duration: 0.8,
        repeat: loop ? Infinity : 0,
        repeatDelay: 1,
        ease: "linear"
      }
    },
    inactive: {
      rotate: 0,
      transition: { duration: 2.5, ease: "easeOut" } // Spin down slowly
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
      className="lucide lucide-shopping-cart overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="35%" stopColor="#ec4899" />
          <stop offset="65%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Cart Body Group */}
      <motion.g
        variants={cartVariants}
        animate={isActive ? "active" : "inactive"}
        style={{ transformOrigin: "12px 21px" }}
      >
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />

        {/* Wheel 1 */}
        <motion.g
            style={{ originX: "8px", originY: "21px" }}
            variants={wheelVariants}
            animate={isActive ? "active" : "inactive"}
        >
            <circle cx="8" cy="21" r="1" />
            <path d="M8 20v2 M7 21h2" strokeWidth="0.5" opacity="0.5" /> {/* Spokes */}
        </motion.g>

        {/* Wheel 2 */}
        <motion.g
            style={{ originX: "19px", originY: "21px" }}
            variants={wheelVariants}
            animate={isActive ? "active" : "inactive"}
        >
            <circle cx="19" cy="21" r="1" />
            <path d="M19 20v2 M18 21h2" strokeWidth="0.5" opacity="0.5" /> {/* Spokes */}
        </motion.g>
      </motion.g>
    </svg>
  );
};

export default OrderIcon;
