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
      y: 0,
      transition: {
        duration: 1.5,
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    },
    inactive: {
      height: 12, // Short receipt
      y: 0,
      transition: { duration: 2.5, ease: "easeInOut" }
    }
  };

  // Lines writing on the receipt
  // Explicitly ensuring opacity is 1 in active
  const lineVariants = {
    active: (i) => ({
      opacity: [0, 1],
      pathLength: [0, 1],
      transition: {
        duration: 0.5,
        delay: 0.5 + (i * 0.2), // Staggered appearance
        repeat: loop ? Infinity : 0,
        repeatType: "reverse",
        ease: "easeOut"
      }
    }),
    inactive: (i) => ({
      // Keep top lines visible, hide bottom lines completely
      opacity: i < 2 ? 1 : 0,
      pathLength: 1,
      transition: { duration: 1.5, ease: "easeInOut" }
    })
  };

  // "Cute Detail" (Heart) Variants
  // Visible when inactive (short receipt), Disappears when active (printing)
  const detailVariants = {
    active: {
      opacity: 0,
      scale: 0,
      y: 5, // Move down slightly as it disappears
      transition: { duration: 0.5, ease: "easeOut" }
    },
    inactive: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 2.5, ease: "easeInOut", delay: 0.5 } // Slow appearance
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

      {/* Lines - Explicit paths to ensure visibility */}
      {/* Top 2 lines (Visible in Inactive) */}
      <motion.path d="M9 6h6" variants={lineVariants} custom={0} />
      <motion.path d="M9 10h6" variants={lineVariants} custom={1} />

      {/* Bottom 2 lines (Only visible in Active) */}
      <motion.path d="M9 14h4" variants={lineVariants} custom={2} />
      <motion.path d="M9 18h2" variants={lineVariants} custom={3} />

      {/* Cute Detail (Dollar Sign) - Positioned at bottom of short receipt (approx y=10-12 area) */}
      {/* Center of paper is x=12. Short receipt ends at y=14. Let's put it around y=10 */}
      <motion.path
        d="M12 12v.01 M10 12c0 2 4 2 4 0s-4-2-4-4 4-2 4 0" // Simplified 'S' / Dollar curve? Or maybe a Heart?
        // Let's use a Heart for "xinh xinh": M12 11.5 ...
        // Or a simple Dollar '$' since it's an order: M12 14h.01 ...
        // Let's try a simple smile: M10 11s1 1 2 1 2-1 2-1
        // User said "xinh xinh" (cute). A small heart is safest.
        // Heart path scaled small: M12 14.5c-1.5 0-3-1-3-2.5 0-1.5 1.5-2.5 3-2.5 1.5 0 3 1 3 2.5 0 1.5-1.5 2.5-3 2.5z
        // Let's use a simple Heart at the bottom.
      />

      {/* Implementing the Heart Detail */}
      <motion.path
        d="M12 13.5c-1.1 0-2-.8-2-1.5 0-1 1.5-2 2-2 .5 0 2 1 2 2 0 .7-.9 1.5-2 1.5z" // Tiny heart
        // Actually, let's use a cleaner heart path
        // M12 14 C 12 14, 10 13, 10 11.5 C 10 10.5, 11 10, 11.5 10 C 11.8 10, 12 10.2, 12 10.2 C 12 10.2, 12.2 10, 12.5 10 C 13 10, 14 10.5, 14 11.5 C 14 13, 12 14, 12 14 Z
        d="M12 13.5 C 12 13.5, 10.5 12.5, 10.5 11.5 C 10.5 10.8, 11 10.5, 11.5 10.5 C 11.8 10.5, 12 10.7, 12 10.7 C 12 10.7, 12.2 10.5, 12.5 10.5 C 13 10.5, 13.5 10.8, 13.5 11.5 C 13.5 12.5, 12 13.5, 12 13.5 Z"
        variants={detailVariants}
        fill="currentColor" // Use solid fill for visibility
        stroke="none"      // No stroke for the heart
      />

    </motion.svg>
  );
};

export default OrderIcon;
