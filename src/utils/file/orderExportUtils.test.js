import { describe, it, expect } from 'vitest';
import { paginateBalancedByCount } from './orderExportUtils';

describe('paginateBalancedByCount', () => {
  it('returns empty array for non-array input', () => {
    expect(paginateBalancedByCount(null)).toEqual([]);
    expect(paginateBalancedByCount(undefined)).toEqual([]);
    expect(paginateBalancedByCount(123)).toEqual([]);
    expect(paginateBalancedByCount({})).toEqual([]);
  });

  it('returns empty array for empty array input', () => {
    expect(paginateBalancedByCount([])).toEqual([]);
  });

  it('handles arrays smaller than the page limit', () => {
    const items = [1, 2, 3];
    const maxItemsPerPage = 6;
    expect(paginateBalancedByCount(items, maxItemsPerPage)).toEqual([[1, 2, 3]]);
  });

  it('handles exact multiples of the page limit', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const maxItemsPerPage = 6;
    expect(paginateBalancedByCount(items, maxItemsPerPage)).toEqual([
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12],
    ]);
  });

  it('distributes items evenly across pages with remainders', () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const maxItemsPerPage = 6;
    // Expected behavior: 7 items, max 6 per page.
    // pageCount = Math.ceil(7 / 6) = 2
    // baseSize = Math.floor(7 / 2) = 3
    // remainder = 7 % 2 = 1
    // page 0 size = 3 + 1 = 4
    // page 1 size = 3 + 0 = 3
    expect(paginateBalancedByCount(items, maxItemsPerPage)).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7],
    ]);
  });

  it('handles fractional inputs correctly with maxItemsPerPage as 3', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const maxItemsPerPage = 3;
    // pageCount = Math.ceil(8 / 3) = 3
    // baseSize = Math.floor(8 / 3) = 2
    // remainder = 8 % 3 = 2
    // page 0 size = 2 + 1 = 3
    // page 1 size = 2 + 1 = 3
    // page 2 size = 2 + 0 = 2
    expect(paginateBalancedByCount(items, maxItemsPerPage)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8],
    ]);
  });

  it('handles invalid maxItemsPerPage by defaulting to 1', () => {
    const items = [1, 2, 3];
    // if maxItemsPerPage is 0 or negative, it defaults to 1
    expect(paginateBalancedByCount(items, 0)).toEqual([[1], [2], [3]]);
    expect(paginateBalancedByCount(items, -5)).toEqual([[1], [2], [3]]);
    expect(paginateBalancedByCount(items, "invalid")).toEqual([[1], [2], [3]]);
  });

  it('filters out empty pages', () => {
    // Edge case if something bizarre happens with the logic
    const items = [1];
    expect(paginateBalancedByCount(items, 6)).toEqual([[1]]);
  });
});
