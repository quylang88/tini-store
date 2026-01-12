import React from 'react';
import { Package, Plus, Truck } from 'lucide-react';
import ConfirmModal from '../components/modals/ConfirmModal';
import ModalShell from '../components/modals/ModalShell';
import InboundCreateView from '../components/inbound/InboundCreateView';
import useInboundLogic from '../hooks/useInboundLogic';
import { formatInputNumber, formatNumber } from '../utils/helpers';
import { getWarehouseLabel } from '../utils/warehouseUtils';

const Inbound = ({
  products,
  setProducts,
  inboundShipments,
  setInboundShipments,
  settings,
}) => {
  const {
    view,
    shipmentModalOpen,
    setShipmentModalOpen,
    confirmModal,
    setConfirmModal,
    shipmentDraft,
    pendingPurchases,
    filteredProducts,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    handleStartCreate,
    handleExitCreate,
    handleShipmentItemChange,
    adjustQuantity,
    handleShipmentFieldChange,
    handleOpenShipmentModal,
    handleShipmentSave,
    handleReceiveShipment,
  } = useInboundLogic({
    products,
    setProducts,
    inboundShipments,
    setInboundShipments,
    settings,
  });

  const feeJpy = shipmentDraft.method === 'jp'
    ? Math.round((Number(shipmentDraft.weightKg) || 0) * 900)
    : 0;
  const feeVnd = shipmentDraft.method === 'jp'
    ? Math.round(feeJpy * (Number(settings.exchangeRate) || 0))
    : Number(shipmentDraft.feeVnd) || 0;

  // Màn hình danh sách kiện hàng.
  const renderListView = () => (
    <>
      <div className="bg-amber-50/90 sticky top-0 z-10 shadow-sm backdrop-blur">
        <div className="p-4 border-b border-amber-100 flex items-center justify-between">
          <img
            src="/tiny-shop-transparent.png"
            alt="Tiny Shop"
            className="h-12 w-auto object-contain"
          />
          <button
            onClick={handleStartCreate}
            className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-rose-200 active:scale-95 transition flex items-center gap-2"
          >
            <Plus size={18} /> Kiện hàng mới
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {inboundShipments.map((shipment) => {
          const shipmentLabel = `#${shipment.id.slice(-4)}`;
          const statusLabel = shipment.status === 'received' ? 'Đã nhập kho' : 'Đang vận chuyển';
          const statusClass = shipment.status === 'received'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
            : 'border-amber-200 bg-amber-50 text-amber-600';
          return (
            <div key={shipment.id} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-amber-900 text-lg">Kiện {shipmentLabel}</div>
                <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full border text-xs ${statusClass}`}>
                  {statusLabel}
                </span>
              </div>
              <div className="text-xs text-amber-700 font-semibold">
                Kho nhận: {getWarehouseLabel(shipment.warehouse)}
              </div>
              <div className="text-xs text-gray-500">
                Phí gửi: {formatNumber(shipment.feeVnd)}đ{shipment.method === 'jp' ? ` (${formatNumber(shipment.feeJpy)}¥)` : ''}
              </div>
              {shipment.method === 'jp' && (
                <div className="text-xs text-gray-500">Cân nặng: {shipment.weightKg}kg</div>
              )}
              {shipment.comment && (
                <div className="text-xs text-gray-500">Ghi chú: {shipment.comment}</div>
              )}
              <div className="text-xs text-gray-400">
                {new Date(shipment.createdAt).toLocaleString()}
              </div>
              <div className="pt-2 border-t border-dashed border-gray-200 space-y-1">
                {shipment.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm text-amber-800">
                    <span>{item.name}</span>
                    <span className="font-semibold">x{item.quantity}</span>
                  </div>
                ))}
              </div>
              {shipment.status !== 'received' && (
                <button
                  onClick={() => handleReceiveShipment(shipment.id)}
                  className="w-full mt-2 bg-rose-500 text-white py-2 rounded-xl font-semibold shadow-md shadow-rose-200 hover:bg-rose-600 transition flex items-center justify-center gap-2"
                >
                  <Package size={16} /> Nhập kho
                </button>
              )}
            </div>
          );
        })}
        {inboundShipments.length === 0 && (
          <div className="text-center text-gray-400 mt-16">
            <Truck size={36} className="mx-auto mb-2 opacity-30" />
            <p>Chưa có kiện hàng nào</p>
          </div>
        )}
      </div>
    </>
  );

  // Màn hình lên kiện: chọn sản phẩm trước, sau đó mới nhập kho nhận + phí gửi.
  const renderCreateView = () => (
    <InboundCreateView
      settings={settings}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      filteredProducts={filteredProducts}
      pendingCount={pendingPurchases.length}
      shipmentDraft={shipmentDraft}
      handleExitCreate={handleExitCreate}
      handleQuantityChange={handleShipmentItemChange}
      adjustQuantity={adjustQuantity}
      handleOpenShipmentModal={handleOpenShipmentModal}
    />
  );

  return (
    <div className="flex flex-col h-full bg-transparent">
      {view === 'list' ? renderListView() : renderCreateView()}

      {/* Modal cấu hình kho nhận & phí gửi sau khi chọn sản phẩm */}
      <ModalShell open={shipmentModalOpen} onClose={() => setShipmentModalOpen(false)}>
        <div className="p-4 border-b border-amber-100 bg-amber-50">
          <div className="text-lg font-bold text-amber-900">Thông tin kiện hàng</div>
          <div className="text-xs text-amber-600">Chọn kho nhận và phí gửi theo nguồn hàng.</div>
        </div>
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-amber-700">Kho nhận</label>
            <div className="flex gap-2 mt-2">
              {['daLat', 'vinhPhuc'].map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleShipmentFieldChange('warehouse')(key)}
                  className={`px-3 py-1 rounded-full border text-xs font-semibold transition ${
                    shipmentDraft.warehouse === key
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-white text-amber-700 border-amber-200 hover:border-rose-300'
                  }`}
                >
                  {getWarehouseLabel(key)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
            <div className="text-[10px] font-bold text-amber-800 uppercase">Phí gửi về kho</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleShipmentFieldChange('method')('vn')}
                className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                  shipmentDraft.method === 'vn'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-transparent text-amber-700 border-amber-200 hover:border-rose-400'
                }`}
              >
                Mua tại VN
              </button>
              <button
                type="button"
                onClick={() => handleShipmentFieldChange('method')('jp')}
                className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                  shipmentDraft.method === 'jp'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-transparent text-amber-700 border-amber-200 hover:border-rose-400'
                }`}
              >
                Mua tại Nhật
              </button>
            </div>
            {shipmentDraft.method === 'vn' ? (
              <div>
                <label className="text-[10px] font-bold text-amber-800 uppercase">Phí gửi (VNĐ)</label>
                <input
                  inputMode="numeric"
                  className="w-full bg-transparent border-b border-amber-100 py-2 focus:border-amber-400 outline-none text-amber-900 font-bold"
                  value={formatInputNumber(shipmentDraft.feeVnd)}
                  onChange={(event) => handleShipmentFieldChange('feeVnd')(event.target.value)}
                  placeholder="0"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-800 uppercase">Nhập cân (kg)</label>
                <input
                  inputMode="decimal"
                  className="w-full bg-transparent border-b border-amber-100 py-2 focus:border-amber-400 outline-none text-amber-900 font-bold"
                  value={shipmentDraft.weightKg}
                  onChange={(event) => handleShipmentFieldChange('weightKg')(event.target.value)}
                  placeholder="0"
                />
                <div className="text-xs text-amber-700 font-semibold">
                  Phí gửi: {formatNumber(feeJpy)}¥ (~{formatNumber(feeVnd)}đ)
                </div>
                <div className="text-[10px] text-amber-500">Tự tính theo 900 yên / 1kg.</div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-amber-700">Ghi chú kiện hàng</label>
            <textarea
              rows={3}
              className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
              value={shipmentDraft.comment}
              onChange={(event) => handleShipmentFieldChange('comment')(event.target.value)}
              placeholder="Ví dụ: gom cùng đơn khách A..."
            />
          </div>
          {shipmentDraft.error && (
            <div className="text-xs text-red-500">{shipmentDraft.error}</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShipmentModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-amber-200 text-amber-700 font-semibold bg-white hover:bg-amber-50 transition"
            >
              Đóng
            </button>
            <button
              onClick={handleShipmentSave}
              className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-semibold shadow-md shadow-rose-200 hover:bg-rose-600 transition"
            >
              Lưu kiện hàng
            </button>
          </div>
        </div>
      </ModalShell>

      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmLabel={confirmModal?.confirmLabel}
        tone={confirmModal?.tone}
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => {
          confirmModal?.onConfirm?.();
          setConfirmModal(null);
        }}
      />
    </div>
  );
};

export default Inbound;
