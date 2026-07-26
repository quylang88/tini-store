import fs from 'fs';

function addAutoGenerateUsageInstructions() {
  let content = fs.readFileSync('src/services/aiAssistantService.js', 'utf8');

  const newFunction = `
/**
 * Automatically generates usage instructions for a product if it's a medicine or supplement.
 * Uses Gemini to determine if it's a medicine/supplement and generate instructions via web search.
 */
export const generateUsageInstructions = async (productName, category) => {
  try {
    const prompt = \`
Bạn là một chuyên gia y tế và dược phẩm. Nhiệm vụ của bạn là kiểm tra xem sản phẩm "\\\${productName}" (Danh mục: \\\${category}) có phải là thuốc hoặc thực phẩm bổ sung không.
- Bước 1: Trả lời "YES" nếu là thuốc/thực phẩm bổ sung, hoặc "NO" nếu không phải.
- Bước 2: Nếu là YES, hãy cung cấp hướng dẫn sử dụng tiếng Việt ngắn gọn, gạch đầu dòng rõ ràng: uống khi nào, bao nhiêu viên/liều lượng, bao nhiêu lần 1 ngày.
Chỉ trả về theo format sau, không thêm văn bản khác:
[YES/NO]
(Nếu YES thì ghi hướng dẫn ở đây)\`;

    // Gọi Gemini để xác định
    const result = await callGeminiAPI("gemini-1.5-flash", [{ role: "user", content: prompt }], "Bạn là chuyên gia y tế.", 0.2);

    if (!result || !result.content) return null;

    const lines = result.content.trim().split('\\n');
    const isMedicine = lines[0].trim().toUpperCase().includes("YES");

    if (!isMedicine) {
      return null;
    }

    // Thu thập kết quả
    const instructions = lines.slice(1).join('\\n').trim();
    if (instructions) {
      return instructions;
    }

    // Nếu Gemini không trả về chi tiết, thử tìm kiếm web
    const searchResults = await searchWeb(\`hướng dẫn sử dụng liều dùng "\${productName}"\`, null, "basic", 3);
    if (!searchResults) return null;

    const summaryPrompt = \`Dựa vào thông tin sau, hãy viết hướng dẫn sử dụng cho sản phẩm "\${productName}".
Viết bằng tiếng Việt, dạng gạch đầu dòng rõ ràng: uống khi nào, bao nhiêu viên/liều lượng, bao nhiêu lần 1 ngày.
Nếu không có thông tin, trả về "Cần tham khảo ý kiến bác sĩ".

Thông tin:
\${searchResults}\`;

    const finalResult = await callGeminiAPI("gemini-1.5-flash", [{ role: "user", content: summaryPrompt }], "Bạn là chuyên gia y tế.", 0.2);
    return finalResult?.content?.trim() || "Cần tham khảo ý kiến bác sĩ.";

  } catch (error) {
    console.error("Lỗi khi tạo hướng dẫn sử dụng tự động:", error);
    return null;
  }
};
`;

  content = content + '\n' + newFunction;
  fs.writeFileSync('src/services/aiAssistantService.js', content, 'utf8');
}

addAutoGenerateUsageInstructions();
