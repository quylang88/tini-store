import React from "react";

const AppHeader = ({ className = "", isScrolled = false }) => {
  return (
    <div
      className={`absolute top-0 left-0 right-0 z-20 px-4 py-0 bg-amber-50 transition-shadow duration-200 ${
        isScrolled ? "shadow-sm" : "shadow-none"
      } ${className}`}
    >
      <div className="flex items-center justify-center gap-2">
        <img
          src="/tiny-shop-transparent.png"
          alt="Tiny Shop"
          className="h-[75px] w-auto object-contain drop-shadow-md filter contrast-125 saturate-130"
        />
      </div>
    </div>
  );
};

export default AppHeader;
