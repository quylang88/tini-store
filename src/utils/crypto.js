import storageService from "../services/storageService";

const ALGO_NAME = "AES-GCM";

// Sinh hoặc lấy key
const getOrGenerateKey = async () => {
  try {
    let keyData = await storageService.getCryptoKey();

    if (!keyData) {
      // Nếu chưa có, tạo một key mới (AES-GCM, 256 bits, không extractable)
      const newKey = await window.crypto.subtle.generateKey(
        {
          name: ALGO_NAME,
          length: 256,
        },
        false, // Không cho phép export (extractable = false) để tăng bảo mật
        ["encrypt", "decrypt"],
      );

      // Do key là non-extractable, ta không thể export nó ra Raw hay JWK để lưu IndexedDB dễ dàng.
      // Tuy nhiên, IndexedDB hỗ trợ lưu trực tiếp đối tượng CryptoKey bằng Structured Clone Algorithm.
      await storageService.saveCryptoKey(newKey);
      return newKey;
    }

    return keyData;
  } catch (err) {
    console.error("Failed to get or generate crypto key:", err);
    return null;
  }
};

export const encryptPassword = async (password) => {
  if (!password) return null;
  try {
    const key = await getOrGenerateKey();
    if (!key) return null;

    const encoder = new TextEncoder();
    const encoded = encoder.encode(password);

    // GCM yêu cầu IV (Initialization Vector) 12 bytes
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: ALGO_NAME,
        iv: iv,
      },
      key,
      encoded,
    );

    // Gộp IV và CipherText lại với nhau (để dùng khi decrypt)
    const combinedBuffer = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combinedBuffer.set(iv, 0);
    combinedBuffer.set(new Uint8Array(cipherBuffer), iv.length);

    // Chuyển sang Base64 để lưu vào IndexedDB dưới dạng chuỗi cho an toàn
    const base64String = btoa(String.fromCharCode(...combinedBuffer));
    return base64String;
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
};

export const decryptPassword = async (encryptedBase64) => {
  if (!encryptedBase64) return null;
  try {
    const key = await getOrGenerateKey();
    if (!key) return null;

    // Chuyển từ Base64 về Uint8Array
    const binaryString = atob(encryptedBase64);
    const combinedBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combinedBuffer[i] = binaryString.charCodeAt(i);
    }

    // Tách IV (12 bytes đầu) và CipherText
    const iv = combinedBuffer.slice(0, 12);
    const cipherBuffer = combinedBuffer.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: ALGO_NAME,
        iv: iv,
      },
      key,
      cipherBuffer,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};
