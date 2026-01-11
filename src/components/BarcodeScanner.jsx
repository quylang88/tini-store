import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render((decodedText) => {
      onScanSuccess(decodedText);
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    }, () => {
      // Bỏ qua lỗi
    });

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [onScanSuccess]);

  return (
    // Nâng z-index để khung quét luôn nổi trên modal thêm sản phẩm.
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">Quét mã vạch</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm font-semibold"
          >
            Đóng
          </button>
        </div>
        <div id="reader" className="w-full rounded-lg overflow-hidden bg-black/5" />
        <p className="text-xs text-gray-500 mt-3 text-center">
          Đưa mã vạch vào khung để tự động nhận diện.
        </p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
