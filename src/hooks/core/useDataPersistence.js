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
  // Cache để lưu trữ Map hiện tại, tránh tạo lại Map O(N) nếu data/idKey không đổi
  const currentDataMapCacheRef = useRef({ data: null, idKey: null, map: null });

  useEffect(() => {
    // Nếu chưa load xong dữ liệu thì không làm gì (và reset cờ init nếu vừa logout)
    if (!isLoaded) {
      hasInitializedRef.current = false;
      // Khởi tạo lại Map mới thay vì clear() để tránh ảnh hưởng đến cache nếu đang dùng chung tham chiếu
      previousDataMapRef.current = new Map();
      return;
    }

    // Tối ưu hóa: Tạo Map một cách lười biếng (lazy) và cache lại.
    // Việc này giữ logic O(N) trong useEffect thay vì useMemo để không ảnh hưởng render phase.
    if (
      currentDataMapCacheRef.current.data !== data ||
      currentDataMapCacheRef.current.idKey !== idKey
    ) {
      const map = new Map();
      for (const item of data) {
        if (item && item[idKey]) {
          map.set(item[idKey], item);
        }
      }
      currentDataMapCacheRef.current = { data, idKey, map };
    }

    const currentDataMap = currentDataMapCacheRef.current.map;

    // Tối ưu hóa: Nếu currentDataMap giống hệt previousDataMap (theo tham chiếu),
    // và chúng ta đã khởi tạo xong, thì có thể bỏ qua việc so sánh.
    if (
      currentDataMap === previousDataMapRef.current &&
      hasInitializedRef.current
    ) {
      return;
    }

    // Nếu đây là lần render đầu tiên sau khi load dữ liệu, chỉ đồng bộ reference chứ không lưu.
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
