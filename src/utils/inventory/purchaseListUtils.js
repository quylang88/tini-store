import { normalizeString } from "../formatters/formatUtils.js"
import { addPurchaseLot, getLatestLot, normalizePurchaseLots } from "./purchaseUtils.js"
import {
  getAllWarehouseKeys,
  getDefaultWarehouse,
  normalizeWarehouseStock,
  resolveWarehouseKey,
} from "./warehouseUtils.js"

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`

const nowIso = () => new Date().toISOString()

const sanitizeQuantity = (value) => Math.max(1, Number(value) || 0)

const calculateTotalStock = (stockByWarehouse = {}) => {
  let total = 0
  for (const key in stockByWarehouse) {
    if (Object.prototype.hasOwnProperty.call(stockByWarehouse, key)) {
      total += Number(stockByWarehouse[key]) || 0
    }
  }
  return total
}

const buildEmptyWarehouseStock = () => {
  const stock = {}
  getAllWarehouseKeys().forEach((key) => {
    stock[key] = 0
  })
  return stock
}

const applyRestockToProduct = ({
  product,
  warehouse,
  quantity,
  cost,
  priceAtPurchase,
}) => {
  const normalizedProduct = normalizePurchaseLots(product)
  const targetWarehouse =
    resolveWarehouseKey(warehouse) || getDefaultWarehouse().key
  const currentStock = normalizeWarehouseStock(normalizedProduct)
  const nextStockByWarehouse = {
    ...currentStock,
    [targetWarehouse]:
      (currentStock[targetWarehouse] || 0) + sanitizeQuantity(quantity),
  }

  const withUpdatedStock = {
    ...normalizedProduct,
    stockByWarehouse: nextStockByWarehouse,
    stock: calculateTotalStock(nextStockByWarehouse),
    cost: Number(cost) || Number(normalizedProduct.cost) || 0,
  }

  return addPurchaseLot(withUpdatedStock, {
    cost: Number(cost) || 0,
    quantity: sanitizeQuantity(quantity),
    warehouse: targetWarehouse,
    priceAtPurchase: Number(priceAtPurchase) || 0,
  })
}

const buildProductFromNewItem = ({
  item,
  list,
  price,
  cost,
  category,
}) => {
  const createdAt = nowIso()
  const baseProduct = {
    id: generateId("product"),
    name: item.name,
    barcode: "",
    productCode: "",
    category: category || "Chung",
    price: Number(price) || 0,
    cost: Number(cost) || 0,
    image: null,
    note: "",
    createdAt,
    purchaseLots: [],
    stockByWarehouse: buildEmptyWarehouseStock(),
    stock: 0,
  }

  return applyRestockToProduct({
    product: baseProduct,
    warehouse: list.warehouse,
    quantity: item.quantity,
    cost,
    priceAtPurchase: price,
  })
}

export const createPurchaseList = ({ title, warehouse, note = "" }) => {
  const timestamp = nowIso()

  return {
    id: generateId("plist"),
    title: String(title || "").trim(),
    warehouse: resolveWarehouseKey(warehouse) || getDefaultWarehouse().key,
    note: String(note || "").trim(),
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null,
    items: [],
  }
}

export const updatePurchaseListMeta = (list, { title, warehouse, note = "" }) => ({
  ...list,
  title: String(title || "").trim(),
  warehouse: resolveWarehouseKey(warehouse) || getDefaultWarehouse().key,
  note: String(note || "").trim(),
  updatedAt: nowIso(),
})

export const createPurchaseListItem = ({
  product,
  name,
  quantity,
  note = "",
  kind = "new",
}) => {
  const productName = product?.name || String(name || "").trim()

  return {
    id: generateId("plist_item"),
    productId: kind === "existing" ? product?.id || null : null,
    createdProductId: null,
    name: productName,
    quantity: sanitizeQuantity(quantity),
    kind,
    note: String(note || "").trim(),
    status: "pending",
    completedAt: null,
  }
}

export const updatePurchaseListItemData = (item, nextData = {}) => {
  const nextKind = nextData.kind || item.kind || "new"
  const nextProduct = nextData.product || null
  const nextName =
    nextKind === "existing"
      ? nextProduct?.name || String(nextData.name || item.name || "").trim()
      : String(nextData.name || item.name || "").trim()

  return {
    ...item,
    productId:
      nextKind === "existing" ? nextProduct?.id || item.productId || null : null,
    name: nextName,
    quantity: sanitizeQuantity(nextData.quantity ?? item.quantity),
    kind: nextKind,
    note: String(nextData.note ?? item.note ?? "").trim(),
  }
}

export const updatePurchaseListItems = (list, nextItems = []) => ({
  ...list,
  items: nextItems,
  updatedAt: nowIso(),
})

export const getPurchaseListStats = (list) => {
  const items = list?.items || []
  let pendingCount = 0
  let completedCount = 0
  let totalQuantity = 0

  for (const item of items) {
    totalQuantity += Number(item.quantity) || 0
    if (item.status === "completed") {
      completedCount += 1
    } else {
      pendingCount += 1
    }
  }

  return {
    pendingCount,
    completedCount,
    totalCount: items.length,
    totalQuantity,
  }
}

export const getPurchaseListLastUpdatedLabel = (timestamp) => {
  if (!timestamp) return ""
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ""

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const getItemCompletionRequirement = ({ item, product }) => {
  if (!item || item.status === "completed") {
    return { mode: "completed" }
  }

  if (item.kind === "new") {
    return { mode: "new" }
  }

  if (!product) {
    return { mode: "missing-product" }
  }

  const latestLot = getLatestLot(product)
  const latestCost = Number(latestLot?.cost) || 0

  if (latestCost > 0) {
    return { mode: "ready", cost: latestCost }
  }

  return { mode: "existing-missing-cost" }
}

export const completePurchaseListItem = ({
  purchaseLists,
  products,
  listId,
  itemId,
  completionData = {},
}) => {
  const list = purchaseLists.find((entry) => entry.id === listId)
  if (!list) {
    throw new Error("Không tìm thấy danh sách mua hàng.")
  }

  const item = list.items.find((entry) => entry.id === itemId)
  if (!item) {
    throw new Error("Không tìm thấy mặt hàng trong danh sách.")
  }

  if (item.status === "completed") {
    return { purchaseLists, products }
  }

  let nextProducts = products
  let nextCompletedItem = {
    ...item,
    status: "completed",
    completedAt: nowIso(),
  }

  if (item.kind === "existing") {
    const product = products.find((entry) => entry.id === item.productId)
    if (!product) {
      throw new Error("Sản phẩm này không còn tồn tại trong kho.")
    }

    const cost = Number(completionData.cost) || 0
    if (cost <= 0) {
      throw new Error("Vui lòng nhập giá nhập trước khi hoàn tất.")
    }

    const nextProduct = applyRestockToProduct({
      product,
      warehouse: list.warehouse,
      quantity: item.quantity,
      cost,
      priceAtPurchase: product.price,
    })

    nextProducts = products.map((entry) =>
      entry.id === product.id ? nextProduct : entry,
    )
    nextCompletedItem = {
      ...nextCompletedItem,
      createdProductId: product.id,
    }
  } else {
    const normalizedItemName = normalizeString(item.name)
    const duplicateProduct = products.find(
      (entry) => normalizeString(entry.name) === normalizedItemName,
    )

    if (duplicateProduct) {
      throw new Error(
        `Sản phẩm "${duplicateProduct.name}" đã tồn tại. Hãy sửa item này thành sản phẩm có sẵn để tránh tạo trùng.`,
      )
    }

    const price = Number(completionData.price) || 0
    const cost = Number(completionData.cost) || 0
    const category = String(completionData.category || "").trim()

    if (price <= 0 || cost <= 0 || !category) {
      throw new Error("Vui lòng nhập đủ giá bán, giá nhập và danh mục.")
    }

    const createdProduct = buildProductFromNewItem({
      item,
      list,
      price,
      cost,
      category,
    })

    nextProducts = [...products, createdProduct]
    nextCompletedItem = {
      ...nextCompletedItem,
      createdProductId: createdProduct.id,
    }
  }

  const nextLists = purchaseLists.map((entry) => {
    if (entry.id !== list.id) return entry

    const nextItems = entry.items.map((currentItem) =>
      currentItem.id === item.id ? nextCompletedItem : currentItem,
    )

    return updatePurchaseListItems(entry, nextItems)
  })

  return { purchaseLists: nextLists, products: nextProducts }
}
