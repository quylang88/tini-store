import React from "react";
import { Sparkles, Zap, Server } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ModelSelector = ({ selectedModel, onSelect, isOpen, onClose }) => {
  const models = [
    {
      id: "PRO",
      name: "Misa Pro",
      description: "Thông minh nhất, dùng cho tác vụ phức tạp.",
      icon: Sparkles,
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
    {
      id: "FLASH",
      name: "Misa Flash",
      description: "Phản hồi nhanh, dùng cho câu hỏi đơn giản.",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      id: "LOCAL",
      name: "Misa Local",
      description: "Chạy cục bộ, bảo mật cao, không Internet.",
      icon: Server,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 z-40 backdrop-blur-[1px]"
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-[80px] left-3 right-3 bg-white rounded-2xl shadow-xl border border-white/50 z-50 overflow-hidden"
          >
            <div className="p-3 bg-gray-50 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Chọn chế độ AI
              </h3>
            </div>
            <div className="p-2 space-y-1">
              {models.map((model) => {
                const isSelected = selectedModel === model.id;
                const Icon = model.icon;
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelect(model.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-gray-100 ring-1 ring-gray-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${model.bg} ${model.color}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-sm">
                          {model.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-800 text-white rounded-full">
                            ĐANG DÙNG
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                        {model.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModelSelector;
