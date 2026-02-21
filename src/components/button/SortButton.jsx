import React, { memo, useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CalendarArrowDown,
  CalendarArrowUp,
} from "lucide-react";
import ToggleButton from "./ToggleButton";

// Use a static map to avoid any ambiguity about component creation
const ICON_MAP = {
  price: {
    asc: ArrowUpNarrowWide,
    desc: ArrowDownWideNarrow,
  },
  date: {
    asc: CalendarArrowUp,
    desc: CalendarArrowDown,
  },
  default: {
    asc: ArrowUp,
    desc: ArrowDown,
  },
};

const SortButton = memo(
  ({
    active,
    onClick,
    icon: DefaultIcon, // Icon passed from parent (e.g. DollarSign, Calendar)
    direction,
    label,
    sortType,
    className = "",
  }) => {
    // Select the correct icon component based on direction and type
    // If active, show the directional icon.
    // If inactive, show the DefaultIcon (generic type icon).

    const ActiveDirectionIcon = useMemo(
      () =>
        ICON_MAP[sortType]?.[direction] ||
        ICON_MAP.default[direction] ||
        ArrowDown,
      [sortType, direction],
    );

    return (
      <ToggleButton
        isActive={active}
        onClick={onClick}
        activeIcon={ActiveDirectionIcon}
        inactiveIcon={DefaultIcon}
        label={label}
        className={`w-10 h-10 rounded-lg ${className}`} // Override size to match original SortButton (w-10 h-10) if needed, or stick to w-[42px] default
      />
    );
  },
);

SortButton.displayName = "SortButton";

export default SortButton;
