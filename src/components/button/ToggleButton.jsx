import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToggleButton = memo(({
    isActive,
    onClick,
    activeIcon: ActiveIcon,
    inactiveIcon: InactiveIcon,
    label,
    className = "",
    // Fallback if only one icon component is passed
    icon: SingleIcon
}) => {
    // Determine which icon to show
    // If active and ActiveIcon exists, use it.
    // Else if inactive and InactiveIcon exists, use it.
    // Fallback to SingleIcon or null.

    const CurrentIcon = isActive
        ? (ActiveIcon || SingleIcon)
        : (InactiveIcon || SingleIcon);

    return (
        <motion.button
            onClick={onClick}
            layout // Enable layout animation for size/position changes
            className={`relative flex items-center justify-center rounded-xl transition-colors w-[42px] h-[42px] border flex-shrink-0 ${className} ${
                isActive
                    ? "bg-rose-200 border-rose-300 text-rose-800 shadow-sm"
                    : "bg-rose-100 border-rose-200 text-rose-600 active:bg-rose-200"
            }`}
            whileTap={{ scale: 0.95 }}
            aria-label={label}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={isActive ? "active" : "inactive"}
                    initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 15 }}
                    transition={{ duration: 0.2 }}
                >
                    {CurrentIcon && <CurrentIcon size={20} strokeWidth={2} />}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    );
});

ToggleButton.displayName = "ToggleButton";

export default ToggleButton;
