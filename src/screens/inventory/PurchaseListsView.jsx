import React from "react"
import { ClipboardList, Pencil, Trash2 } from "lucide-react"
import Button from "../../components/button/Button"
import InventorySubscreenHeader from "../../components/inventory/InventorySubscreenHeader"
import {
  getPurchaseListLastUpdatedLabel,
  getPurchaseListStats,
} from "../../utils/inventory/purchaseListUtils"
import { getWarehouseLabel } from "../../utils/inventory/warehouseUtils"

const PurchaseListsView = ({
  purchaseLists,
  onBack,
  onOpenList,
  onCreateList,
  onEditList,
  onDeleteList,
}) => {
  return (
    <div className="h-full bg-rose-50 flex flex-col">
      <InventorySubscreenHeader
        title="Danh sách cần mua"
        subtitle="Mỗi list tương ứng với một kho, giúp bạn gom món cần mua mà không bị quên."
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {purchaseLists.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-rose-300 bg-white/80 px-6 py-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={24} />
            </div>
            <h3 className="text-lg font-bold text-rose-900">
              Chưa có danh sách nào
            </h3>
            <p className="text-sm text-rose-600 leading-relaxed mt-2">
              Tạo list đầu tiên để ghi lại những món cần mua thêm cho từng kho.
            </p>
            <div className="mt-5">
              <Button variant="primary" onClick={onCreateList}>
                Tạo danh sách đầu tiên
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {purchaseLists.map((list) => {
              const stats = getPurchaseListStats(list)
              return (
                <div
                  key={list.id}
                  className="rounded-[26px] border border-amber-100 bg-white shadow-sm px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenList(list.id)}
                        className="text-left"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-rose-900 truncate">
                            {list.title}
                          </h3>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                            {getWarehouseLabel(list.warehouse)}
                          </span>
                        </div>
                      </button>
                      {list.note ? (
                        <p className="text-sm text-rose-600 mt-2 line-clamp-2">
                          {list.note}
                        </p>
                      ) : (
                        <p className="text-sm text-rose-400 mt-2">
                          Chưa có ghi chú riêng cho list này.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditList(list)}
                        className="w-9 h-9 rounded-full border border-amber-200 bg-amber-50 text-amber-700 flex items-center justify-center active:bg-amber-100"
                        aria-label={`Sửa ${list.title}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteList(list)}
                        className="w-9 h-9 rounded-full border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center active:bg-rose-100"
                        aria-label={`Xoá ${list.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenList(list.id)}
                    className="w-full text-left mt-4 active:scale-[0.99] transition-transform"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-rose-50 px-3 py-3">
                        <div className="text-[11px] font-bold uppercase text-rose-500">
                          Cần mua
                        </div>
                        <div className="text-lg font-bold text-rose-900 mt-1">
                          {stats.pendingCount}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 px-3 py-3">
                        <div className="text-[11px] font-bold uppercase text-emerald-600">
                          Đã mua
                        </div>
                        <div className="text-lg font-bold text-emerald-800 mt-1">
                          {stats.completedCount}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-amber-50 px-3 py-3">
                        <div className="text-[11px] font-bold uppercase text-amber-700">
                          Cập nhật
                        </div>
                        <div className="text-sm font-bold text-amber-900 mt-1 leading-tight">
                          {getPurchaseListLastUpdatedLabel(list.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default PurchaseListsView
