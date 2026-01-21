import React, { useRef, useEffect } from "react";
import { formatCurrency } from "../../utils/formatters/formatUtils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const ChatBubble = ({ message }) => {
  const isUser = message.sender === "user";
  const scrollRef = useRef(null);

  // Scroll into view when new message appears
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "bg-rose-500 text-white rounded-br-none"
            : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
        }`}
      >
        {/* Text Content */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>

        {/* Specialized Content Types */}
        {!isUser && message.type === "stats" && message.data && (
          <div className="mt-3 bg-rose-50 rounded-xl p-3 border border-rose-100">
            <div className="text-xs text-rose-500 uppercase font-bold tracking-wider mb-1">
              {message.data.label}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(message.data.value)}
            </div>
            {message.data.subtext && (
              <div className="text-xs text-gray-500 mt-1">
                {message.data.subtext}
              </div>
            )}
          </div>
        )}

        {!isUser &&
          message.type === "product_list" &&
          Array.isArray(message.data) && (
            <div className="mt-3 flex flex-col gap-2">
              {message.data.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-50 p-2 rounded-lg flex items-center gap-3 border border-gray-200"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded-md bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center shrink-0 text-xs text-gray-400">
                      IMG
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="font-semibold text-rose-600">
                        {formatCurrency(product.price)}
                      </span>
                      <span>• Kho: {product.stock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {!isUser &&
          message.type === "order_list" &&
          Array.isArray(message.data) && (
            <div className="mt-3 flex flex-col gap-2">
              {message.data.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-50 p-2 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700">
                      #{order.id.toString().slice(-4)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(order.date), "dd/MM HH:mm", {
                        locale: vi,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">
                      {order.items.length} món
                    </span>
                    <span className="text-sm font-bold text-rose-600">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Timestamp */}
        <div
          className={`text-[10px] mt-1 text-right ${isUser ? "text-rose-100" : "text-gray-400"}`}
        >
          {format(new Date(message.timestamp || Date.now()), "HH:mm")}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
