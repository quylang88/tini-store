/**
 * aiAssistantService.js
 *
 * Service này đóng vai trò là "Bộ não" cho Trợ lý ảo cục bộ.
 * Nó phân tích các truy vấn ngôn ngữ tự nhiên của người dùng bằng Regex và logic suy đoán
 * để truy vấn trạng thái ứng dụng cục bộ (sản phẩm, đơn hàng) và trả về
 * các phản hồi có cấu trúc.
 */

import { formatCurrency } from '../utils/formatUtils';

/**
 * Chuẩn hóa văn bản để so sánh (chữ thường, bỏ dấu).
 */
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Xử lý truy vấn của người dùng và trả về đối tượng phản hồi.
 *
 * Định dạng phản hồi:
 * {
 *   id: string (unique id),
 *   type: 'text' | 'product_list' | 'stats' | 'order_list',
 *   content: string (nội dung văn bản),
 *   data: any (dữ liệu có cấu trúc tùy chọn để render UI)
 * }
 */
export const processQuery = (query, context) => {
  const { products, orders } = context;
  const rawQuery = query.toLowerCase();
  const cleanQuery = normalizeText(query);

  // 1. CHÀO HỎI (Greetings)
  if (cleanQuery.match(/^(xin chao|hi|hello|chao|lo|alo)/)) {
    return createResponse('text', 'Xin chào! Mình là trợ lý ảo của bạn. Mình có thể giúp gì cho việc quản lý cửa hàng hôm nay? (Ví dụ: "Doanh thu hôm nay", "Tìm bánh tráng", "Sản phẩm sắp hết")');
  }

  // 2. DOANH THU / THỐNG KÊ (Revenue / Stats)
  if (cleanQuery.includes('doanh thu') || cleanQuery.includes('tien ban')) {
    if (cleanQuery.includes('hom nay') || cleanQuery.includes('nay')) {
      const today = new Date().toLocaleDateString('en-CA');
      const todayOrders = orders.filter(o => o.date.startsWith(today) && o.status !== 'cancelled');
      const total = todayOrders.reduce((sum, o) => sum + o.total, 0);
      const count = todayOrders.length;

      return createResponse('stats', `Doanh thu hôm nay là ${formatCurrency(total)} từ ${count} đơn hàng.`, {
        label: 'Doanh thu hôm nay',
        value: total,
        subtext: `${count} đơn hàng`
      });
    }

    if (cleanQuery.includes('thang nay') || cleanQuery.includes('thang')) {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthOrders = orders.filter(o => o.date.startsWith(currentMonth) && o.status !== 'cancelled');
        const total = monthOrders.reduce((sum, o) => sum + o.total, 0);
        const count = monthOrders.length;

        return createResponse('stats', `Doanh thu tháng này là ${formatCurrency(total)} từ ${count} đơn hàng.`, {
          label: 'Doanh thu tháng này',
          value: total,
          subtext: `${count} đơn hàng`
        });
    }

    // Mặc định là tổng doanh thu
    const total = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
    return createResponse('stats', `Tổng doanh thu toàn thời gian là ${formatCurrency(total)}.`, {
        label: 'Tổng doanh thu',
        value: total,
        subtext: 'Toàn thời gian'
    });
  }

  // 3. TÌM KIẾM SẢN PHẨM (Product Search)
  if (cleanQuery.includes('tim') || cleanQuery.includes('gia') || cleanQuery.includes('xem') || cleanQuery.includes('con bao nhieu')) {
    // Trích xuất từ khóa: loại bỏ "tim", "gia cua", "san pham"
    const keyword = cleanQuery
      .replace(/(tim|gia cua|gia|xem|san pham|con bao nhieu|kiem tra)/g, '')
      .trim();

    if (keyword.length < 2) {
      return createResponse('text', 'Bạn muốn tìm sản phẩm gì? Hãy nhập tên cụ thể hơn nhé.');
    }

    const results = products.filter(p => normalizeText(p.name).includes(keyword));

    if (results.length === 0) {
      return createResponse('text', `Không tìm thấy sản phẩm nào khớp với từ khóa "${keyword}".`);
    } else if (results.length === 1) {
        const p = results[0];
        return createResponse('product_list', `Tìm thấy 1 sản phẩm: ${p.name}. Giá: ${formatCurrency(p.price)}. Tồn: ${p.stock}.`, [p]);
    } else {
        return createResponse('product_list', `Tìm thấy ${results.length} sản phẩm khớp với "${keyword}":`, results);
    }
  }

  // 4. SẮP HẾT HÀNG (Low Stock)
  if (cleanQuery.includes('sap het') || cleanQuery.includes('het hang')) {
    const lowStock = products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock);
    if (lowStock.length === 0) {
      return createResponse('text', 'Tuyệt vời! Hiện tại không có sản phẩm nào sắp hết hàng (dưới 5).');
    }
    return createResponse('product_list', `Có ${lowStock.length} sản phẩm sắp hết hàng cần nhập thêm:`, lowStock);
  }

  // 5. BÁN CHẠY (Top Selling) - Logic đơn giản
  if (cleanQuery.includes('ban chay') || cleanQuery.includes('hot')) {
     // Heuristic đơn giản: Đếm số lần xuất hiện trong đơn hàng
     const productCounts = {};
     orders.forEach(order => {
        if(order.status === 'cancelled') return;
        order.items.forEach(item => {
            productCounts[item.id] = (productCounts[item.id] || 0) + (item.quantity || 1);
        });
     });

     const sortedIds = Object.keys(productCounts).sort((a, b) => productCounts[b] - productCounts[a]).slice(0, 5);
     const topProducts = sortedIds.map(id => products.find(p => String(p.id) === String(id))).filter(Boolean);

     if(topProducts.length === 0) return createResponse('text', 'Chưa có đủ dữ liệu đơn hàng để xác định sản phẩm bán chạy.');

     return createResponse('product_list', 'Đây là top 5 sản phẩm bán chạy nhất dựa trên lịch sử đơn hàng:', topProducts);
  }

  // 6. KIỂM TRA ĐƠN HÀNG (Order Check)
  if(cleanQuery.includes('don hang') || cleanQuery.includes('don moi')) {
      const recentOrders = [...orders].reverse().slice(0, 5);
      return createResponse('order_list', 'Đây là 5 đơn hàng gần nhất:', recentOrders);
  }

  // FALLBACK (Dự phòng)
  return createResponse('text', 'Xin lỗi, mình chưa hiểu ý bạn. Bạn có thể hỏi về "Doanh thu", "Tìm sản phẩm", hoặc "Hàng sắp hết".');
};

