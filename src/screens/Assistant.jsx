import React, { useState, useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import ChatBubble from '../components/assistant/ChatBubble';
import ChatInput from '../components/assistant/ChatInput';
import { processQuery } from '../services/aiAssistantService';

const Assistant = ({ products, orders }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'text',
      sender: 'assistant',
      content: 'Chào bạn! Mình là trợ lý ảo Tiny. Mình có thể giúp gì cho bạn hôm nay?',
      timestamp: new Date()
    }
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
    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      type: 'text',
      sender: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate network delay for "Thinking" effect
    setTimeout(() => {
        try {
            const response = processQuery(text, { products, orders });
            setMessages(prev => [...prev, response]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                type: 'text',
                sender: 'assistant',
                content: 'Xin lỗi, mình gặp chút sự cố khi xử lý yêu cầu này.',
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    }, 600 + Math.random() * 400); // Random delay 0.6s - 1s
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
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
