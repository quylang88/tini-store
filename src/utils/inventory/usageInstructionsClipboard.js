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

const EXPLICIT_NORMAL_FONT_WEIGHTS = new Set([
  "normal",
  "400",
  "300",
  "200",
  "100",
]);

const BOLD_CLASS_REGEX =
  /(?:^|\s)(?:bold|font-(?:medium|semibold|bold|extrabold|black)|font-\[?[5-9]00\]?|(?:font-)?weight-?[5-9]00|fw-(?:semibold|bold)|semi-?bold|extra-?bold)(?:\s|$)/iu;

const BOLD_CSS_DECLARATION_REGEX =
  /(?:font-weight\s*:\s*(?:bold|bolder|[5-9][0-9]{2})\b|font\s*:\s*(?:[^;]*\s)?(?:bold|bolder|[5-9][0-9]{2})\b|font-variation-settings\s*:[^;]*["']?wght["']?\s+[5-9][0-9]{2})/iu;

export const getDeclaredBoldClassNamesFromCss = (cssText) => {
  const classNames = new Set();
  if (typeof cssText !== "string" || !cssText) return classNames;

  for (const rule of cssText.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
    if (!BOLD_CSS_DECLARATION_REGEX.test(rule[2])) continue;

    for (const classMatch of rule[1].matchAll(/\.(-?[_a-zA-Z]+[\w-]*)/gu)) {
      classNames.add(classMatch[1]);
    }
  }

  return classNames;
};

export const isClipboardBoldFormatting = ({
  tagName = "",
  fontWeight = "",
  fontVariationSettings = "",
  className = "",
  declaredBold = false,
} = {}) => {
  const normalizedTag = String(tagName).toLowerCase();
  const normalizedWeight = String(fontWeight).trim().toLowerCase();

  if (EXPLICIT_NORMAL_FONT_WEIGHTS.has(normalizedWeight)) return false;
  if (declaredBold) return true;

  if (
    [
      "b",
      "strong",
      "th",
      "dt",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ].includes(normalizedTag)
  )
    return true;
  if (["bold", "bolder"].includes(normalizedWeight)) return true;

  const numericWeight = Number.parseFloat(normalizedWeight);
  if (Number.isFinite(numericWeight) && numericWeight >= 500) return true;

  const variableWeight = String(fontVariationSettings).match(
    /["']?wght["']?\s+([0-9]+(?:\.[0-9]+)?)/iu,
  );
  if (variableWeight && Number(variableWeight[1]) >= 500) return true;

  return BOLD_CLASS_REGEX.test(String(className));
};

const getExistingMarkdownBoldRanges = (text) => {
  const ranges = [];
  const pattern = /(\*\*|__)(.*?)\1/gu;

  for (const match of text.matchAll(pattern)) {
    const contentStart = match.index + match[1].length;
    ranges.push({
      start: contentStart,
      end: contentStart + match[2].length,
    });
  }

  return ranges;
};

const rangesOverlap = (left, right) =>
  left.start < right.end && right.start < left.end;

const findTextOccurrence = (text, segment, occurrence) => {
  let searchIndex = 0;
  let matchIndex = -1;

  for (let index = 0; index <= occurrence; index += 1) {
    matchIndex = text.indexOf(segment, searchIndex);
    if (matchIndex < 0) return -1;
    searchIndex = matchIndex + segment.length;
  }

  return matchIndex;
};

export const restoreBoldFormattingInPlainText = (
  plainText,
  boldTextSegments = [],
) => {
  const normalizedPlainText = normalizeVietnameseClipboardText(plainText);
  if (!normalizedPlainText || !Array.isArray(boldTextSegments)) {
    return normalizedPlainText;
  }

  const existingRanges = getExistingMarkdownBoldRanges(normalizedPlainText);
  const restoredRanges = [];
  const nextSearchIndexBySegment = new Map();

  for (const rawSegment of boldTextSegments) {
    const segmentValue =
      typeof rawSegment === "string" ? rawSegment : rawSegment?.text;
    const requestedOccurrence =
      typeof rawSegment === "object" &&
      Number.isInteger(rawSegment?.occurrence) &&
      rawSegment.occurrence >= 0
        ? rawSegment.occurrence
        : null;
    const segment = normalizeVietnameseClipboardText(segmentValue).trim();
    if (!segment) continue;

    let searchIndex = nextSearchIndexBySegment.get(segment) || 0;
    let matchIndex =
      requestedOccurrence === null
        ? normalizedPlainText.indexOf(segment, searchIndex)
        : findTextOccurrence(
            normalizedPlainText,
            segment,
            requestedOccurrence,
          );

    while (matchIndex >= 0) {
      const candidate = {
        start: matchIndex,
        end: matchIndex + segment.length,
      };
      const alreadyBold = existingRanges.some((range) =>
        rangesOverlap(range, candidate),
      );
      const overlapsRestored = restoredRanges.some((range) =>
        rangesOverlap(range, candidate),
      );

      if (!alreadyBold && !overlapsRestored) {
        restoredRanges.push(candidate);
        nextSearchIndexBySegment.set(segment, candidate.end);
        break;
      }

      if (alreadyBold) {
        nextSearchIndexBySegment.set(segment, candidate.end);
        break;
      }

      if (requestedOccurrence !== null) break;

      matchIndex = normalizedPlainText.indexOf(segment, candidate.end);
    }
  }

  return restoredRanges
    .sort((left, right) => right.start - left.start)
    .reduce(
      (result, range) =>
        `${result.slice(0, range.start)}**${result.slice(
          range.start,
          range.end,
        )}**${result.slice(range.end)}`,
      normalizedPlainText,
    );
};

export const buildUsageInstructionsPasteHtml = ({
  htmlData = "",
  textData = "",
  sanitizeHtml = () => "",
  getBoldTextSegments = () => [],
  plainTextToHtml = (text) => text,
} = {}) => {
  const normalizedPlainText = normalizeVietnameseClipboardText(textData);
  const sanitizedHtml = htmlData ? sanitizeHtml(htmlData) : "";

  if (!normalizedPlainText) {
    return safeNormalizeNfc(sanitizedHtml);
  }

  const boldTextSegments = sanitizedHtml
    ? getBoldTextSegments(sanitizedHtml)
    : [];
  const cleanFormattedText = restoreBoldFormattingInPlainText(
    normalizedPlainText,
    boldTextSegments,
  );

  return safeNormalizeNfc(plainTextToHtml(cleanFormattedText));
};
