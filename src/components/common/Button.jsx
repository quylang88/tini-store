import React from 'react';

const variants = {
  primary: "bg-rose-500 text-white shadow-lg shadow-rose-200 active:scale-95",
  secondary: "border border-amber-200 text-amber-700 bg-white shadow-sm active:bg-amber-50 active:scale-95",
  sheetClose: "border border-amber-300 bg-amber-100 text-amber-900 active:border-amber-400 active:bg-amber-200",
  danger: "bg-red-500 text-white shadow-md shadow-red-200 active:scale-95",
};

const sizes = {
  md: "py-3 rounded-xl font-bold",
  sm: "py-2.5 rounded-xl font-semibold text-sm",
};

const Button = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => {
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
