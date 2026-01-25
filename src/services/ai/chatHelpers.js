/**
 * chatHelpers.js
 * Các hàm tiện ích hỗ trợ format phản hồi chat và tạo lời chào.
 */

import { MISA_GREETINGS } from "../../constants/misaGreetings";

/**
 * Tạo object phản hồi chuẩn cho ứng dụng.
 * @param {string} type - Loại phản hồi (ví dụ: 'text')
 * @param {string} content - Nội dung phản hồi
 * @param {any} data - Dữ liệu kèm theo (tùy chọn)
 */
export const createResponse = (type, content, data = null) => {
  return {
    id: Date.now().toString(),
    sender: "assistant",
    type,
    content,
    data,
    timestamp: new Date(),
  };
};

/**
 * Returns a random greeting message object.
 * @param {string|null} excludeContent - The content of the previous greeting to avoid repetition.
 * @returns {object} The message object.
 */
export const getRandomGreeting = (excludeContent = null) => {
  let available = MISA_GREETINGS;

  if (excludeContent) {
    available = MISA_GREETINGS.filter((msg) => msg !== excludeContent);
    // Fallback if filter removes everything (unlikely unless array is size 1)
    if (available.length === 0) available = MISA_GREETINGS;
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  const content = available[randomIndex];

  return {
    id: `welcome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: "text",
    sender: "assistant",
    content: content,
    timestamp: new Date(),
  };
};
