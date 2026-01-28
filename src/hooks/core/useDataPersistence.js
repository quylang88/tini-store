import { useEffect, useRef } from "react";

/**
 * Hook để lưu trữ dữ liệu vào storage một cách hiệu quả sử dụng chiến lược cập nhật hàng loạt (batch update).
 * Nó theo dõi các thay đổi (Thêm, Sửa, Xóa) bằng cách so sánh dữ liệu hiện tại
 * với trạng thái trước đó sử dụng reference map.
 *
 * @param {Array} data - Danh sách dữ liệu hiện tại (ví dụ: products, orders).
 * @param {Function} saveBatchFn - Hàm lưu trữ nhận vào object chứa các thay đổi: { added, updated, deleted }.
 * @param {boolean} isLoaded - Cờ đánh dấu dữ liệu ban đầu đã tải xong chưa.
 * @param {string} idKey - Tên trường định danh duy nhất của items (mặc định: "id").
 */
const useDataPersistence = (data, saveBatchFn, isLoaded, idKey = "id") => {
  const previousDataMapRef = useRef(new Map());
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Nếu chưa load xong dữ liệu thì không làm gì (và reset cờ init nếu vừa logout)
    if (!isLoaded) {
      hasInitializedRef.current = false;
      previousDataMapRef.current.clear();
      return;
    }

    // Chuyển đổi danh sách hiện tại thành Map để tra cứu O(1)
    const currentDataMap = new Map();
    data.forEach((item) => {
      if (item && item[idKey]) {
        currentDataMap.set(item[idKey], item);
      }
    });

    // Nếu đây là lần render đầu tiên sau khi load dữ liệu, chỉ đồng bộ reference chứ không lưu.
    // Tối ưu này ngăn chặn việc "Ghi ngay sau khi Đọc" (Write-After-Read) thừa thãi lúc khởi tạo.
    if (!hasInitializedRef.current) {
      previousDataMapRef.current = currentDataMap;
      hasInitializedRef.current = true;
      return;
    }

    // Xác định các thay đổi
    const added = [];
    const updated = [];
    const deleted = [];
    const previousDataMap = previousDataMapRef.current;

    // 1. Tìm items Thêm mới và Cập nhật
    for (const [id, item] of currentDataMap.entries()) {
      if (!previousDataMap.has(id)) {
        added.push(item);
      } else {
        const prevItem = previousDataMap.get(id);
        // Dựa vào so sánh tham chiếu (referential equality) để phát hiện thay đổi.
        // Trong React, khi state update thì object reference thường thay đổi.
        if (prevItem !== item) {
          updated.push(item);
        }
      }
    }

    // 2. Tìm items Đã xóa
    for (const id of previousDataMap.keys()) {
      if (!currentDataMap.has(id)) {
        deleted.push(id);
      }
    }

    // 3. Thực thi lưu batch nếu có thay đổi
    if (added.length > 0 || updated.length > 0 || deleted.length > 0) {
      saveBatchFn({ added, updated, deleted });
    }

    // 4. Cập nhật reference cho vòng lặp tiếp theo
    previousDataMapRef.current = currentDataMap;

  }, [data, isLoaded, saveBatchFn, idKey]);
};

export default useDataPersistence;
