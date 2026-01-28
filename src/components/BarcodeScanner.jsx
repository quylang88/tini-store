import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Html5QrcodeScanner } from "html5-qrcode";

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        scanner
          .clear()
          .catch((error) => console.error("Failed to clear scanner", error));
      },
      () => {
        // Bỏ qua lỗi
      }
    );

    return () => {
      scanner
        .clear()
        .catch((error) => console.error("Failed to clear scanner", error));
    };
  }, [onScanSuccess]);

  return createPortal(
    // Nâng z-index lên cực cao (z-[9999]) để đảm bảo che phủ hoàn toàn mọi modal (z-90) và TabBar (z-50).
    // Chuyển tone màu sang Rose theo yêu cầu.
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 modal-overlay-animate">
      {/* Khung quét dùng animation chung để đồng bộ cảm giác mở modal. */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-4 modal-panel-animate">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-rose-900">Quét mã vạch</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-rose-700 active:text-rose-900 text-sm font-semibold"
          >
            Đóng
          </button>
        </div>
        <div
          id="reader"
          className="w-full rounded-lg overflow-hidden bg-rose-50"
        />
        <p className="text-xs text-rose-700 mt-3 text-center">
          Đưa mã vạch vào khung để tự động nhận diện.
        </p>
      </div>
    </div>,
    document.body
  );
};

export default BarcodeScanner;
