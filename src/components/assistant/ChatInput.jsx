import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

const ChatInput = ({ onSend, disabled }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
    }
  };

  const suggestions = [
    "Doanh thu hôm nay",
    "Sản phẩm sắp hết",
    "Tìm áo thun",
    "Bán chạy nhất"
  ];

  return (
    <div className="bg-white border-t border-gray-100 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      {/* Suggestions Chips (Horizontal Scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mb-1">
        {suggestions.map((s) => (
            <button
                key={s}
                onClick={() => onSend(s)}
                className="whitespace-nowrap px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-xs font-medium border border-rose-100 hover:bg-rose-100 active:scale-95 transition-transform"
            >
                {s}
            </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400">
                <Sparkles size={18} />
            </div>
            <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Hỏi trợ lý ảo..."
            disabled={disabled}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-gray-400"
            />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="p-3 bg-rose-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-700 active:scale-90 transition-all shadow-sm shadow-rose-200"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
