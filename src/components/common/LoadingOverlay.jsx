import React from "react";
import { createPortal } from "react-dom";
import LoadingSpinner from "./LoadingSpinner";

const LoadingOverlay = ({ text, showText = true }) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <LoadingSpinner text={text} showText={showText} />
    </div>,
    document.body
  );
};

export default LoadingOverlay;
