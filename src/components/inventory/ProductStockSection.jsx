import React from "react";
import {
  getWarehouses,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";

const ProductStockSection = ({ formData, setFormData, highlightOps }) => {
  const getHighlightProps = highlightOps?.getHighlightProps || (() => ({}));
  const isHighlighted = highlightOps?.isHighlighted || (() => false);
  const highlightClass = highlightOps?.highlightClass || "";

  return (
    <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-rose-800 uppercase">
          Tồn kho nhập về
        </div>
        <div className="flex gap-2">
          {getWarehouses().map((warehouse) => (
            <button
              key={warehouse.key}
              type="button"
              onClick={() =>
                setFormData({ ...formData, warehouse: warehouse.key })
              }
              className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                formData.warehouse === resolveWarehouseKey(warehouse.key)
                  ? "bg-rose-500 text-white border-rose-500"
                  : "bg-transparent text-rose-700 border-rose-200 active:border-rose-400"
              }`}
            >
              {warehouse.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-rose-800 uppercase">
            Số lượng
          </label>
          <input
            type="number"
            className={`w-full border-b border-rose-100 bg-transparent py-2 focus:border-rose-400 outline-none text-gray-900 font-bold text-lg ${
              isHighlighted("quantity") ? highlightClass : ""
            }`}
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: e.target.value })
            }
            placeholder="0"
            {...getHighlightProps("quantity", formData.quantity)}
          />
        </div>
        <div />
      </div>
    </div>
  );
};

export default ProductStockSection;
