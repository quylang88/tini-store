import React from "react";
import { Bot, Palette, Eraser } from "lucide-react";
import AssistantIcon from "./AssistantIcon";
import FlashIcon from "./FlashIcon";
import DeepIcon from "./DeepIcon";
import { AI_MODES } from "../../services/ai/config";

const AssistantHeader = ({
  activeTheme,
  modelMode,
  chatSummary,
  handleClearScreen,
  handleCycleTheme,
  messagesLength,
}) => {
  return (
    <div
      className={`flex-none pt-[env(safe-area-inset-top)] flex items-center gap-3 px-4 py-3 border-b border-white/50 backdrop-blur-sm z-20 shadow-sm ${activeTheme.headerBg}`}
    >
      <div
        className={`w-10 h-10 rounded-full ${activeTheme.headerIconBg} text-white flex items-center justify-center shadow-md`}
      >
        <Bot size={24} />
      </div>
      <div className="flex-1">
        <div className="flex items-start gap-1">
          <h1
            className={`font-bold text-lg relative ${activeTheme.headerText}`}
          >
            Trợ lý ảo Misa
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${navigator.onLine ? "bg-green-500" : "bg-red-500"} animate-pulse`}
            ></span>
            {modelMode === "standard" && AI_MODES.standard.label}
            {modelMode === "fast" && AI_MODES.fast.label}
            {modelMode === "deep" && AI_MODES.deep.label}
          </p>
          {chatSummary && (
            <span
              className={`text-[10px] ${activeTheme.themeBtnBg} ${activeTheme.themeBtnText} px-1.5 rounded-full flex items-center gap-0.5`}
            >
              {modelMode === "standard" && (
                <AssistantIcon isActive={false} size={14} />
              )}
              {modelMode === "fast" && (
                <FlashIcon isActive={false} size={14} />
              )}
              {modelMode === "deep" && (
                <DeepIcon isActive={false} size={14} />
              )}
              Đang nhớ
            </span>
          )}
        </div>
      </div>

      {/* Nút Dọn Màn Hình */}
      {messagesLength > 0 && (
        <button
          onClick={handleClearScreen}
          className={`p-2.5 mr-1 rounded-full transition-all shadow-sm active:scale-90 ring-1 ${activeTheme.themeBtnBg} ${activeTheme.themeBtnRing}`}
          title="Dọn màn hình (AI vẫn nhớ)"
          aria-label="Dọn màn hình"
        >
          <Eraser size={20} className={activeTheme.themeBtnText} />
        </button>
      )}

      <button
        onClick={handleCycleTheme}
        className={`p-2.5 rounded-full transition-all shadow-sm active:scale-90 ring-1 ${activeTheme.themeBtnBg} ${activeTheme.themeBtnRing}`}
        aria-label="Đổi màu giao diện"
        title="Đổi màu giao diện"
      >
        <Palette size={20} className={activeTheme.themeBtnText} />
      </button>
    </div>
  );
};

export default AssistantHeader;
