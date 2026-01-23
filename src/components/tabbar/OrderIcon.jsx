import React, { useId } from "react";
import { motion } from "framer-motion";

const OrderIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
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

      {/* Falling Item 1 */}
      <motion.circle
        cx="14"
        cy="6"
        r="2"
        fill={isActive ? activeStroke : "none"}
        stroke="none"
        opacity={0}
        animate={
          isActive
            ? { y: [0, 10], opacity: [0, 1, 0], scale: [0.5, 1, 0] }
            : { opacity: 0 }
        }
        transition={{
          duration: 1.5,
          repeat: loop ? Infinity : 0,
          ease: "easeIn",
        }}
      />

      {/* Falling Item 2 */}
      <motion.circle
        cx="10"
        cy="4"
        r="1.5"
        fill={isActive ? activeStroke : "none"}
        stroke="none"
        opacity={0}
        animate={
          isActive
            ? { y: [0, 12], opacity: [0, 1, 0], scale: [0.5, 1, 0] }
            : { opacity: 0 }
        }
        transition={{
          duration: 1.8,
          delay: 0.3,
          repeat: loop ? Infinity : 0,
          ease: "easeIn",
        }}
      />

      {/* Cart Body */}
      <motion.g
        animate={
          isActive
            ? { rotate: [0, -3, 3, 0], y: [0, 1, 0] }
            : { rotate: 0, y: 0 }
        }
        transition={{
          duration: 0.6,
          delay: 0.6, // Wait for items to land
          repeat: loop ? Infinity : 0,
        }}
        style={{ transformOrigin: "12px 21px" }}
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </motion.g>
    </svg>
  );
};

export default OrderIcon;
