import React from "react";
import { motion } from "framer-motion";
import ChatInput from "../components/assistant/ChatInput";
import ModelSelector from "../components/assistant/ModelSelector";
import AssistantHeader from "../components/assistant/AssistantHeader";
import MessageList from "../components/assistant/MessageList";

// Hooks
import { useAssistantTheme } from "../hooks/assistant/useAssistantTheme";
import { useAssistantMode } from "../hooks/assistant/useAssistantMode";
import { useAssistantMemory } from "../hooks/assistant/useAssistantMemory";
import { useAssistantChat } from "../hooks/assistant/useAssistantChat";
import { useAutoScroll } from "../hooks/assistant/useAutoScroll";
import { useSwipeToReveal } from "../hooks/assistant/useSwipeToReveal";
import { useToolExecution } from "../hooks/assistant/useToolExecution";

const Assistant = ({
  products,
  setProducts,
  orders,
  setOrders,
  settings,
  messages,
  setMessages,
  isTyping,
  setIsTyping,
  setTabBarVisible,
}) => {
  // 1. Theme Logic
  const { activeTheme, handleCycleTheme } = useAssistantTheme();

  const [isInputFocused, setIsInputFocused] = React.useState(false);

  const handleInputFocus = () => {
    setIsInputFocused(true);
    setTabBarVisible(false);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    // Delay một chút để tránh layout bị giật trước khi bàn phím đóng hẳn
    setTimeout(() => {
      setTabBarVisible(true);
    }, 100);
  };

  // 2. Mode Logic
  const {
    modelMode,
    setModelMode,
    isModelSelectorOpen,
    setIsModelSelectorOpen,
  } = useAssistantMode();

  // 3. Memory Logic
  const {
    chatSummary,
    setChatSummary,
    appendToPendingBuffer,
    checkAndSummarizeBuffer,
    forceSummarizeBuffer,
  } = useAssistantMemory();

  // 4. Chat Logic
  const { loadingText, handleSendMessage, handleClearScreen } =
    useAssistantChat({
      messages,
      setMessages,
      setIsTyping,
      products,
      orders,
      settings,
      modelMode,
      chatSummary,
      setChatSummary,
      appendToPendingBuffer,
      checkAndSummarizeBuffer,
      forceSummarizeBuffer,
    });

  // 5. Scroll Logic
  const messagesEndRef = useAutoScroll([messages, loadingText, isTyping]);

  // 6. Swipe Logic
  const { swipeX, handlers } = useSwipeToReveal();

  // 7. Tool Execution Logic
  const { executeTool } = useToolExecution({
    products,
    setProducts,
    setOrders,
  });

  const handleConfirmTool = async (message) => {
    const { toolCallId, functionName, functionArgs } = message.data;
    const result = await executeTool(toolCallId, functionName, functionArgs);

    // Update status của message cũ
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === message.id ? { ...msg, status: "completed" } : msg
      )
    );

    // Thêm message kết quả
    const resultMsg = {
      id: Date.now().toString(),
      type: "text",
      sender: "assistant",
      content: result.message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, resultMsg]);
  };

  const handleCancelTool = (message) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === message.id ? { ...msg, status: "cancelled" } : msg
      )
    );
    const cancelMsg = {
      id: Date.now().toString(),
      type: "text",
      sender: "assistant",
      content: "Đã huỷ thao tác theo yêu cầu của mẹ.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cancelMsg]);
  };

  // Chiều cao TabBar mặc định (ước lượng 60px + safe area)
  // Bạn có thể chỉnh số 60px này cho khớp với chiều cao thực tế của TabBar app bạn
  const TABBAR_HEIGHT_SPACER = "calc(60px + env(safe-area-inset-bottom))";

  return (
    <motion.div
      // FIX 1: Dùng fixed inset-0 để neo cứng màn hình vào viewport, tránh bị đẩy lên khi bàn phím hiện
      // FIX 2: overscroll-none ngăn chặn việc kéo cả trang web xuống
      className="fixed inset-0 z-40 flex flex-col w-full h-full overflow-hidden overscroll-none"
      animate={{
        backgroundColor: activeTheme.bgGradient,
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <AssistantHeader
        activeTheme={activeTheme}
        modelMode={modelMode}
        chatSummary={chatSummary}
        handleClearScreen={handleClearScreen}
        handleCycleTheme={handleCycleTheme}
        messagesLength={messages.length}
      />

      <MessageList
        messages={messages}
        activeTheme={activeTheme}
        isTyping={isTyping}
        loadingText={loadingText}
        messagesEndRef={messagesEndRef}
        handlers={handlers}
        swipeX={swipeX}
        onConfirmTool={handleConfirmTool}
        onCancelTool={handleCancelTool}
      />

      <ModelSelector
        selectedModel={modelMode}
        onSelect={setModelMode}
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        theme={activeTheme}
      />

      {/* Input Area + Spacer Container */}
      {/* Container này sẽ nằm đè lên vị trí của TabBar khi bàn phím tắt */}
      <div className="flex-none bg-white z-30 pb-0">
        <ChatInput
          onSend={handleSendMessage}
          disabled={isTyping}
          onOpenModelSelector={() => setIsModelSelectorOpen(true)}
          selectedModel={modelMode}
          theme={activeTheme}
          onInputFocus={handleInputFocus}
          onInputBlur={handleInputBlur}
          isFocused={isInputFocused}
        />

        {/* SPACER QUAN TRỌNG: 
            - Khi focus (phím hiện): Chiều cao = 0 (để input sát phím).
            - Khi blur (phím ẩn): Chiều cao = TabBar (để đẩy input lên trên TabBar).
        */}
        <div
          style={{
            height: isInputFocused ? 0 : TABBAR_HEIGHT_SPACER,
            transition: "height 0.3s ease-out",
          }}
          className="w-full bg-white flex-none"
        />
      </div>
    </motion.div>
  );
};

export default Assistant;
