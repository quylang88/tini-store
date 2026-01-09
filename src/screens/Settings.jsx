import React from 'react';
import { Download, Upload } from 'lucide-react';

const Settings = ({ products, orders, setProducts, setOrders }) => {
  // Backup Data
  const exportData = () => {
    const data = JSON.stringify({ products, orders });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_shop_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // Restore Data
  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.products && data.orders) {
          if (window.confirm('Hành động này sẽ ghi đè dữ liệu hiện tại. Bạn có chắc không?')) {
            setProducts(data.products);
            setOrders(data.orders);
            alert('Khôi phục dữ liệu thành công!');
          }
        }
      } catch (err) {
        alert('File lỗi, không đọc được!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Cài đặt & Dữ liệu</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 font-bold text-gray-700">Sao lưu & Khôi phục</div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500">Vì dùng bản Offline, hãy thường xuyên tải file Backup về để tránh mất dữ liệu khi hỏng điện thoại.</p>

          <button onClick={exportData} className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-100 transition">
            <Download size={18} /> Tải Dữ Liệu Về Máy (Backup)
          </button>

          <div className="relative">
            <input type="file" onChange={importData} className="absolute inset-0 opacity-0 cursor-pointer" accept=".json" />
            <button className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
              <Upload size={18} /> Khôi Phục Dữ Liệu (Restore)
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400">
        Phiên bản Offline v1.0 <br />
        Dữ liệu lưu tại LocalStorage
      </div>
    </div>
  )
}

export default Settings;