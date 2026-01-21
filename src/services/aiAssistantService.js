/**
 * aiAssistantService.js
 *
 * Service này đóng vai trò là "Bộ não" cho Trợ lý ảo cục bộ và tích hợp Gemini AI.
 * Nó phân tích các truy vấn ngôn ngữ tự nhiên của người dùng bằng Regex (local) hoặc gọi API Gemini (cloud).
 */

import { formatCurrency } from "../utils/formatters/formatUtils";

/**
 * Chuẩn hóa văn bản để so sánh (chữ thường, bỏ dấu).
 */
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

/**
 * Xử lý truy vấn của người dùng.
 * Hàm này giờ đây là async để hỗ trợ gọi API.
 *
 * @param {string} query Câu hỏi của user
 * @param {object} context { products, orders, settings }
 */
export const processQuery = async (query, context) => {
  const { settings } = context;

  // Kiểm tra nếu có API Key hợp lệ thì gọi Gemini
  if (settings && settings.aiApiKey && settings.aiApiKey.length > 10) {
    return await processQueryWithGemini(query, context);
  }

  // Nếu không, fallback về logic cục bộ (local rule-based)
  return processQueryLocal(query, context);
};

/**
 * LOGIC CỤC BỘ (Rule-based)
 * Chạy khi không có API Key.
 */
const processQueryLocal = (query, context) => {
  const { products, orders } = context;
  const cleanQuery = normalizeText(query);

  // 1. CHÀO HỎI (Greetings)
  if (cleanQuery.match(/^(xin chao|hi|hello|chao|lo|alo)/)) {
    return createResponse(
      "text",
      'Xin chào! Mình là trợ lý ảo Tiny (Offline). Mình có thể giúp gì cho bạn? (Ví dụ: "Doanh thu hôm nay", "Tìm sản phẩm")',
    );
  }

  // 2. DOANH THU / THỐNG KÊ (Revenue / Stats)
  if (cleanQuery.includes("doanh thu") || cleanQuery.includes("tien ban")) {
    if (cleanQuery.includes("hom nay") || cleanQuery.includes("nay")) {
      const today = new Date().toLocaleDateString("en-CA");
      const todayOrders = orders.filter(
        (o) => o.date.startsWith(today) && o.status !== "cancelled",
      );
      const total = todayOrders.reduce((sum, o) => sum + o.total, 0);
      const count = todayOrders.length;

      return createResponse(
        "stats",
        `Doanh thu hôm nay là ${formatCurrency(total)} từ ${count} đơn hàng.`,
        {
          label: "Doanh thu hôm nay",
          value: total,
          subtext: `${count} đơn hàng`,
        },
      );
    }

    // Mặc định là tổng doanh thu
    const total = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);
    return createResponse(
      "stats",
      `Tổng doanh thu toàn thời gian là ${formatCurrency(total)}.`,
      {
        label: "Tổng doanh thu",
        value: total,
        subtext: "Toàn thời gian",
      },
    );
  }

  // 3. TÌM KIẾM SẢN PHẨM (Product Search)
  if (
    cleanQuery.includes("tim") ||
    cleanQuery.includes("gia") ||
    cleanQuery.includes("xem")
  ) {
    const keyword = cleanQuery
      .replace(/(tim|gia cua|gia|xem|san pham|con bao nhieu|kiem tra)/g, "")
      .trim();

    if (keyword.length < 2) {
      return createResponse(
        "text",
        "Bạn muốn tìm sản phẩm gì? Hãy nhập tên cụ thể hơn nhé.",
      );
    }

    const results = products.filter((p) =>
      normalizeText(p.name).includes(keyword),
    );

    if (results.length === 0) {
      return createResponse(
        "text",
        `Không tìm thấy sản phẩm nào khớp với từ khóa "${keyword}".`,
      );
    } else if (results.length === 1) {
      const p = results[0];
      return createResponse(
        "product_list",
        `Tìm thấy: ${p.name}. Giá: ${formatCurrency(p.price)}. Tồn: ${p.stock}.`,
        [p],
      );
    } else {
      return createResponse(
        "product_list",
        `Tìm thấy ${results.length} sản phẩm:`,
        results,
      );
    }
  }

  // FALLBACK (Dự phòng)
  return createResponse(
    "text",
    'Chế độ Offline: Mình chỉ hiểu các lệnh đơn giản như "Doanh thu", "Tìm [tên sản phẩm]". Hãy nhập API Key trong Cài đặt để mình thông minh hơn nhé!',
  );
};

/**
 * LOGIC GỌI GEMINI API (Cloud AI)
 */
const processQueryWithGemini = async (query, context) => {
  const { products, orders, settings } = context;
  const apiKey = settings.aiApiKey;

  // 1. Chuẩn bị ngữ cảnh (Context Injection)
  // Giới hạn số lượng sản phẩm để tránh quá token limit (chọn 50 sản phẩm mới nhất hoặc quan trọng nhất)
  // Ở đây ta lấy hết nhưng chỉ lấy tên, giá, tồn để tiết kiệm.
  const productContext = products
    .slice(0, 100)
    .map((p) => `- ${p.name} (Giá: ${p.price}đ, Tồn: ${p.stock})`)
    .join("\n");

  // Thống kê sơ bộ để AI nắm bắt
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const today = new Date().toLocaleDateString("en-CA");
  const todayRevenue = orders
    .filter((o) => o.date.startsWith(today) && o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const statsContext = `
    - Tổng doanh thu toàn thời gian: ${totalRevenue}đ
    - Doanh thu hôm nay (${today}): ${todayRevenue}đ
    - Tổng số đơn hàng: ${orders.length}
    `;

  // 2. Tạo Prompt (Lời nhắc hệ thống)
  const systemPrompt = `
      Bạn là Trợ lý ảo thông minh của ứng dụng quản lý bán hàng "Tiny Shop".
      Hãy trả lời người dùng ngắn gọn, thân thiện, hữu ích bằng tiếng Việt.

      DỮ LIỆU CỬA HÀNG HIỆN TẠI:
      ${statsContext}

      DANH SÁCH SẢN PHẨM (Top 100):
      ${productContext}

      YÊU CẦU CỦA NGƯỜI DÙNG: "${query}"

      HƯỚNG DẪN TRẢ LỜI:
      - Nếu người dùng hỏi về thông tin nội bộ (doanh thu, tồn kho, giá bán tại shop), hãy ƯU TIÊN dùng dữ liệu ở trên.
      - Nếu người dùng hỏi về GIÁ THỊ TRƯỜNG, XU HƯỚNG, ĐỐI THỦ, hoặc thông tin sản phẩm bên ngoài: HÃY SỬ DỤNG GOOGLE SEARCH để tìm câu trả lời mới nhất.
      - Nếu sản phẩm không có trong danh sách shop, hãy nói là không tìm thấy trong kho, nhưng có thể tìm thông tin bên ngoài nếu cần.
      - Luôn dẫn nguồn nếu lấy thông tin từ internet.
    `;

  try {
    // Sử dụng gemini-1.5-flash (bản miễn phí/ổn định) với Google Search Grounding
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        tools: [
          {
            google_search: {},
          },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "API Error");
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) throw new Error("No response from AI");

    return createResponse("text", textResponse);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return createResponse(
      "text",
      `Lỗi kết nối AI: ${error.message}. (Đang chuyển về chế độ offline...)`,
    );
  }
};

/**
 * Hàm hỗ trợ tạo đối tượng phản hồi có cấu trúc
 */
const createResponse = (type, content, data = null) => {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    sender: "assistant",
    type,
    content,
    data,
  };
};
