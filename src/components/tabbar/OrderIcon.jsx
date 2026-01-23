import React, { useId } from "react";
import { motion } from "framer-motion";

const OrderIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  const activeStroke = `url(#${gradientId})`;
  const inactiveStroke = "currentColor";

  // Cart body pulses/breaths when active
  const cartVariants = {
    active: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: loop ? Infinity : 0,
        ease: "easeInOut",
      }
    },
    inactive: {
      scale: 1,
      transition: { duration: 2.5, ease: "easeInOut" }
    }
  };

  // Content fills up inside the cart
  const fillVariants = {
    active: {
      pathLength: 1,
      opacity: 1,
      y: [5, 0], // Rise up
      transition: {
        duration: 1.5,
        ease: "easeOut",
      }
    },
    inactive: {
      pathLength: 0,
      opacity: 0,
      y: 5, // Sink down
      transition: {
        duration: 2.5,
        ease: "easeInOut"
      }
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

      {/* Content (Fill) - Represents items inside */}
      <motion.path
        d="M6 10h11v7h-11z" // Simple block shape inside cart area
        fill={isActive ? activeStroke : "none"}
        stroke="none"
        opacity="0.3"
        variants={fillVariants}
        initial="inactive"
        animate={isActive ? "active" : "inactive"}
      />

      {/* Items popping out top */}
      <motion.path
         d="M8 8l2-2 M12 7l0-3 M16 8l-2-2"
         stroke={isActive ? activeStroke : "none"}
         strokeWidth="2"
         variants={{
            active: { opacity: [0, 1], y: [5, 0], transition: { delay: 0.5, duration: 1 } },
            inactive: { opacity: 0, y: 5, transition: { duration: 2 } }
         }}
         initial="inactive"
         animate={isActive ? "active" : "inactive"}
      />

      {/* Cart Body */}
      <motion.g
        variants={cartVariants}
        animate={isActive ? "active" : "inactive"}
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
