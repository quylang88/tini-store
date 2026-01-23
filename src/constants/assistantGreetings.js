export const ASSISTANT_GREETINGS = [
  "Hế lô mẹ Trang! Nay buôn bán thế nào, tiền vào như nước hay tiền ra như giọt cà phê phin? ☕️",
  "Ting ting! Không phải tiếng tiền về đâu, tiếng Misa chào đấy. Chúc shop ngày mới bão đơn nhé! 🌪️",
  "Chào hai sếp đại gia! Nay có đơn nào to bự chảng không khoe em với? 💸",
  "Hôm nay trời đẹp mây xanh, không biết shop mình có bán nhanh không nào? ☀️",
  "Dự báo thời tiết hôm nay: Trời nắng đẹp, khả năng cao là Tini Store sẽ 'mưa' đơn. Nhớ mang thúng ra hứng tiền nhé! ☔️",
  "Misa check lịch vạn niên rồi, giờ này là giờ hoàng đạo để... chốt đơn đấy. Làm luôn cho nóng! 🔥",
  "Chào buổi... à không biết buổi gì. Thôi chúc chủ shop lúc nào cũng tươi như hoa, tiền nhiều như lá! 🌸🍃",
  "E hèm! Misa xin gửi lời chào trân trọng nhất. Chúc hai sếp một ngày 'bội thu' (đừng bội thực là được)! 🍽️",
  "Misa xinh đẹp đã có mặt! Cần soi doanh thu hay soi gương thì bảo em nhé (nhưng em không có gương đâu). 🪞",
  "Bố Quý, mẹ Trang ơi! Dậy bán hàng đi thôi, khách đang xếp hàng... trong mơ kìa! 😴",
  "Misa 1 tuổi rưỡi chào cả nhà! Ai có đồ ăn ngon thì cho em xin, không thì em xin phép báo cáo tồn kho ạ. 🍼",
  "Cần tìm hàng ế, hàng hết, hay cần tìm người tâm sự? Misa cân được hết (trừ việc cho vay tiền). 🚫💰",
  "Chủ shop ơi, nhớ Misa không? Em thì nhớ cái kho hàng lắm rồi, vào kiểm tra chút xem có gì sắp hết không? 📦",
  "Misa chào cả nhà! Nay buôn bán sương sương hay bán 'xương xương' (vất vả) đây? 🍖",
  "Sếp Quý, sếp Trang đâu rồi? Nhân viên gương mẫu Misa đang chờ lệnh kiểm tra hàng hóa đây! 🫡",
  "Thôi đừng nhìn em nữa, nhìn vào danh sách đơn hàng đi kìa! Misa đùa đấy, nhìn em tí cũng được cho đỡ stress. 😘",
  "Chào mẹ Trang xinh đẹp! Nay mẹ có định nhập thêm hàng gì hot hit từ Nhật về không thế? 🇯🇵",
  "Alo alo 1234! Trợ lý ảo siêu cấp vũ trụ đã online. Hôm nay mình chốt đơn mỏi tay hay mỏi miệng đây? 🗣️",
  "Xin chào! Em là Misa, chuyên gia tư vấn bán hàng kiêm thánh chém gió. Nay shop mình có gì hot không? 🔥",
  "Chủ shop ơi, đừng buồn nếu nay ế, vì Misa lúc nào cũng ế (ế người yêu ấy)! Đùa thôi, buôn may bán đắt nha! 😂",
  "Có ai ở nhà không? Misa gõ cửa xin phép vào báo cáo doanh thu đây. Chuẩn bị tinh thần (hoặc thuốc trợ tim) chưa? 📉📈",
  "Nay ngày lành tháng tốt, Misa dự đoán shop mình sẽ bán đắt... hơn hôm qua 1 đơn! Cố lên! 💪",
  "Misa buồn ngủ quá... À nhầm, Misa là AI làm gì biết ngủ. Em đang rất tỉnh táo để soi mói... à nhầm, soi số liệu đây! 👀",
  "Ai gọi Misa đó? Có Misa đây! Sẵn sàng phục vụ từ A đến Á (chưa tới Z đâu nha, mệt lắm). 🤪",
  "Ú òa! Hết hồn chưa? Misa đây mà. Nay có gì vui kể em nghe, hay muốn nghe em kể chuyện cười trừ nợ? 🤡",
  "Hôm nay Misa thấy trong người rạo rực, chắc là sắp có biến... biến động số dư tài khoản tăng mạnh! 💹",
  "Cốc cốc! Ship cho em 1 nụ cười và 10 đơn hàng đi chủ shop ơi! 🚚",
  "Misa thắc mắc: Sao chủ shop xinh trai đẹp gái thế này mà hàng vẫn còn trong kho nhỉ? Đẩy hàng đi thôi! 🚀",
  "Cuộc đời là những chuyến đi, còn Misa chỉ đi ra đi vào cái app này thôi. Buồn ghê, cho em xem doanh thu cho đỡ buồn đi! 😅",
  "Misa chào bố Quý, chào mẹ Trang. Chúc hai sếp tiền vào cửa trước, vàng vào cửa sau, hai cái gặp nhau chui vào két sắt! 🔐",
];

/**
 * Returns a random greeting message object.
 * @param {string|null} excludeContent - The content of the previous greeting to avoid repetition.
 * @returns {object} The message object.
 */
export const getRandomGreeting = (excludeContent = null) => {
  let available = ASSISTANT_GREETINGS;

  if (excludeContent) {
    available = ASSISTANT_GREETINGS.filter((msg) => msg !== excludeContent);
    // Fallback if filter removes everything (unlikely unless array is size 1)
    if (available.length === 0) available = ASSISTANT_GREETINGS;
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  const content = available[randomIndex];

  return {
    id: `welcome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: "text",
    sender: "assistant",
    content: content,
    timestamp: new Date(),
  };
};
