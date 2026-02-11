import React from "react";
import { motion } from "framer-motion";
import ChatBubble from "./ChatBubble";
import ToolConfirmationBubble from "./ToolConfirmationBubble";

const MessageList = ({
  messages,
  activeTheme,
  isTyping,
  loadingText,
  messagesEndRef,
  handlers,
  swipeX,
  onConfirmTool,
  onCancelTool,
}) => {
  return (
    <div
      data-testid="message-list"
      // FIX: Tăng padding-bottom (pb-36) để đảm bảo tin nhắn cuối không bị che bởi spacer hoặc bàn phím
      // touch-pan-y: Cho phép scroll dọc tự nhiên, nhưng JS xử lý scroll ngang (swipe)
      className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-36 bg-transparent relative scroll-smooth overscroll-contain touch-pan-y"
      {...handlers}
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
          <p>Màn hình trống.</p>
          <p>Nhưng Misa vẫn nhớ chuyện cũ nha!</p>
        </div>
      ) : (
        messages.map((msg) => {
          if (msg.type === "tool_request") {
            return (
              <ToolConfirmationBubble
                key={msg.id}
                message={msg}
                theme={activeTheme}
                onConfirm={onConfirmTool}
                onCancel={onCancelTool}
              />
            );
          }
          return (
            <ChatBubble
              key={msg.id}
              message={msg}
              theme={activeTheme}
              swipeX={swipeX}
            />
          );
        })
      )}

      {isTyping && (
        <div className="flex justify-start mb-4 flex-col gap-2">
          <div
            className={`bg-white border ${activeTheme.botBubbleBorder} px-5 py-3.5 rounded-[20px] rounded-tl-sm shadow-sm flex gap-1 items-center w-fit`}
          >
            <span
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></span>
            <span
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></span>
            <span
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></span>
          </div>
          {loadingText && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-gray-500 italic ml-2"
            >
              {loadingText}
            </motion.span>
          )}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
