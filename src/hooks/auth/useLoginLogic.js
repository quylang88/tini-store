import { useState, useEffect } from "react";
import storageService from "../../services/storageService";

const useLoginLogic = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingCreds, setIsLoadingCreds] = useState(true);

  // Load saved credentials from IndexedDB on mount
  useEffect(() => {
    const loadCreds = async () => {
      try {
        const creds = await storageService.getAuthCreds();
        if (creds) {
          setUsername(creds.user || "");
          setPassword(creds.pass || "");
          setRemember(true);
        }
      } catch (err) {
        console.error("Failed to load saved credentials:", err);
      } finally {
        setIsLoadingCreds(false);
      }
    };
    loadCreds();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra tài khoản (Environment Variables)
    const validUser = import.meta.env.VITE_APP_USERNAME;
    const validPass = import.meta.env.VITE_APP_PASSWORD;

    if (
      validUser &&
      validPass &&
      username === validUser &&
      password === validPass
    ) {
      // Xử lý Ghi nhớ Tài khoản/Mật khẩu
      if (remember) {
        // Nếu chọn Ghi nhớ: Lưu vào IndexedDB
        await storageService.saveAuthCreds({ user: username, pass: password });
      } else {
        // Nếu không chọn: Xóa khỏi IndexedDB
        await storageService.clearAuthCreds();
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
    isLoadingCreds,
  };
};

export default useLoginLogic;
