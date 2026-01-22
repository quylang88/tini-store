import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import AssistantIcon from "./AssistantIcon";
import FlashIcon from "./FlashIcon";
import LiteIcon from "./LiteIcon";

const ModelSelector = ({ selectedModel, onSelect, isOpen, onClose }) => {
  const models = [
    {
      id: "PRO",
      name: "Misa Smart",
      description: "Ổn định, limit cao, phù hợp đa số tác vụ.",
      icon: AssistantIcon,
      color: "text-rose-600",
      bg: "bg-rose-100",
    },
    {
      id: "FLASH",
      name: "Misa Flash",
      description: "Tốc độ cao, thông minh, giới hạn lượt dùng.",
      icon: FlashIcon,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      id: "LITE",
      name: "Misa Lite",
      description: "Siêu tốc, tiết kiệm, tác vụ đơn giản.",
      icon: LiteIcon,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
  ];

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - Z-index 60 to be above TabBar (z-50) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[60] backdrop-blur-[1px]"
          />

          {/* Menu - Z-index 70 */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[80px] left-3 right-3 bg-white rounded-2xl shadow-xl border border-white/50 z-[70] overflow-hidden"
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
                        ? "bg-rose-50 ring-1 ring-rose-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${model.bg} ${model.color}`}
                    >
                      <Icon size={20} isActive={false} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-600 text-sm">
                          {model.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-500 text-white rounded-full">
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
    </AnimatePresence>,
    document.body,
  );
};

export default ModelSelector;
