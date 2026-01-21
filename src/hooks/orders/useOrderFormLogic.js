import { useState, useCallback } from "react";
import { sanitizeNumberInput } from "../../utils/formatters/formatters";

const DEFAULT_ORDER_TYPE = "delivery";

const useOrderFormLogic = () => {
  const [orderType, setOrderType] = useState(DEFAULT_ORDER_TYPE);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [shippingFee, setShippingFee] = useState("");
  const [orderComment, setOrderComment] = useState("");

  const handleOrderTypeChange = useCallback((value) => {
    setOrderType(value);
    if (value === "warehouse") {
      // Chuyển sang bán tại kho thì xoá thông tin gửi khách và phí gửi.
      setCustomerName("");
      setCustomerAddress("");
      setShippingFee("");
    }
  }, []);

  const handleShippingFeeChange = useCallback((value) => {
    // Chỉ cho phép nhập số để đảm bảo phí gửi hợp lệ.
    const sanitized = sanitizeNumberInput(value);
    setShippingFee(sanitized);
  }, []);

  const clearOrderForm = useCallback(() => {
    setOrderType(DEFAULT_ORDER_TYPE);
    setCustomerName("");
    setCustomerAddress("");
    setShippingFee("");
    setOrderComment("");
  }, []);

  return {
    orderType,
    setOrderType: handleOrderTypeChange,
    customerName,
    setCustomerName,
    customerAddress,
    setCustomerAddress,
    shippingFee,
    setShippingFee: handleShippingFeeChange,
    orderComment,
    setOrderComment,
    clearOrderForm,
    // Expose raw setters if needed (e.g. for loading edit data)
    setOrderTypeRaw: setOrderType,
    setShippingFeeRaw: setShippingFee,
  };
};

export default useOrderFormLogic;
