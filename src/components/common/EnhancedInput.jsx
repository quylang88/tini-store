import React from "react";
import { X } from "lucide-react";

/**
 * EnhancedInput
 *
 * A reusable input component optimized for PWA/Mobile experience.
 * Features:
 * - Built-in "Clear" (X) button with large touch target.
 * - Hides native WebKit search decorations (double X issue).
 * - Flexible styling and icon support.
 */
const EnhancedInput = ({
  value,
  onChange,
  onClear,
  placeholder,
  className = "",
  inputClassName = "",
  startIcon,
  endIcon,
  type = "text",
  disabled = false,
  ...props
}) => {
  const hasValue = Boolean(value);

  return (
    <div className={`relative ${className}`}>
      {/* Start Icon (e.g., Search Icon) */}
      {startIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          {startIcon}
        </div>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputClassName} [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none`}
        style={{ WebkitAppearance: "none" }}
        {...props}
      />

      {/* End Icon or Clear Button */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3">
        {hasValue && onClear ? (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            // Large touch target: top/bottom 0
            className="h-full px-3 flex items-center justify-center text-gray-400 active:text-gray-600 transition-colors"
            aria-label="Xoá nội dung"
          >
            <X size={16} />
          </button>
        ) : (
          endIcon && <div className="pointer-events-none">{endIcon}</div>
        )}
      </div>
    </div>
  );
};

export default EnhancedInput;
