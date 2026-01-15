import React from "react";
import { motion } from "framer-motion";

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100">
      <motion.div
        className="text-6xl"
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        🐇
      </motion.div>
      <motion.p
        className="mt-4 text-amber-700 font-bold text-lg"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Đang tải...
      </motion.p>
    </div>
  );
};

export default SplashScreen;
