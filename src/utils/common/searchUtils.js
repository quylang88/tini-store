import { normalizeString } from "../formatters/formatUtils";

export const parseSearchTerms = (query) =>
  String(query || "")
    .split(",")
    .map((term) => normalizeString(term))
    .filter(Boolean);

export const matchesAnySearchTerms = (
  normalizedFields = [],
  searchTerms = [],
) => {
  if (!searchTerms.length) return true;

  const searchableFields = normalizedFields.filter(Boolean);
  if (!searchableFields.length) return false;

  return searchTerms.some((term) =>
    searchableFields.some((field) => field.includes(term)),
  );
};

export const matchesAllSearchTerms = (
  normalizedFields = [],
  searchTerms = [],
) => {
  if (!searchTerms.length) return true;

  const searchableFields = normalizedFields.filter(Boolean);
  if (!searchableFields.length) return false;

  return searchTerms.every((term) =>
    searchableFields.some((field) => field.includes(term)),
  );
};
