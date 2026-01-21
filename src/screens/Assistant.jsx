import React, { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import ChatBubble from "../components/assistant/ChatBubble";
import ChatInput from "../components/assistant/ChatInput";
import { processQuery } from "../services/aiAssistantService";

const Assistant = ({ products, orders, settings }) => {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      type: "text",
      sender: "assistant",
      content:
        "Chào bạn! Mình là trợ lý ảo Tiny. Mình có thể giúp gì cho bạn hôm nay?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    // Thêm tin nhắn người dùng
    const userMsg = {
      id: Date.now().toString(),
      type: "text",
      sender: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Nếu có API Key, dùng API. Nếu không, giả lập độ trễ cho AI cục bộ.
    const hasApiKey = settings?.aiApiKey && settings.aiApiKey.length > 10;

    if (hasApiKey) {
      try {
        const response = await processQuery(text, {
          products,
          orders,
          settings,
        });
        setMessages((prev) => [...prev, response]);
      } catch (error) {
        console.error("AI Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "text",
            sender: "assistant",
            content:
              "Xin lỗi, kết nối đến AI bị gián đoạn. Vui lòng kiểm tra lại API Key.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    } else {
      // AI Cục bộ (có độ trễ giả lập)
      setTimeout(
        () => {
          try {
            // Lưu ý: processQuery cục bộ hiện tại là đồng bộ, nhưng ta sẽ update nó trả về Promise hoặc handle cả hai
            // Để an toàn, service nên trả về Promise luôn.
            // Tuy nhiên service hiện tại là đồng bộ. Ta sẽ sửa service sau.
            // Ở đây ta gọi hàm và wrap vào Promise resolve.
            const response = processQuery(text, { products, orders, settings });
            // Handle response if it is a Promise (in case we updated service to be async always)
            Promise.resolve(response).then((res) => {
              setMessages((prev) => [...prev, res]);
            });
          } catch (error) {
            console.error("AI Error:", error);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                type: "text",
                sender: "assistant",
                content: "Xin lỗi, mình gặp chút sự cố khi xử lý yêu cầu này.",
                timestamp: new Date(),
              },
            ]);
          } finally {
            setIsTyping(false);
          }
        },
        600 + Math.random() * 400,
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-lg">Trợ lý ảo</h1>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Đang hoạt động
          </p>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
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
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSend={handleSendMessage} disabled={isTyping} />

      {/* Safe Area Spacer for TabBar overlap if needed, usually handled by parent container padding */}
      <div className="h-14"></div>
    </div>
  );
};

export default Assistant;
