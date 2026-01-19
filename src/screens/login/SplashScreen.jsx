import React from "react";
import { Wifi } from "lucide-react";
import NetworkWarning from "./NetworkWarning";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const SplashScreen = ({ showWarning, onConfirm }) => {
  const handleConfirm = () => {
    sessionStorage.setItem("offline_dismissed", "true");
    onConfirm();
  };

  if (showWarning) {
    return (
      <NetworkWarning
        onConfirm={handleConfirm}
        title="Kết nối mạng không ổn định"
        description="Vui lòng kiểm tra đường truyền internet. Ứng dụng sẽ tự động kết nối lại khi có mạng."
        Icon={Wifi}
      />
    );
  }

  return (
    <div className="fixed top-0 left-0 h-[100dvh] w-screen z-50 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-rose-50 to-amber-100 p-6 text-center overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-200 rounded-full blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-rose-200 rounded-full blur-3xl opacity-50 animate-pulse delay-700"></div>

      {/* --- TRẠNG THÁI LOADING --- */}
      <LoadingSpinner />
    </div>
  );
};

export default SplashScreen;
