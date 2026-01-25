import React, { useState, useEffect, useRef } from "react";
import { User, MapPin, ShoppingBag } from "lucide-react";
import { normalizeString } from "../../utils/formatters/formatUtils";

const CustomerAutocomplete = ({
  value,
  onChange,
  onSelect,
  customers = [],
  placeholder = "Tên khách hàng",
  error = false,
  highlightProps = {},
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // Filter customers based on input
  // Only show if value has length > 0
  const suggestions =
    value && value.trim().length > 0
      ? customers
          .filter((c) =>
            normalizeString(c.name).includes(normalizeString(value)),
          )
          .slice(0, 5)
      : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (customer) => {
    onSelect(customer);
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full border rounded-xl px-3 py-2 pl-9 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-200 ${
            error ? "border-red-500 bg-red-50" : "border-rose-200"
          }`}
          {...highlightProps}
        />
        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          {suggestions.map((customer) => (
            <div
              key={customer.id}
              onClick={() => handleSelect(customer)}
              className="px-4 py-3 hover:bg-rose-50 cursor-pointer border-b border-gray-50 last:border-0"
            >
              <div className="flex justify-between items-start">
                <div className="font-medium text-gray-900">{customer.name}</div>
                <div className="flex items-center text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  {customer.totalOrders} đơn
                </div>
              </div>
              {customer.addresses && customer.addresses.length > 0 && (
                <div className="flex items-center mt-1 text-xs text-gray-500 truncate">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{customer.addresses[0]}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerAutocomplete;
