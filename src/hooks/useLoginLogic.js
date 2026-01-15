import { useEffect, useState } from "react";

const useLoginLogic = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  // Khi mở màn hình Login -> Kiểm tra xem có lưu mật khẩu không
  useEffect(() => {
    const savedCreds = localStorage.getItem("tini_saved_creds");
    if (savedCreds) {
      try {
        const { user, pass } = JSON.parse(savedCreds);
        setUsername(user);
        setPassword(pass);
        setRemember(true); // Tự động tích vào ô ghi nhớ
      } catch (e) {
        localStorage.removeItem("tini_saved_creds");
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Kiểm tra tài khoản cứng
    if (username === "tiny-shop" && password === "Believe93") {
      // Xử lý Ghi nhớ Tài khoản/Mật khẩu
      if (remember) {
        // Nếu chọn Ghi nhớ: Lưu vào bộ nhớ máy
        localStorage.setItem(
          "tini_saved_creds",
          JSON.stringify({ user: username, pass: password })
        );
      } else {
        // Nếu không chọn: Xóa khỏi bộ nhớ máy
        localStorage.removeItem("tini_saved_creds");
      }

      onLogin(); // Báo cho App biết đã đăng nhập thành công
    } else {
      setError("Sai tên đăng nhập hoặc mật khẩu!");
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    remember,
    setRemember,
    error,
    handleSubmit,
  };
};

export default useLoginLogic;
