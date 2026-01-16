import React from "react";

const AppHeader = ({ className = "" }) => {
  return (
    <div
      className={`absolute top-0 left-0 right-0 z-20 p-4 pb-2 bg-gradient-to-b from-amber-50/95 to-amber-50/80 backdrop-blur-md shadow-sm ${className}`}
    >
      <div className="flex items-center justify-center gap-2">
        <img
          src="/tiny-shop-transparent.png"
          alt="Tiny Shop"
          className="h-14 w-auto object-contain drop-shadow-md filter contrast-125 saturate-150"
        />
      </div>
    </div>
  );
};

export default AppHeader;
