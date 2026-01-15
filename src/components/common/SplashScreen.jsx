import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, WifiOff, ArrowRight } from "lucide-react";

const SplashScreen = ({ showWarning, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100 p-6 text-center">
      {!showWarning ? (
        // --- TRẠNG THÁI LOADING ---
        <>
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, -5, 5, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-rose-500"
          >
            <ShoppingBag size={80} strokeWidth={1.5} />
          </motion.div>

          <motion.p
            className="mt-6 text-amber-800 font-bold text-lg tracking-wide"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Đang tải dữ liệu...
          </motion.p>
        </>
      ) : (
        // --- TRẠNG THÁI CẢNH BÁO MẠNG CHẬM ---
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-rose-100 max-w-xs w-full"
        >
          <div className="flex justify-center mb-4 text-amber-500">
            <WifiOff size={48} />
          </div>

          <h3 className="text-lg font-bold text-amber-900 mb-2">
            Mạng chậm hoặc không có kết nối
          </h3>

          <p className="text-sm text-amber-700 mb-6 leading-relaxed">
            Ứng dụng vẫn có thể hoạt động ở chế độ <strong>offline</strong>, nhưng một số hình ảnh có thể không hiển thị.
          </p>

          <button
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white py-3 rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition flex items-center justify-center gap-2"
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
