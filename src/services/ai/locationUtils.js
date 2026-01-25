/**
 * locationUtils.js
 * Các hàm tiện ích hỗ trợ định vị và reverse geocoding.
 */

/**
 * Lấy vị trí hiện tại của người dùng thông qua Browser API.
 * Trả về chuỗi "latitude, longitude" hoặc null nếu thất bại/timeout.
 */
export const getCurrentLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude}, ${pos.coords.longitude}`),
      () => resolve(null),
      { timeout: 10000 },
    );
  });
};

/**
 * Chuyển đổi tọa độ sang tên địa danh (Reverse Geocoding)
 * Sử dụng OpenStreetMap Nominatim API (Miễn phí, không cần Key)
 */
export const getAddressFromCoordinates = async (coordsString) => {
  if (!coordsString) return null;
  try {
    const [lat, lon] = coordsString.split(",").map((s) => s.trim());
    if (!lat || !lon) return null;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "vi-VN", // Yêu cầu trả về tiếng Việt nếu có
        },
      },
    );

    const data = await response.json();
    if (data && data.address) {
      // Ưu tiên lấy theo thứ tự: Thành phố -> Thị xã -> Quận/Huyện -> Làng
      const city =
        data.address.city ||
        data.address.town ||
        data.address.district ||
        data.address.county ||
        data.address.village ||
        "";
      const country = data.address.country || "";
      const addressName = [city, country].filter(Boolean).join(", ");
      return addressName; // Ví dụ: "Thành phố Saitama, Nhật Bản"
    }
    return null;
  } catch (error) {
    console.warn("Lỗi Reverse Geocoding:", error);
    return null;
  }
};
