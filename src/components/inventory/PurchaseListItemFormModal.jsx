import React, { useMemo, useState } from "react"
import { Package, Search } from "lucide-react"
import AnimatedFilterTabs from "../common/AnimatedFilterTabs"
import Button from "../button/Button"
import SheetModal from "../modals/SheetModal"
import {
  formatInputNumber,
  normalizeString,
  sanitizeNumberInput,
} from "../../utils/formatters/formatUtils"
import {
  matchesAnySearchTerms,
  parseSearchTerms,
} from "../../utils/common/searchUtils"
import { getWarehouseLabel } from "../../utils/inventory/warehouseUtils"

const KIND_TABS = [
  { key: "existing", label: "Sản phẩm có sẵn" },
  { key: "new", label: "Mặt hàng mới" },
]

const createInitialFormState = ({ item, products }) => {
  const matchingProduct = item?.productId
    ? products.find((product) => product.id === item.productId)
    : null

  return {
    kind: item?.kind || "existing",
    searchValue: matchingProduct?.name || item?.name || "",
    selectedProductId: matchingProduct?.id || null,
    newItemName: item?.kind === "new" ? item.name || "" : "",
    quantity: String(item?.quantity || 1),
    note: item?.note || "",
  }
}

const PurchaseListItemFormModal = ({
  open,
  list,
  item,
  products,
  onClose,
  onSave,
}) => {
  const [prevFormKey, setPrevFormKey] = useState("closed")
  const [formState, setFormState] = useState(() =>
    createInitialFormState({ item, products }),
  )

  const selectedProduct = useMemo(
    () =>
      products.find((product) => product.id === formState.selectedProductId) ||
      null,
    [formState.selectedProductId, products],
  )

  const formKey = open
    ? `${list?.id || "none"}:${item?.id || "new"}:${products.length}`
    : "closed"

  if (formKey !== prevFormKey) {
    setPrevFormKey(formKey)
    setFormState(createInitialFormState({ item, products }))
  }

  const suggestions = useMemo(() => {
    if (formState.kind !== "existing") return []

    const searchTerms = parseSearchTerms(formState.searchValue)
    if (!searchTerms.length) return []

    const results = []
    for (const product of products) {
      if (
        matchesAnySearchTerms(
          [
            normalizeString(product.name),
            normalizeString(product.productCode),
          ],
          searchTerms,
        )
      ) {
        results.push(product)
        if (results.length === 5) break
      }
    }
    return results
  }, [formState.kind, formState.searchValue, products])

  const handleSelectProduct = (product) => {
    setFormState((prev) => ({
      ...prev,
      selectedProductId: product.id,
      searchValue: product.name,
    }))
  }

  const handleSearchChange = (event) => {
    const nextValue = event.target.value
    if (!selectedProduct) {
      setFormState((prev) => ({ ...prev, searchValue: nextValue }))
      return
    }

    setFormState((prev) => ({
      ...prev,
      searchValue: nextValue,
      selectedProductId:
        normalizeString(selectedProduct.name) === normalizeString(nextValue)
          ? prev.selectedProductId
          : null,
    }))
  }

  const footer = (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="secondary" onClick={onClose}>
        Huỷ
      </Button>
      <Button
        variant="primary"
        onClick={() =>
          onSave({
            listId: list?.id,
            item,
            product: selectedProduct,
            kind: formState.kind,
            name:
              formState.kind === "new"
                ? formState.newItemName
                : formState.searchValue,
            quantity: formState.quantity,
            note: formState.note,
          })
        }
      >
        {item ? "Lưu mặt hàng" : "Thêm mặt hàng"}
      </Button>
    </div>
  )

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      title={item ? "Sửa mặt hàng cần mua" : "Thêm mặt hàng cần mua"}
      footer={footer}
    >
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-rose-700 uppercase mb-2">
            Loại mặt hàng
          </label>
          <AnimatedFilterTabs
            tabs={KIND_TABS}
            activeTab={formState.kind}
            onChange={(nextKind) => {
              setFormState((prev) => ({
                ...prev,
                kind: nextKind,
                selectedProductId:
                  nextKind === "new" ? null : prev.selectedProductId,
              }))
            }}
            layoutIdPrefix="purchase-list-item-kind"
          />
        </div>

        {formState.kind === "existing" ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-rose-700 uppercase mb-2">
                Chọn sản phẩm trong kho
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formState.searchValue}
                  onChange={handleSearchChange}
                  placeholder="Tìm tên hoặc mã sản phẩm..."
                  className="w-full rounded-xl border border-rose-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500"
                />
              </div>
            </div>

            {selectedProduct ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="text-sm font-semibold text-emerald-800">
                  {selectedProduct.name}
                </div>
                <div className="text-xs text-emerald-700 mt-1">
                  Mã SP: {selectedProduct.productCode || "---"} • Giá bán:{" "}
                  {formatInputNumber(selectedProduct.price || 0)}đ
                </div>
              </div>
            ) : null}

            {!selectedProduct && suggestions.length > 0 ? (
              <div className="rounded-2xl border border-rose-100 bg-white shadow-sm overflow-hidden">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className="w-full text-left px-4 py-3 border-b border-rose-50 last:border-b-0 active:bg-rose-50"
                  >
                    <div className="text-sm font-semibold text-rose-900">
                      {product.name}
                    </div>
                    <div className="text-xs text-rose-600 mt-1">
                      {product.productCode || "---"} • {product.category}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-rose-700 uppercase mb-2">
              Tên mặt hàng mới
            </label>
            <div className="relative">
              <input
                type="text"
                value={formState.newItemName}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    newItemName: event.target.value,
                  }))
                }
                placeholder="Ví dụ: Serum mới, khăn giấy..."
                className="w-full rounded-xl border border-rose-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
              <Package
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-rose-700 uppercase mb-2">
            Số lượng cần mua
          </label>
          <input
            inputMode="numeric"
            value={formatInputNumber(formState.quantity)}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                quantity: sanitizeNumberInput(event.target.value),
              }))
            }
            placeholder="1"
            className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-lg font-bold text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-xs font-bold text-amber-800 uppercase">
            Kho nhận hàng
          </div>
          <div className="text-sm text-amber-900 font-semibold mt-1">
            {getWarehouseLabel(list?.warehouse)}
          </div>
          <div className="text-xs text-amber-700 mt-1">
            Mọi item trong list này sẽ tự động nhập về cùng một kho.
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-rose-700 uppercase mb-2">
            Ghi chú
          </label>
          <textarea
            rows={3}
            value={formState.note}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, note: event.target.value }))
            }
            placeholder="Ví dụ: mua đúng size, đổi màu bao bì, ưu tiên shop quen..."
            className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none"
          />
        </div>
      </div>
    </SheetModal>
  )
}

export default PurchaseListItemFormModal
