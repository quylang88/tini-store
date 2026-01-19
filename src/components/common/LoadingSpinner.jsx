import React from "react";
import { motion } from "framer-motion";

const ColorfulShopIcon = () => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-xl"
  >
    {/* Nền cửa hàng */}
    <path
      d="M20 40H80V90C80 92.7614 77.7614 95 75 95H25C22.2386 95 20 92.7614 20 90V40Z"
      fill="#FFF7ED"
      stroke="#F97316"
      strokeWidth="2"
    />

    {/* Cửa chính */}
    <rect
      x="35"
      y="55"
      width="30"
      height="40"
      rx="2"
      fill="#FFE4E6"
      stroke="#FB7185"
      strokeWidth="2"
    />
    <circle cx="60" cy="75" r="2" fill="#F43F5E" />

    {/* Mái che sọc cam/hồng */}
    <path d="M15 40L25 20H75L85 40H15Z" fill="#F43F5E" />
    <path d="M25 20L30 40H40L35 20H25Z" fill="#FDBA74" />
    <path d="M45 20L50 40H60L55 20H45Z" fill="#FDBA74" />
    <path d="M65 20L70 40H80L75 20H65Z" fill="#FDBA74" />

    {/* Biển hiệu "SHOP" */}
    <rect
      x="35"
      y="5"
      width="30"
      height="12"
      rx="2"
      fill="#FBBF24"
      stroke="#D97706"
      strokeWidth="1"
    />
    <path d="M48 5V0M52 5V0" stroke="#78350F" strokeWidth="1" />

    {/* Cây cảnh trang trí 2 bên */}
    <circle
      cx="15"
      cy="90"
      r="8"
      fill="#4ADE80"
      stroke="#15803D"
      strokeWidth="1"
    />
    <path d="M15 90V95" stroke="#78350F" strokeWidth="2" />

    <circle
      cx="85"
      cy="90"
      r="8"
      fill="#4ADE80"
      stroke="#15803D"
      strokeWidth="1"
    />
    <path d="M85 90V95" stroke="#78350F" strokeWidth="2" />
  </svg>
);

const LoadingSpinner = ({ text = "Tiny Shop", showText = true, className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div
        animate={{
          y: [0, -10, 0],
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10"
      >
        <ColorfulShopIcon />
      </motion.div>

      {showText && (
        <motion.div
          className="mt-8 relative z-10 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-extrabold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent mb-2">
            {text}
          </h2>
          <div className="flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LoadingSpinner;
