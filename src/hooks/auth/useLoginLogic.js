import { useState, useEffect } from "react";
import storageService from "../../services/storageService";
import { encryptPassword, decryptPassword } from "../../utils/crypto";

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
          if (creds.pass) {
            const decryptedPass = await decryptPassword(creds.pass);
            setPassword(decryptedPass || "");
          }
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

  const hashInputPassword = async (pwd) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra tài khoản
    const validUser = __APP_USERNAME__;
    const validPassHash = __APP_PASSWORD_HASH__;
    const inputHash = await hashInputPassword(password);

    if (
      validUser &&
      validPassHash &&
      username === validUser &&
      inputHash === validPassHash
    ) {
      // Xử lý Ghi nhớ Tài khoản/Mật khẩu
      if (remember) {
        // Mã hóa password trước khi lưu
        const encryptedPass = await encryptPassword(password);
        await storageService.saveAuthCreds({ user: username, pass: encryptedPass });
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