/**
 * Hàm hỗ trợ tạo đối tượng phản hồi có cấu trúc
 */
const createResponse = (type, content, data = null) => {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    sender: 'assistant',
    type,
    content,
    data
  };
};

// ------------------------------------------------------------------------------------------------
// HƯỚNG DẪN TÍCH HỢP GEMINI API (Hoặc AI khác)
// ------------------------------------------------------------------------------------------------
// Nếu bạn có API Key của Gemini (Google AI Studio) hoặc OpenAI, bạn có thể thay thế logic ở trên
// bằng hàm gọi API thực tế. Dưới đây là ví dụ mẫu để gọi Gemini 1.5 Flash:
//
// 1. Cài đặt Google Generative AI SDK (hoặc dùng fetch): npm install @google/generative-ai
// 2. Lấy API Key từ https://aistudio.google.com/
//
/*
export const processQueryWithGemini = async (query, context) => {
    // Lấy ngữ cảnh dữ liệu (lưu ý: đừng gửi quá nhiều dữ liệu cá nhân)
    const productList = context.products.map(p => `${p.name} (Giá: ${p.price}, Tồn: ${p.stock})`).join('\n');

    // Prompt (Lời nhắc)
    const prompt = `
      Bạn là trợ lý ảo của cửa hàng tạp hóa. Dưới đây là danh sách sản phẩm hiện có:
      ${productList}

      Người dùng hỏi: "${query}"

      Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt. Nếu họ hỏi về sản phẩm, hãy cung cấp giá và tồn kho.
    `;

    try {
        // Gọi API (Ví dụ dùng fetch trực tiếp để không cần cài SDK)
        const apiKey = "YOUR_GEMINI_API_KEY_HERE";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;

        return createResponse('text', textResponse);
    } catch (error) {
        console.error("Gemini API Error:", error);
        return createResponse('text', "Xin lỗi, kết nối đến AI bị gián đoạn.");
    }
};
*/
