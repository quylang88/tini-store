import { getModeConfig, PROVIDERS } from "./ai/config";
import { callGeminiAPI, searchWeb } from "./ai/providers";
import { normalizeUsageInstructions } from "../utils/inventory/usageInstructions";

const DEFAULT_MEDICINE_NOTE = "Đọc kỹ hướng dẫn trên bao bì; không tự tăng liều";
const inFlightRequests = new Map();
const INVALID_GEMINI_RESPONSE = "INVALID_GEMINI_RESPONSE";

export const cleanProductName = (name = "") => {
  if (typeof name !== "string") return "";
  return name
    .replace(/\b\d+\s*(?:ml|g|kg|mg|l|viên|gói|hũ|tuýp|chai|miếng|bịch)\b/giu, "")
    .replace(/\b(?:20\d{2})\b/gu, "")
    .replace(/\([^)]*\)/gu, "")
    .replace(/\[[^\]]*\]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
};

const buildCategorySearchQuery = ({ name, category, productType, language }) => {
  const cleanName = name.replace(/"/g, "");
  
  if (language === "ja") {
    switch (productType) {
      case "MEDICINE":
        return `「${cleanName}」 公式 使い方 使用方法 用量 用法 飲み方`;
      case "COSMETIC":
        return `「${cleanName}」 公式 使い方 使用方法 効果 順番`;
      case "HOUSEHOLD":
        return `「${cleanName}」 公式 使い方 使用方法 用途`;
      default:
        return `「${cleanName}」 公式 使い方 使用方法 効果`;
    }
  }

  // Tiếng Việt
  switch (productType) {
    case "MEDICINE":
      return `hướng dẫn sử dụng liều dùng cách dùng đối tượng "${cleanName}" ${category !== "Không rõ" ? category : ""}`;
    case "COSMETIC":
      return `hướng dẫn sử dụng cách dùng công dụng tần suất "${cleanName}" ${category !== "Không rõ" ? category : ""}`;
    case "HOUSEHOLD":
      return `hướng dẫn sử dụng cách dùng công dụng liều lượng "${cleanName}" ${category !== "Không rõ" ? category : ""}`;
    default:
      return `hướng dẫn sử dụng cách dùng công dụng "${cleanName}" ${category !== "Không rõ" ? category : ""}`;
  }
};

const SEARCH_ATTEMPTS = [
  {
    language: "vi",
    label: "Tiếng Việt",
  },
  {
    language: "ja",
    label: "Tiếng Nhật",
  },
];

const getConfiguredGeminiModelNames = () =>
  getModeConfig("fast")
    .model.filter(
      (candidate) =>
        candidate.provider === PROVIDERS.GEMINI && candidate.model,
    )
    .map((candidate) => candidate.model);

export const parseJsonObject = (content) => {
  if (typeof content !== "string") return null;

  const startIndex = content.indexOf("{");
  const endIndex = content.lastIndexOf("}");
  if (startIndex === -1 || endIndex <= startIndex) return null;

  try {
    return JSON.parse(content.slice(startIndex, endIndex + 1));
  } catch {
    return null;
  }
};

const normalizeGeneratedField = (value) => {
  const normalized = normalizeUsageInstructions(value);
  if (!normalized) return null;

  return normalized
    .replace(/[\r\n]+[ \t]*[•*-]?[ \t]*/gu, "; ")
    .replace(/^[•*-]+\s*/u, "")
    .replace(/\s*•\s*/gu, "; ")
    .replace(/\s+/gu, " ")
    .replace(/(?:;\s*){2,}/gu, "; ")
    .trim();
};

export const formatUsageInstructions = (fields = {}, productType = "MEDICINE") => {
  if (productType === "COSMETIC") {
    const benefit = normalizeGeneratedField(fields.benefit);
    const usage = normalizeGeneratedField(fields.usage);
    const frequency = normalizeGeneratedField(fields.frequency);
    const note = normalizeGeneratedField(fields.note) || "Bảo quản nơi khô mát, tránh ánh nắng trực tiếp";
    if (!benefit || !usage) return null;

    return [
      `• Công dụng chính: ${benefit}`,
      `• Cách dùng: ${usage}`,
      `• Tần suất: ${frequency || "Dùng hàng ngày (sáng/tối)"}`,
      `• Lưu ý & bảo quản: ${note}`,
    ].join("\n");
  }

  if (productType === "HOUSEHOLD") {
    const purpose = normalizeGeneratedField(fields.purpose);
    const usage = normalizeGeneratedField(fields.usage);
    const dosage = normalizeGeneratedField(fields.dosage);
    const note = normalizeGeneratedField(fields.note) || "Để xa tầm tay trẻ em, bảo quản nơi khô ráo";
    if (!purpose || !usage) return null;

    return [
      `• Công dụng: ${purpose}`,
      `• Cách dùng: ${usage}`,
      `• Liều lượng: ${dosage || "Sử dụng lượng vừa đủ khi cần"}`,
      `• Lưu ý & bảo quản: ${note}`,
    ].join("\n");
  }

  if (productType === "GENERAL") {
    const purpose = normalizeGeneratedField(fields.purpose || fields.benefit);
    const usage = normalizeGeneratedField(fields.usage);
    const note = normalizeGeneratedField(fields.note) || "Bảo quản nơi khô ráo, thoáng mát";
    if (!purpose || !usage) return null;

    return [
      `• Công dụng: ${purpose}`,
      `• Cách dùng: ${usage}`,
      `• Lưu ý khi dùng: ${note}`,
    ].join("\n");
  }

  // Mặc định / MEDICINE
  const target = normalizeGeneratedField(fields.target);
  const timing = normalizeGeneratedField(fields.timing);
  const dose = normalizeGeneratedField(fields.dose);
  const frequency = normalizeGeneratedField(fields.frequency);
  const note = normalizeGeneratedField(fields.note) || DEFAULT_MEDICINE_NOTE;

  const doseLooksLikeDailyTotal =
    dose &&
    /(?:\/\s*ngày|\bmỗi\s+ngày\b|\btrong\s+ngày\b|\bngày\s+\d)/iu.test(
      dose,
    );

  if (doseLooksLikeDailyTotal) return null;

  if (timing && dose && frequency) {
    return [
      `• Thời điểm dùng: ${timing}`,
      `• Liều mỗi lần: ${dose}`,
      `• Số lần dùng: ${frequency}`,
      `• Lưu ý: ${note}`,
    ].join("\n");
  }

  if (target && dose && frequency) {
    return [
      `• Đối tượng sử dụng: ${target}`,
      `• Liều mỗi lần: ${dose}`,
      `• Tần suất & thời điểm: ${frequency}`,
      `• Lưu ý khi dùng: ${note}`,
    ].join("\n");
  }

  return null;
};

const callGeminiWithFailover = async ({
  modelNames,
  callGemini,
  prompt,
  image,
  systemInstruction,
  parseResponse,
}) => {
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const response = await callGemini(
        modelName,
        [{ role: "user", content: prompt, image }],
        systemInstruction,
        0.1,
      );
      if (!parseResponse) return response;

      const parsedResponse = parseResponse(response);
      if (parsedResponse !== null && parsedResponse !== undefined) {
        return parsedResponse;
      }
      lastError = Object.assign(new Error(
        `Model ${modelName} trả về dữ liệu không hợp lệ.`,
      ), {
        code: INVALID_GEMINI_RESPONSE,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Không có model Gemini được cấu hình.");
};

const buildClassificationPrompt = ({ name, category }) => `
Phân loại sản phẩm sau vào đúng 1 trong 4 nhóm:
- MEDICINE: Thuốc, vitamin, khoáng chất, thực phẩm bổ sung, thực phẩm bảo vệ sức khoẻ, men vi sinh, siro bổ.
- COSMETIC: Mỹ phẩm, sản phẩm chăm sóc da, trang điểm, son, serum, kem chống nắng, sữa rửa mặt, dầu gội, chăm sóc cơ thể.
- HOUSEHOLD: Đồ gia dụng, hoá phẩm tẩy rửa, xịt khuẩn, viên giặt, chất giặt xả, đồ dùng nhà bếp, thiết bị gia đình.
- GENERAL: Các sản phẩm khác (thực phẩm thông thường, đồ uống, phụ kiện, hàng tiêu dùng...).

Tên sản phẩm: ${name}
Danh mục: ${category || "Không rõ"}

Nếu có hình ảnh bao bì đính kèm, dùng cả tên, danh mục và hình ảnh để phân loại đúng sản phẩm.

Trả về một JSON object theo đúng schema:
{"productType": "MEDICINE" | "COSMETIC" | "HOUSEHOLD" | "GENERAL"}
Không thêm markdown hoặc giải thích.
`.trim();

const buildSynthesisPrompt = ({
  name,
  category,
  productType,
  searchResults,
  sourceLanguage,
}) => {
  let schemaDescription = "";
  if (productType === "COSMETIC") {
    schemaDescription = `{
  "benefit": "công dụng chính của sản phẩm",
  "usage": "cách dùng và các bước thao tác (ví dụ: Thoa 2-3 giọt sau bước toner, vỗ nhẹ)",
  "frequency": "tần suất sử dụng (ví dụ: 2 lần/ngày (sáng và tối))",
  "note": "lưu ý khi dùng và cách bảo quản"
}`;
  } else if (productType === "HOUSEHOLD") {
    schemaDescription = `{
  "purpose": "công dụng hoặc mục đích làm sạch/sử dụng",
  "usage": "hướng dẫn thao tác / cách sử dụng",
  "dosage": "liều lượng hoặc tỷ lệ sử dụng",
  "note": "lưu ý an toàn và cách bảo quản"
}`;
  } else if (productType === "GENERAL") {
    schemaDescription = `{
  "purpose": "công dụng chính của sản phẩm",
  "usage": "hướng dẫn cách sử dụng",
  "note": "lưu ý khi sử dụng hoặc bảo quản"
}`;
  } else {
    schemaDescription = `{
  "target": "đối tượng sử dụng (ví dụ: Người trưởng thành, trẻ từ 12 tuổi)",
  "dose": "liều dùng cho MỘT LẦN (ví dụ: 1-2 viên / lần)",
  "frequency": "tần suất và thời điểm dùng (ví dụ: 2 lần/ngày sau khi ăn)",
  "note": "lưu ý quan trọng khi dùng"
}`;
  }

  return `
Sản phẩm:
- Tên: ${name}
- Danh mục: ${category || "Không rõ"}
- Nhóm sản phẩm: ${productType}
- Ngôn ngữ nguồn: ${sourceLanguage}

Dữ liệu tìm kiếm web:
${searchResults}

Chỉ dùng thông tin thực tế từ dữ liệu tìm kiếm web hoặc hình ảnh đính kèm.
Tổng hợp các thông tin cốt lõi, ngắn gọn, chuẩn xác. Bỏ qua các quảng cáo hay thông tin không liên quan.
Mọi giá trị trả về bắt buộc viết bằng tiếng Việt.
Trả về một JSON object theo đúng schema:
${schemaDescription}

Nếu không tìm thấy thông tin từ nguồn, đặt các trường tương ứng thành null. Không thêm markdown hoặc giải thích.
`.trim();
};

const generateProductUsageInstructions = async ({
  name,
  category,
  image,
  dependencies,
}) => {
  const callGemini = dependencies.callGemini || callGeminiAPI;
  const search = dependencies.search || searchWeb;
  const modelNames =
    dependencies.modelNames || getConfiguredGeminiModelNames();

  let productType = "GENERAL";
  try {
    const classificationResult = await callGeminiWithFailover({
      modelNames,
      callGemini,
      prompt: buildClassificationPrompt({ name, category }),
      image,
      systemInstruction:
        "Bạn phân loại sản phẩm thận trọng và chỉ trả về JSON hợp lệ.",
      parseResponse: (response) => {
        const parsed = parseJsonObject(response?.content);
        const validTypes = ["MEDICINE", "COSMETIC", "HOUSEHOLD", "GENERAL"];
        if (parsed?.productType && validTypes.includes(parsed.productType)) {
          return parsed.productType;
        }
        if (typeof parsed?.isMedicineOrSupplement === "boolean") {
          return parsed.isMedicineOrSupplement ? "MEDICINE" : "GENERAL";
        }
        return null;
      },
    });

    if (classificationResult) {
      productType = classificationResult;
    }
  } catch (error) {
    console.error("Không thể phân loại sản phẩm để tạo HDSD:", error);
    return {
      instructions: null,
      error: `Không thể kết nối dịch vụ AI để tra cứu “${name}”. Vui lòng thử lại hoặc nhập thủ công.`,
    };
  }

  let completedSearches = 0;
  let foundEvidence = false;
  let synthesisServiceFailed = false;

  const cleanedName = cleanProductName(name);
  const namesToSearch = [name];
  if (cleanedName && cleanedName !== name && cleanedName.length >= 3) {
    namesToSearch.push(cleanedName);
  }

  for (const attempt of SEARCH_ATTEMPTS) {
    let searchResults = null;

    for (const searchName of namesToSearch) {
      const query = buildCategorySearchQuery({
        name: searchName,
        category,
        productType,
        language: attempt.language,
      });

      try {
        const res = await search(
          query,
          null,
          "advanced",
          7,
          { throwOnError: true },
        );
        completedSearches += 1;
        if (normalizeUsageInstructions(res)) {
          searchResults = res;
          break; // Đã tìm thấy kết quả web tốt cho ngôn ngữ này
        }
      } catch (error) {
        console.error(
          `Không thể tìm HDSD bằng ${attempt.label.toLowerCase()} với từ khoá "${query}":`,
          error,
        );
      }
    }

    if (!searchResults) {
      continue;
    }
    foundEvidence = true;

    try {
      const instructions = await callGeminiWithFailover({
        modelNames,
        callGemini,
        prompt: buildSynthesisPrompt({
          name,
          category,
          productType,
          searchResults,
          sourceLanguage: attempt.label,
        }),
        image,
        systemInstruction:
          "Bạn tổng hợp và dịch hướng dẫn sử dụng sang tiếng Việt từ nguồn web, không bịa thông tin và chỉ trả về JSON hợp lệ.",
        parseResponse: (response) => {
          const fields = parseJsonObject(response?.content);
          return fields ? formatUsageInstructions(fields, productType) : null;
        },
      });

      return {
        instructions,
        sourceLanguage: attempt.language,
        error: null,
      };
    } catch (error) {
      if (error?.code !== INVALID_GEMINI_RESPONSE) {
        synthesisServiceFailed = true;
      }
      console.error(
        `Không thể tổng hợp HDSD từ nguồn ${attempt.label.toLowerCase()}:`,
        error,
      );
    }
  }

  if (completedSearches === 0) {
    return {
      instructions: null,
      error: `Không thể kết nối dịch vụ tìm kiếm web để tra HDSD cho “${name}”. Vui lòng thử lại.`,
    };
  }

  if (foundEvidence && synthesisServiceFailed) {
    return {
      instructions: null,
      error: `Đã tìm thấy nguồn thông tin cho “${name}” nhưng AI chưa thể tổng hợp HDSD lúc này. Vui lòng thử lại hoặc nhập thủ công.`,
    };
  }

  return {
    instructions: null,
    error: image
      ? `AI đã kết hợp tên và ảnh bao bì của “${name}” nhưng chưa tìm thấy nguồn HDSD đủ tin cậy. Vui lòng kiểm tra lại ảnh hoặc nhập thủ công.`
      : `AI đã tìm kiếm HDSD cho “${name}” bằng tiếng Việt và tiếng Nhật nhưng chưa có nguồn đủ tin cậy. Vui lòng thêm ảnh bao bì rõ nét hoặc nhập thủ công.`,
  };
};

export const resolveProductUsageInstructions = (
  product = {},
  dependencies = {},
) => {
  const existingInstructions = normalizeUsageInstructions(
    product.usageInstructions,
  );
  if (existingInstructions) {
    return Promise.resolve({
      instructions: existingInstructions,
      error: null,
    });
  }

  const name = normalizeUsageInstructions(product.name);
  if (!name) {
    return Promise.resolve({
      instructions: null,
      error: "Vui lòng nhập tên sản phẩm để AI tra cứu HDSD.",
    });
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return Promise.resolve({
      instructions: null,
      error: "Không có kết nối Internet để AI tra cứu HDSD. Vui lòng kiểm tra mạng hoặc nhập thủ công.",
    });
  }

  const category =
    normalizeUsageInstructions(product.category) || "Không rõ";
  const image =
    typeof product.image === "string" && product.image.startsWith("data:image/")
      ? product.image
      : null;
  const imageIdentity = image
    ? `${image.length}:${image.slice(-24)}`
    : "";
  const requestKey = [
    product.id || "",
    name,
    category,
    imageIdentity,
  ].join("\u0000");
  const existingRequest = inFlightRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = generateProductUsageInstructions({
    name,
    category,
    image,
    dependencies,
  }).finally(() => {
    if (inFlightRequests.get(requestKey) === request) {
      inFlightRequests.delete(requestKey);
    }
  });

  inFlightRequests.set(requestKey, request);
  return request;
};
