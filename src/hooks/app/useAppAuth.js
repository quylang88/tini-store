import { useState, useCallback } from "react";

const useAppAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("tini_auth") === "true";
  });

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
    sessionStorage.setItem("tini_auth", "true");
  }, []);

  const handleLogout = useCallback(() => {
    setLogoutModalOpen(true);
  }, []);

  const closeLogoutModal = useCallback(() => {
    setLogoutModalOpen(false);
  }, []);

  // confirmLogout xử lý việc thay đổi trạng thái xác thực.
  // Component sử dụng hook này cần tự xử lý việc dọn dẹp dữ liệu nếu cần.
  const confirmLogout = useCallback((cleanupCallback) => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("tini_auth");
    setLogoutModalOpen(false);
    if (cleanupCallback && typeof cleanupCallback === "function") {
      cleanupCallback();
    }
  }, []);

  return {
    isAuthenticated,
    setIsAuthenticated, // Expose trong trường hợp cần truy cập trực tiếp
    logoutModalOpen,
    handleLoginSuccess,
    handleLogout,
    closeLogoutModal,
    confirmLogout,
  };
};

export default useAppAuth;
