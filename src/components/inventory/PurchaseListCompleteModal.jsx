import React, { useState } from "react"
import Button from "../button/Button"
import SheetModal from "../modals/SheetModal"
import {
  formatInputNumber,
  sanitizeNumberInput,
} from "../../utils/formatters/formatUtils"
import { getWarehouseLabel } from "../../utils/inventory/warehouseUtils"

const PurchaseListCompleteModal = ({
  open,
  mode,
  list,
  item,
  categories = [],
  initialValues = {},
  onClose,
  onSubmit,
}) => {
  const [prevFormKey, setPrevFormKey] = useState("closed")
  const [formData, setFormData] = useState({
    cost: "",
    price: "",
    category: categories[0] || "Chung",
  })

  const formKey = open ? `${list?.id || "none"}:${item?.id || "none"}:${mode}` : "closed"

  if (formKey !== prevFormKey) {
    setPrevFormKey(formKey)
    setFormData({
      cost: initialValues.cost || "",
      price: initialValues.price || "",
      category: initialValues.category || categories[0] || "Chung",
    })
  }

  const isNewItem = mode === "new"

  const footer = (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="secondary" onClick={onClose}>
        Để sau
      </Button>
      <Button
        variant="primary"
        onClick={() =>
          onSubmit({
            cost: formData.cost,
            price: formData.price,
            category: formData.category,
          })
        }
      >
        Xác nhận nhập kho
      </Button>
    </div>
  )

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      title="Hoàn tất và nhập kho"
      footer={footer}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-xs font-bold text-amber-800 uppercase">
            Thông tin mặt hàng
          </div>
          <div className="mt-2 text-base font-bold text-rose-900">
            {item?.name}
          </div>
          <div className="mt-1 text-sm text-amber-900">
            {formatInputNumber(item?.quantity || 0)} sp • {getWarehouseLabel(list?.warehouse)}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-rose-700 uppercase mb-2">
            Giá nhập (VNĐ)
          </label>
          <input
            inputMode="numeric"
            value={formatInputNumber(formData.cost)}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                cost: sanitizeNumberInput(event.target.value),
              }))
            }
            placeholder="Ví dụ: 120.000"
            className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-lg font-bold text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
          <p className="text-xs text-rose-600 mt-2">
            {isNewItem
              ? "Giá này sẽ được lưu làm giá vốn của sản phẩm mới."
              : "Sản phẩm này chưa có giá nhập gần nhất, nên cần bổ sung trước khi cộng kho."}
          </p>
        </div>

        {isNewItem ? (
          <>
            <div>
              <label className="block text-xs font-bold text-rose-700 uppercase mb-2">
                Giá bán (VNĐ)
              </label>
              <input
                inputMode="numeric"
                value={formatInputNumber(formData.price)}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: sanitizeNumberInput(event.target.value),
                  }))
                }
                placeholder="Ví dụ: 199.000"
                className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-lg font-bold text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-700 uppercase mb-2">
                Danh mục
              </label>
              <select
                value={formData.category}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </div>
    </SheetModal>
  )
}

export default PurchaseListCompleteModal
