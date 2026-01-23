import React, { useId } from "react";
import { motion } from "framer-motion";

const OrderIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  const activeStroke = `url(#${gradientId})`;
  const inactiveStroke = "currentColor";

  // Cart Body Animation (Jumps/Rolls)
  const cartVariants = {
    active: {
      x: [0, 2, 0], // Move forward and back (roll)
      y: [0, 1, 0], // Squish/Bounce slightly
      rotate: [0, -2, 0], // Tilt slightly
      transition: {
        duration: 0.6,
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        ease: "easeInOut",
      },
    },
    inactive: {
      x: 0,
      y: 0,
      rotate: 0,
      transition: { duration: 2.5, ease: "easeOut" }, // Slow return
    },
  };

  // Item Drop Animation (Falls into cart)
  const itemVariants = {
    active: {
      y: 0, // Land in cart
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10,
        mass: 0.5,
        delay: 0.1, // Wait slightly for cart to be ready
      },
    },
    inactive: {
      y: -10, // Hover above/disappear
      opacity: 0,
      scale: 0.5,
      transition: { duration: 1.5, ease: "easeInOut" }, // Slow float away
    },
  };

  // Wheels Animation (Spin)
  // eslint-disable-next-line no-unused-vars
  const wheelVariants = {
    active: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: loop ? Infinity : 0,
        ease: "linear",
      },
    },
    inactive: {
      rotate: 0,
      transition: { duration: 2.5, ease: "easeOut" },
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
      className="lucide lucide-shopping-cart overflow-visible"
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

      {/* Dropping Item (A small box/circle) */}
      <motion.rect
        x="11"
        y="6"
        width="4"
        height="4"
        rx="1"
        variants={itemVariants}
        // Initially positioned high and invisible
      />

      {/* Cart Body Group */}
      <motion.g variants={cartVariants}>
        {/* Handle & Basket */}
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </motion.g>
    </motion.svg>
  );
};

// Re-implementing a Standard Cart (Shopping Cart) path instead of Shopping Bag
// The previous paths above were for a "Shopping Bag".
// Let's switch to the standard "Shopping Cart" (trolley) which is more common for "Orders/Stock".
// Path: Circle wheels, frame, basket.

const ShoppingCartIcon = ({
  isActive,
  size = 24,
  strokeWidth = 2,
  loop = false,
}) => {
  const gradientId = useId().replace(/:/g, "");
  const activeStroke = `url(#${gradientId})`;
  const inactiveStroke = "currentColor";

  // Cart moves forward/backward
  const cartFrameVariants = {
    active: {
      x: [0, 3, 0],
      transition: {
        duration: 1,
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        ease: "easeInOut",
      },
    },
    inactive: {
      x: 0,
      transition: { duration: 2.5, ease: "easeOut" },
    },
  };

  // Item falling in
  const itemVariants = {
    active: {
      y: 0,
      x: 0,
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: "backOut",
        delay: 0.2,
      },
    },
    inactive: {
      y: -15,
      x: -5,
      scale: 0.5,
      opacity: 0,
      rotate: -45,
      transition: { duration: 2.0, ease: "easeInOut" },
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
      className="lucide lucide-shopping-cart overflow-visible"
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

      {/* Item (Box) falling in */}
      <motion.rect
        x="13"
        y="4"
        width="6"
        height="6"
        rx="1"
        variants={itemVariants}
      />

      {/* Cart Frame */}
      <motion.g variants={cartFrameVariants}>
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </motion.g>
    </motion.svg>
  );
};

export default ShoppingCartIcon;
