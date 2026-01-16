import React from "react";
import { motion } from "framer-motion";
import { WifiOff, ArrowRight } from "lucide-react";

// Component SVG "Cửa hàng màu sắc" thay thế cho icon đơn điệu
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

const SplashScreen = ({ showWarning, onConfirm }) => {
  return (
    <div className="fixed top-0 left-0 h-[100dvh] w-screen z-50 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-rose-50 to-amber-100 p-6 text-center overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-200 rounded-full blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-rose-200 rounded-full blur-3xl opacity-50 animate-pulse delay-700"></div>

      {!showWarning ? (
        // --- TRẠNG THÁI LOADING ---
        <>
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

          <motion.div
            className="mt-8 relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-extrabold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent mb-2">
              Tiny Shop
            </h2>
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></span>
            </div>
          </motion.div>
        </>
      ) : (
        // --- TRẠNG THÁI CẢNH BÁO MẠNG CHẬM ---
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-rose-100 max-w-xs w-full relative z-20"
        >
          <div className="flex justify-center mb-4 text-amber-500 bg-amber-50 w-16 h-16 rounded-full items-center mx-auto">
            <WifiOff size={32} />
          </div>

          <h3 className="text-lg font-bold text-amber-900 mb-2">
            Kết nối mạng không ổn định...
          </h3>

          <p className="text-sm text-amber-700 mb-6 leading-relaxed">
            Ứng dụng vẫn có thể hoạt động ở chế độ <strong>offline</strong>,
            nhưng một số hình ảnh và chức năng có thể không khả dụng.
          </p>

          <button
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white py-3 rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-all hover:shadow-rose-300 flex items-center justify-center gap-2"
          >
            Tiếp tục sử dụng
            <ArrowRight size={18} />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SplashScreen;
