import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * A reusable component that handles product name truncation and expansion.
 *
 * @param {string} name - The product name to display.
 * @param {string} className - Additional classes for the name container.
 * @param {React.ReactNode} children - Content to hide when the name is expanded (optional).
 * @param {string} expandedClassName - Classes to apply when expanded (default: "whitespace-normal break-words").
 * @param {string} collapsedClassName - Classes to apply when collapsed (default: "truncate").
 */
const ExpandableProductName = ({
  name,
  className = "",
  children,
  expandedClassName = "whitespace-normal break-words",
  collapsedClassName = "truncate",
  textClassName = "font-bold text-rose-800 text-sm",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={className}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className={`${textClassName} cursor-pointer mb-1 ${
          isExpanded ? expandedClassName : collapsedClassName
        }`}
      >
        {name}
      </div>

      <AnimatePresence>
        {!isExpanded && children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpandableProductName;
