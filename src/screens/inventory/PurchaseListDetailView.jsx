import React, { useMemo, useState } from "react"
import { Check, Pencil, Trash2 } from "lucide-react"
import AnimatedFilterTabs from "../../components/common/AnimatedFilterTabs"
import InventorySubscreenHeader from "../../components/inventory/InventorySubscreenHeader"
import {
  getPurchaseListLastUpdatedLabel,
  getPurchaseListStats,
} from "../../utils/inventory/purchaseListUtils"
import {
  getSpecificWarehouseStock,
  getWarehouseLabel,
} from "../../utils/inventory/warehouseUtils"

const DETAIL_TABS = [
  { key: "pending", label: "Cần mua" },
  { key: "completed", label: "Đã mua" },
]

const PurchaseListDetailView = ({
  list,
  products,
  onBack,
  onEditList,
  onDeleteList,
  onEditItem,
  onDeleteItem,
  onCompleteItem,
  completingItemId,
}) => {
  const [activeTab, setActiveTab] = useState("pending")

  const stats = useMemo(() => getPurchaseListStats(list), [list])

  const visibleItems = useMemo(() => {
    const items = list?.items || []
    const filtered = items.filter((item) =>
      activeTab === "pending"
        ? item.status !== "completed"
        : item.status === "completed",
    )

    if (activeTab === "completed") {
      return [...filtered].sort((a, b) => {
        const timeA = new Date(a.completedAt || 0).getTime()
        const timeB = new Date(b.completedAt || 0).getTime()
        return timeB - timeA
      })
    }

    return filtered
  }, [activeTab, list])

  const productMap = useMemo(() => {
    const map = new Map()
    for (const product of products) {
      map.set(product.id, product)
    }
    return map
  }, [products])

  return (
    <div className="h-full bg-rose-50 flex flex-col">
      <InventorySubscreenHeader
        title={list?.title || "Danh sách mua"}
        subtitle={`Kho nhận: ${getWarehouseLabel(list?.warehouse)} • Cập nhật ${getPurchaseListLastUpdatedLabel(list?.updatedAt)}`}
        onBack={onBack}
        actions={[
          {
            label: "Sửa danh sách",
            icon: Pencil,
            onClick: () => onEditList(list),
          },
          {
            label: "Xoá danh sách",
            icon: Trash2,
            tone: "danger",
            onClick: () => onDeleteList(list),
          },
        ]}
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-rose-100/80 px-3 py-3">
            <div className="text-[11px] font-bold uppercase text-rose-600">
              Cần mua
            </div>
            <div className="text-lg font-bold text-rose-900 mt-1">
              {stats.pendingCount}
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-100/80 px-3 py-3">
            <div className="text-[11px] font-bold uppercase text-emerald-600">
              Đã mua
            </div>
            <div className="text-lg font-bold text-emerald-900 mt-1">
              {stats.completedCount}
            </div>
          </div>
          <div className="rounded-2xl bg-amber-100/80 px-3 py-3">
            <div className="text-[11px] font-bold uppercase text-amber-700">
              Tổng món
            </div>
            <div className="text-lg font-bold text-amber-900 mt-1">
              {stats.totalCount}
            </div>
          </div>
        </div>

        {list?.note ? (
          <div className="mt-3 rounded-2xl bg-white border border-amber-100 px-4 py-3 text-sm text-rose-700">
            {list.note}
          </div>
        ) : null}
      </InventorySubscreenHeader>

      <div className="px-4 pt-4">
        <AnimatedFilterTabs
          tabs={DETAIL_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          layoutIdPrefix="purchase-list-detail-tab"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {visibleItems.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-rose-300 bg-white/80 px-6 py-10 text-center">
            <div className="text-lg font-bold text-rose-900">
              {activeTab === "pending"
                ? "List này đang trống"
                : "Chưa có món nào hoàn tất"}
            </div>
            <p className="text-sm text-rose-600 mt-2 leading-relaxed">
              {activeTab === "pending"
                ? "Nhấn nút thêm món để bắt đầu ghi lại những sản phẩm cần mua."
                : "Khi bạn tích hoàn thành, item sẽ chuyển sang đây để tiện đối chiếu sau."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => {
              const linkedProduct = item.productId
                ? productMap.get(item.productId) || null
                : null
              const createdProduct = item.createdProductId
                ? productMap.get(item.createdProductId) || null
                : null
              const currentStock = linkedProduct
                ? getSpecificWarehouseStock(linkedProduct, list.warehouse)
                : 0
              const isCompleting = completingItemId === item.id
              const isCompleted = item.status === "completed"

              return (
                <div
                  key={item.id}
                  className={`rounded-[24px] border px-4 py-4 shadow-sm ${
                    isCompleted
                      ? "bg-emerald-50 border-emerald-100"
                      : "bg-white border-amber-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCompleted ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                        <Check size={18} strokeWidth={3} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onCompleteItem(list.id, item)}
                        disabled={isCompleting}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                          isCompleting
                            ? "border-rose-200 bg-rose-100 text-rose-400"
                            : "border-rose-300 bg-rose-50 text-rose-600 active:scale-95"
                        }`}
                        aria-label={`Hoàn tất ${item.name}`}
                      >
                        <Check size={18} strokeWidth={3} />
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-base font-bold text-rose-900">
                          {item.name}
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            item.kind === "existing"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {item.kind === "existing" ? "Có sẵn" : "Mới"}
                        </span>
                      </div>

                      <div className="text-sm text-rose-700 mt-1">
                        Cần mua {item.quantity} sp
                        {linkedProduct && !isCompleted ? (
                          <> • Tồn hiện tại trong kho: {currentStock} sp</>
                        ) : null}
                      </div>

                      {item.note ? (
                        <div className="text-sm text-rose-500 mt-2 leading-relaxed">
                          {item.note}
                        </div>
                      ) : null}

                      {isCompleted ? (
                        <div className="text-xs text-emerald-700 mt-3">
                          Hoàn tất lúc{" "}
                          {new Date(item.completedAt).toLocaleString("vi-VN")}
                          {createdProduct ? ` • Đã nhập vào "${createdProduct.name}"` : ""}
                        </div>
                      ) : null}
                    </div>

                    {!isCompleted ? (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => onEditItem(list.id, item)}
                          className="w-9 h-9 rounded-full border border-amber-200 bg-amber-50 text-amber-700 flex items-center justify-center active:bg-amber-100"
                          aria-label={`Sửa ${item.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(list.id, item)}
                          className="w-9 h-9 rounded-full border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center active:bg-rose-100"
                          aria-label={`Xoá ${item.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default PurchaseListDetailView
