import React, { useId } from "react";
import { motion } from "framer-motion";

const OrderIcon = ({ isActive, size = 24, strokeWidth = 2, loop = false }) => {
  const gradientId = useId().replace(/:/g, "");
  const activeStroke = `url(#${gradientId})`;
  const inactiveStroke = "currentColor";

  // Paper "Printing" Animation
  const paperVariants = {
    active: {
      height: 20, // Expands to full height
      transition: {
        duration: 1.5,
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    },
    inactive: {
      height: 12, // Short receipt
      transition: { duration: 2.5, ease: "easeInOut" }
    }
  };

  // Lines writing on the receipt
  const lineVariants = {
    active: (i) => ({
      opacity: [0, 1], // Explicitly animate from invisible
      pathLength: [0, 1], // Explicitly draw the line
      transition: {
        duration: 0.5,
        delay: 0.5 + (i * 0.2), // Staggered appearance
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        ease: "easeOut"
      }
    }),
    inactive: (i) => ({
      // Keep top lines visible, hide bottom lines
      opacity: i < 2 ? 1 : 0,
      pathLength: 1,
      transition: { duration: 1.5, ease: "easeInOut" }
    })
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
      className="lucide lucide-receipt overflow-visible"
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

      {/* Paper Body */}
      <motion.rect
        x="5" y="2" width="14" rx="2"
        variants={paperVariants}
      />

      {/* Lines */}
      {/* Line 1: y=6 */}
      <motion.path d="M9 6h6" variants={lineVariants} custom={0} />

      {/* Line 2: y=10 */}
      <motion.path d="M9 10h6" variants={lineVariants} custom={1} />

      {/* Line 3: y=14 */}
      <motion.path d="M9 14h4" variants={lineVariants} custom={2} />

      {/* Line 4: y=18 */}
      <motion.path d="M9 18h2" variants={lineVariants} custom={3} />

    </motion.svg>
  );
};

export default OrderIcon;
