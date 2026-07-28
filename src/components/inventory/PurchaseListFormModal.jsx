import React, { useEffect, useMemo, useRef, useState } from "react"
import AnimatedFilterTabs from "../common/AnimatedFilterTabs"
import Button from "../button/Button"
import SheetModal from "../modals/SheetModal"
import { getWarehouses } from "../../utils/inventory/warehouseUtils"

const createInitialFormData = ({ list, defaultWarehouse }) => ({
  title: list?.title || "",
  warehouse: list?.warehouse || defaultWarehouse,
  note: list?.note || "",
})

const PurchaseListFormModal = ({ open, list, onClose, onSave }) => {
  const noteRef = useRef(null)
  const warehouses = useMemo(
    () => getWarehouses().map((warehouse) => ({
      key: warehouse.key,
      label: warehouse.label,
    })),
    [],
  )
  const defaultWarehouse = warehouses[0]?.key || ""
  const [prevFormKey, setPrevFormKey] = useState("closed")

  const [formData, setFormData] = useState(() =>
    createInitialFormData({ list, defaultWarehouse }),
  )

  const formKey = open ? `${list?.id || "new"}:${defaultWarehouse}` : "closed"

  if (formKey !== prevFormKey) {
    setPrevFormKey(formKey)
    setFormData(createInitialFormData({ list, defaultWarehouse }))
  }

  useEffect(() => {
    if (noteRef.current) {
      noteRef.current.style.height = "auto"
      noteRef.current.style.height = `${noteRef.current.scrollHeight}px`
    }
  }, [formData.note, open])

  const footer = (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="secondary" onClick={onClose}>
        Huỷ
      </Button>
      <Button
        variant="primary"
        onClick={() =>
          onSave({
            list,
            title: formData.title,
            warehouse: formData.warehouse,
            note: formData.note,
          })
        }
      >
        {list ? "Lưu thay đổi" : "Tạo danh sách"}
      </Button>
    </div>
  )

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      title={list ? "Sửa list" : "Tạo list"}
      footer={footer}
    >
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-rose-700 uppercase mb-2">
            Tên danh sách
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Ví dụ: Chuyến hàng cuối tháng"
            className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-rose-700 uppercase mb-2">
            Kho nhận hàng
          </label>
          <AnimatedFilterTabs
            tabs={warehouses}
            activeTab={formData.warehouse}
            onChange={(warehouse) =>
              setFormData((prev) => ({ ...prev, warehouse }))
            }
            layoutIdPrefix="purchase-list-form-warehouse"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-rose-700 uppercase mb-2">
            Ghi chú
          </label>
          <textarea
            ref={noteRef}
            value={formData.note}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, note: event.target.value }))
            }
            rows={3}
            placeholder="Gợi ý: nhóm hàng, lịch đi mua, lưu ý riêng..."
            className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none overflow-y-auto min-h-20 max-h-60"
          />
        </div>
      </div>
    </SheetModal>
  )
}

export default PurchaseListFormModal
