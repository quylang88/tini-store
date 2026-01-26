/**
 * textAnalysisUtils.js
 * Các hàm tiện ích xử lý văn bản và so sánh độ tương đồng cho AI Service.
 */

const getBigrams = (str) => {
  const s = str.toLowerCase().replace(/[^\w\s\u00C0-\u1EF9]/g, "");
  return s.split(/\s+/).filter((w) => w.length > 0);
};

export const calculateSimilarity = (str1, str2) => {
  const words1 = getBigrams(str1);
  const words2 = getBigrams(str2);
  if (words1.length === 0 || words2.length === 0) return 0.0;
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  return (2.0 * intersection.size) / (set1.size + set2.size);
};

export const checkDuplicateQuery = (currentQuery, lastQuery) => {
  if (!lastQuery) return false;
  if (currentQuery.trim().toLowerCase() === lastQuery.trim().toLowerCase())
    return true;
  const similarity = calculateSimilarity(currentQuery, lastQuery);
  return similarity >= 0.85;
};
