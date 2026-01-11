import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, CheckSquare } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  // 1. Khi mở màn hình Login -> Kiểm tra xem có lưu mật khẩu không
  useEffect(() => {
    const savedCreds = localStorage.getItem('tini_saved_creds');
    if (savedCreds) {
      try {
        const { user, pass } = JSON.parse(savedCreds);
        setUsername(user);
        setPassword(pass);
        setRemember(true); // Tự động tích vào ô ghi nhớ
      } catch (e) {
        localStorage.removeItem('tini_saved_creds');
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Kiểm tra tài khoản cứng
    if (username === 'tiny-shop' && password === 'Believe93') {
      // 2. Xử lý Ghi nhớ Tài khoản/Mật khẩu
      if (remember) {
        // Nếu chọn Ghi nhớ: Lưu vào bộ nhớ máy
        localStorage.setItem('tini_saved_creds', JSON.stringify({ user: username, pass: password }));
      } else {
        // Nếu không chọn: Xóa khỏi bộ nhớ máy
        localStorage.removeItem('tini_saved_creds');
      }

      onLogin(); // Báo cho App biết đã đăng nhập thành công
    } else {
      setError('Sai tên đăng nhập hoặc mật khẩu!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white/90 w-full max-w-sm rounded-2xl shadow-xl backdrop-blur overflow-hidden animate-fade-in border border-white/70">
        <div className="h-32 overflow-hidden">
          <img
            src="/tiny-shop.png"
            alt="Tiny Shop"
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center border border-red-100 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-amber-700 uppercase mb-2 ml-1">Tài khoản</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-amber-500">
                  <User size={20} />
                </span>
                <input
                  type="text"
                  className="w-full bg-white/90 border border-rose-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition text-amber-900"
                  placeholder="Nhập tài khoản..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-700 uppercase mb-2 ml-1">Mật khẩu</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-amber-500">
                  <Lock size={20} />
                </span>
                <input
                  type="password"
                  className="w-full bg-white/90 border border-rose-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition text-amber-900"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Checkbox Ghi nhớ thông tin */}
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => setRemember(!remember)}
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${remember ? 'bg-rose-500 border-rose-500' : 'bg-white border-rose-200 group-hover:border-rose-400'}`}>
                {remember && <CheckSquare size={14} className="text-white" />}
              </div>
              <span className="text-sm text-amber-700 select-none">Lưu thông tin đăng nhập</span>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-rose-200 active:scale-95 transition flex items-center justify-center gap-2 group"
            >
              Đăng Nhập
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-4 text-center text-xs text-amber-500 border-t border-gray-100">
          © 2026 Tiny Shop. All rights reserved.<br />
          Phát triển bởi Quý Lăng
        </div>
      </div>
    </div>
  );
};

export default Login;
