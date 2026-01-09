import React, { useState, useEffect } from 'react';
import { Store, Lock, User, ArrowRight, CheckSquare } from 'lucide-react';

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
    if (username === 'tini-shop' && password === 'Believe93') {
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10 transform -skew-y-6 origin-top-left"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
              <Store size={32} className="text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Tini Beauty</h1>
            <p className="text-indigo-100 text-sm mt-1">Hệ thống quản lý</p>
          </div>
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Tài khoản</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <User size={20} />
                </span>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  placeholder="Nhập tài khoản..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Mật khẩu</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <Lock size={20} />
                </span>
                <input 
                  type="password" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
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
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${remember ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300 group-hover:border-indigo-400'}`}>
                {remember && <CheckSquare size={14} className="text-white" />}
              </div>
              <span className="text-sm text-gray-600 select-none">Lưu thông tin đăng nhập</span>
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 active:scale-95 transition flex items-center justify-center gap-2 group"
            >
              Đăng Nhập
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
            </button>
          </form>
        </div>
        
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
          © 2026 Tini Beauty
        </div>
      </div>
    </div>
  );
};

export default Login;