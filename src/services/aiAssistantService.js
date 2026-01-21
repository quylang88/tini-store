/**
 * aiAssistantService.js
 *
 * This service acts as the "Brain" for the local AI Assistant.
 * It parses natural language user queries using Regex and heuristic logic
 * to query the local application state (products, orders) and return
 * structured responses.
 */

import { formatCurrency } from '../utils/formatUtils';

/**
 * Standardizes the text for comparison (lowercase, remove accents).
 */
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Processes a user query and returns a response object.
 *
 * Response Format:
 * {
 *   id: string (unique id),
 *   type: 'text' | 'product_list' | 'stats' | 'order_list',
 *   content: string (text message),
 *   data: any (optional structured data for UI rendering)
 * }
 */
export const processQuery = (query, context) => {
  const { products, orders } = context;
  const rawQuery = query.toLowerCase();
  const cleanQuery = normalizeText(query);

  // 1. GREETINGS
  if (cleanQuery.match(/^(xin chao|hi|hello|chao|lo|alo)/)) {
    return createResponse('text', 'Xin chào! Mình là trợ lý ảo của bạn. Mình có thể giúp gì cho việc quản lý cửa hàng hôm nay? (Ví dụ: "Doanh thu hôm nay", "Tìm bánh tráng", "Sản phẩm sắp hết")');
  }

  // 2. REVENUE / STATS (Doanh thu)
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

    // Default to total revenue
    const total = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
    return createResponse('stats', `Tổng doanh thu toàn thời gian là ${formatCurrency(total)}.`, {
        label: 'Tổng doanh thu',
        value: total,
        subtext: 'Toàn thời gian'
    });
  }

  // 3. PRODUCT SEARCH (Tìm, Giá, Kho)
  if (cleanQuery.includes('tim') || cleanQuery.includes('gia') || cleanQuery.includes('xem') || cleanQuery.includes('con bao nhieu')) {
    // Extract keywords: remove "tim", "gia cua", "san pham"
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

  // 4. LOW STOCK (Sắp hết)
  if (cleanQuery.includes('sap het') || cleanQuery.includes('het hang')) {
    const lowStock = products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock);
    if (lowStock.length === 0) {
      return createResponse('text', 'Tuyệt vời! Hiện tại không có sản phẩm nào sắp hết hàng (dưới 5).');
    }
    return createResponse('product_list', `Có ${lowStock.length} sản phẩm sắp hết hàng cần nhập thêm:`, lowStock);
  }

  // 5. TOP SELLING (Bán chạy) - Simplified logic
  if (cleanQuery.includes('ban chay') || cleanQuery.includes('hot')) {
     // Simple heuristic: Count occurrences in orders (This is expensive in loop, but okay for local 'AI')
     // For efficiency in this "Mock AI", we might just return random or skip complex calculation if datasets are huge.
     // But let's try a simple aggregation.

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

  // 6. ORDER CHECK (Đơn hàng)
  if(cleanQuery.includes('don hang') || cleanQuery.includes('don moi')) {
      const recentOrders = [...orders].reverse().slice(0, 5);
      return createResponse('order_list', 'Đây là 5 đơn hàng gần nhất:', recentOrders);
  }

  // FALLBACK
  return createResponse('text', 'Xin lỗi, mình chưa hiểu ý bạn. Bạn có thể hỏi về "Doanh thu", "Tìm sản phẩm", hoặc "Hàng sắp hết".');
};

/**
 * Helper to create a structured response object
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
