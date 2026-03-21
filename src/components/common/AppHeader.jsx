import React from "react";

const AppHeader = ({
  className = "",
  isScrolled = false,
  leftSlot = null,
  rightSlot = null,
}) => {
  return (
    <div
      className={`absolute top-0 left-0 right-0 z-20 px-4 py-0 bg-rose-50 transition-shadow duration-200 pt-[env(safe-area-inset-top)] ${
        isScrolled ? "shadow-sm" : "shadow-none"
      } ${className}`}
    >
      <div className="relative flex items-center justify-center gap-2 min-h-[75px]">
        {leftSlot && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            {leftSlot}
          </div>
        )}
        <img
          src="/tiny-shop-transparent.png"
          alt="Tiny Shop"
          className="h-[75px] w-auto object-contain drop-shadow-md filter contrast-125 saturate-130"
        />
        {rightSlot && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppHeader;
