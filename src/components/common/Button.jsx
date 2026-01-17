import React from "react";

const variants = {
  primary:
    "bg-rose-500 text-white shadow-lg shadow-rose-200 active:bg-rose-600 active:scale-95",
  secondary:
    "border border-rose-200 text-rose-700 bg-white shadow-sm active:bg-rose-50 active:scale-95",
  sheetClose:
    "border border-rose-300 bg-rose-100 text-rose-900 active:border-rose-400 active:bg-rose-200",
  danger: "bg-rose-500 text-white shadow-md shadow-rose-200 active:scale-95",
  softDanger:
    "bg-rose-50 text-rose-600 border border-rose-100 active:bg-rose-100 active:scale-95",
};

const sizes = {
  md: "py-3 rounded-xl font-bold",
  sm: "py-2.5 rounded-xl font-semibold text-sm",
};

const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <button
      className={`w-full transition ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
