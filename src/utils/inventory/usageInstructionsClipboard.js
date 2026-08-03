const WINDOWS_1252_CHAR_TO_BYTE = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const MOJIBAKE_MARKER_REGEX =
  /(?:Ã|Â|Æ|Ä|áº|á»|â€|ï¿½|ðŸ|\uFFFD)/gu;

const safeNormalizeNfc = (value) => {
  try {
    return value.normalize("NFC");
  } catch {
    return value;
  }
};

const getMojibakeScore = (value) => {
  if (!value) return 0;
  return Array.from(value.matchAll(MOJIBAKE_MARKER_REGEX)).length;
};

const toWindows1252Bytes = (value) => {
  const bytes = [];

  for (const character of Array.from(value)) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    const mappedByte = WINDOWS_1252_CHAR_TO_BYTE.get(codePoint);
    if (mappedByte === undefined) return null;
    bytes.push(mappedByte);
  }

  return new Uint8Array(bytes);
};

const decodeMojibakeTokenOnce = (token) => {
  const initialScore = getMojibakeScore(token);
  if (initialScore === 0 || typeof TextDecoder === "undefined") return token;

  const bytes = toWindows1252Bytes(token);
  if (!bytes) return token;

  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const normalized = safeNormalizeNfc(decoded);
    return getMojibakeScore(normalized) < initialScore ? normalized : token;
  } catch {
    return token;
  }
};

export const repairVietnameseUtf8Mojibake = (value) => {
  if (typeof value !== "string" || !value) return "";

  let wholeValue = value;
  for (let pass = 0; pass < 3; pass += 1) {
    const next = decodeMojibakeTokenOnce(wholeValue);
    if (next === wholeValue) break;
    wholeValue = next;
  }
  if (wholeValue !== value) return wholeValue;

  // Split on ASCII whitespace only. A non-breaking space can itself be one
  // byte of a corrupted UTF-8 sequence and must stay inside the repair token.
  return value.replace(/[^\t\n\r /:;?!,.()[\]{}<>]+/gu, (token) => {
    let repaired = token;

    // Some mobile rich clipboards contain text that was decoded twice.
    for (let pass = 0; pass < 3; pass += 1) {
      const next = decodeMojibakeTokenOnce(repaired);
      if (next === repaired) break;
      repaired = next;
    }

    return repaired;
  });
};

export const normalizeVietnameseClipboardText = (value) => {
  if (typeof value !== "string" || !value) return "";

  return safeNormalizeNfc(repairVietnameseUtf8Mojibake(value))
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/[\u200B\u2060\uFEFF]/g, "");
};

export const normalizeVietnameseUsageInstructionsValue = (value) => {
  if (typeof value !== "string" || !value) return "";

  // Normalize only text segments so legacy HTML attributes and tag syntax are
  // never passed through the charset-repair heuristic.
  return safeNormalizeNfc(
    value
      .split(/(<[^>]*>)/gu)
      .map((segment) =>
        /^<[^>]*>$/u.test(segment)
          ? segment
          : normalizeVietnameseClipboardText(segment),
      )
      .join(""),
  );
};

const canonicalClipboardText = (value) =>
  normalizeVietnameseClipboardText(value)
    .replace(/(\*\*|__)(.*?)\1/gu, "$2")
    .replace(/\s/gu, "");

export const buildUsageInstructionsPasteHtml = ({
  htmlData = "",
  textData = "",
  sanitizeHtml = () => "",
  htmlToText = () => "",
  plainTextToHtml = (text) => text,
} = {}) => {
  const normalizedPlainText = normalizeVietnameseClipboardText(textData);
  const sanitizedHtml = htmlData ? sanitizeHtml(htmlData) : "";

  if (!normalizedPlainText) {
    return safeNormalizeNfc(sanitizedHtml);
  }

  if (!sanitizedHtml) {
    return safeNormalizeNfc(plainTextToHtml(normalizedPlainText));
  }

  const richText = htmlToText(sanitizedHtml);
  const normalizedRichText = normalizeVietnameseClipboardText(richText);
  const plainScore = getMojibakeScore(normalizedPlainText);
  const richScore = getMojibakeScore(richText);

  // text/plain is the character-authority on mobile. Rich HTML is retained
  // only when it is at least as healthy and represents the same text.
  const richTextMatchesPlain =
    normalizedRichText &&
    canonicalClipboardText(normalizedRichText) ===
      canonicalClipboardText(normalizedPlainText);

  if (richScore <= plainScore && richTextMatchesPlain) {
    return safeNormalizeNfc(sanitizedHtml);
  }

  return safeNormalizeNfc(plainTextToHtml(normalizedPlainText));
};
