import { useState } from "react";

export const useAssistantMode = () => {
  const [modelMode, setModelMode] = useState("standard");
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  return {
    modelMode,
    setModelMode,
    isModelSelectorOpen,
    setIsModelSelectorOpen,
  };
};
