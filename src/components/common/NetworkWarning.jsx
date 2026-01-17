import React from "react";
import { motion } from "framer-motion";
import { WifiOff, ArrowRight } from "lucide-react";

const NetworkWarning = ({ onConfirm }) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-rose-50 to-amber-100 p-6 text-center overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-200 rounded-full blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-rose-200 rounded-full blur-3xl opacity-50 animate-pulse delay-700"></div>

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
          Ứng dụng vẫn có thể hoạt động ở chế độ <strong>offline</strong>, nhưng
          một số hình ảnh và chức năng có thể không khả dụng.
        </p>

        <button
          onClick={onConfirm}
          className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white py-3 rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-all hover:shadow-rose-300 flex items-center justify-center gap-2"
        >
          Tiếp tục sử dụng
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
};

export default NetworkWarning;
