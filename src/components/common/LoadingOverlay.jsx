import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const LoadingOverlay = ({ text, showText = true }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <LoadingSpinner text={text} showText={showText} />
    </div>
  );
};

export default LoadingOverlay;
