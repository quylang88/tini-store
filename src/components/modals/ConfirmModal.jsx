import React from "react";
import ModalShell from "./ModalShell";
import Button from "../button/Button";

// ConfirmModal: Modal xác nhận trung tâm (Center Modal).
// Không có nút X, chỉ có title, message và 2 nút ở dưới.
const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Đóng",
  tone = "rose",
  onConfirm,
  onCancel,
}) => {
  const titleId = React.useId();
  const messageId = React.useId();

  return (
    <ModalShell
      open={open}
      onClose={onCancel}
      ariaLabelledBy={titleId}
      ariaDescribedBy={message ? messageId : undefined}
    >
      <div className="p-5 text-center">
        <h3 id={titleId} className="text-lg font-bold text-rose-900 mb-2">
          {title}
        </h3>
        {message && (
          <p id={messageId} className="text-sm text-gray-600 mb-6">
            {message}
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

export default ConfirmModal;
