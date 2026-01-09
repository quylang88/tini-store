import React from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Image as ImageIcon } from 'lucide-react';

const Dashboard = ({ products, orders }) => {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;

  // Logic tìm top 3 sản phẩm bán chạy
  const topProducts = products.map(p => {
    const sold = orders.reduce((acc, order) => {
      const item = order.items.find(i => i.productId === p.id);
      return acc + (item ? item.quantity : 0);
    }, 0);
    return { ...p, sold };
  }).sort((a, b) => b.sold - a.sold).slice(0, 3);

  return (
    <div className="p-4 space-y-4 pb-24 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Tổng Quan Shop</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200">
          <div className="flex items-center gap-2 opacity-90 mb-2">
            <DollarSign size={18} />
            <span className="text-xs font-bold uppercase">Doanh thu</span>
          </div>
          <div className="text-xl font-bold">{totalRevenue.toLocaleString()}đ</div>
        </div>

        <div className="bg-white text-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <ShoppingCart size={18} />
            <span className="text-xs font-bold uppercase">Đơn hàng</span>
          </div>
          <div className="text-xl font-bold">{totalOrders}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">Top bán chạy</h3>
        <div className="space-y-3">
          {topProducts.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="font-bold text-gray-300 w-4">#{idx + 1}</div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={16} /></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-800">{p.name}</div>
                <div className="text-xs text-gray-500">Đã bán: {p.sold}</div>
              </div>
            </div>
          ))}
          {topProducts.length === 0 && <div className="text-center text-gray-400 text-sm">Chưa có dữ liệu bán hàng</div>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;