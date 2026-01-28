import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const PaidStamp = ({ isPaid, variant = "list" }) => {
  const isList = variant === "list";

  // Cấu hình animation cho variants
  const animations = isList
    ? {
        initial: {
          opacity: 0,
          scale: 2,
          x: "-50%",
          y: "-50%",
          rotate: -25,
        },
        animate: {
          opacity: 0.8,
          scale: 1,
          x: "-50%",
          y: "-50%",
          rotate: -25,
        },
        exit: {
          opacity: 0,
          scale: 0.8,
          x: "-50%",
          y: "-50%",
          rotate: -25,
        },
      }
    : {
        initial: { opacity: 0, scale: 2 },
        animate: { opacity: 0.8, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
      };

  // Cấu hình style/class
  const baseClass =
    "absolute border-rose-500 text-rose-500 font-bold pointer-events-none z-10 whitespace-nowrap";
  const variantClass = isList
    ? "top-1/2 left-1/2 border-4 text-xl px-4 py-2 rounded-lg"
    : "top-0 right-0 border-2 text-base px-2 py-1 rounded-md";

  const style = !isList ? { mixBlendMode: "multiply" } : {};
  const delay = isList ? 0.3 : 0.4;

  return (
    <AnimatePresence>
      {isPaid && (
        <motion.div
          {...animations}
          transition={{
            delay,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          style={style}
          className={`${baseClass} ${variantClass}`}
        >
          ĐÃ THANH TOÁN
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaidStamp;
