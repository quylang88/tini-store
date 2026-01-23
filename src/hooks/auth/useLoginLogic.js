import { useState } from "react";

const getSavedCredentials = () => {
  try {
    const savedCreds = localStorage.getItem("tini_saved_creds");
    if (savedCreds) {
      return JSON.parse(savedCreds);
    }
  } catch {
    localStorage.removeItem("tini_saved_creds");
  }
  return null;
};

const useLoginLogic = ({ onLogin }) => {
  const [username, setUsername] = useState(() => {
    const creds = getSavedCredentials();
    return creds?.user || "";
  });

  const [password, setPassword] = useState(() => {
    const creds = getSavedCredentials();
    return creds?.pass || "";
  });

  const [remember, setRemember] = useState(() => {
    const creds = getSavedCredentials();
    return !!creds;
  });

  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Kiểm tra tài khoản cứng
    if (username === "tinyshop" && password === "Misa@2024") {
      // Xử lý Ghi nhớ Tài khoản/Mật khẩu
      if (remember) {
        // Nếu chọn Ghi nhớ: Lưu vào bộ nhớ máy
        localStorage.setItem(
          "tini_saved_creds",
          JSON.stringify({ user: username, pass: password }),
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
