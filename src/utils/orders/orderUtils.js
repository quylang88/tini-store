import {
  getWarehouseLabel,
  getDefaultWarehouse,
  resolveWarehouseKey,
} from "../inventory/warehouseUtils";
import { normalizeString } from "../formatters/formatUtils";
import {
  matchesAllSearchTerms,
  parseSearchTerms,
} from "../common/searchUtils";

export const getOrderDisplayName = (order) => {
  // Nếu là bán tại kho thì hiển thị rõ "Tại kho: <địa điểm>" để nhận biết nhanh.
  if (order?.orderType === "warehouse") {
    const warehouseLabel = getWarehouseLabel(
      resolveWarehouseKey(order?.warehouse) || getDefaultWarehouse().key,
    );
    return `Tại kho: ${warehouseLabel}`;
  }
  const name = (order?.customerName || "").trim();
  const address = (order?.customerAddress || "").trim();
  // Lấy phần đầu của địa chỉ (tên đường/quận) để rút gọn hiển thị cạnh số đơn.
  const addressParts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const shortAddress =
    addressParts[0] || addressParts[addressParts.length - 1] || "";
  if (!name && !shortAddress) {
    return "Gửi khách";
  }
  return [name, shortAddress].filter(Boolean).join(" • ");
};

export const parseOrderSearchTerms = (query) => parseSearchTerms(query);

export const orderMatchesSearchTerms = (order, searchTerms = []) => {
  if (!searchTerms.length) return true;

  const searchableFields = [];
  const customerName = normalizeString(order?.customerName);
  if (customerName) {
    searchableFields.push(customerName);
  }

  const items = order?.items || order?.products || [];
  for (let i = 0; i < items.length; i++) {
    const itemName = normalizeString(items[i]?.name);
    if (itemName) {
      searchableFields.push(itemName);
    }
  }

  return matchesAllSearchTerms(searchableFields, searchTerms);
};
