import { useState, useRef } from "react";

/**
 * useScrollHandling
 * Manages visibility of UI elements based on scroll direction and position.
 *
 * @param {Object} config
 * @param {'staged' | 'simple'} config.mode - 'staged' (Header hides after short scroll) or 'simple' (only TabBar/AddButton hide).
 * @param {Function} config.setTabBarVisible - Optional callback to control global TabBar.
 * @param {number} config.searchHideThreshold - Custom threshold for hiding search bar (default 60).
 * @returns {Object} { isSearchVisible, isAddButtonVisible, handleScroll, isScrolled }
 */
const useScrollHandling = ({
  mode = "staged",
  setTabBarVisible,
  searchHideThreshold = 60,
} = {}) => {
  const [isSearchVisible, setSearchVisible] = useState(true); // For Header/Search
  const [isAddButtonVisible, setAddButtonVisible] = useState(true); // For FAB
  const [isScrolled, setIsScrolled] = useState(false); // For Header shadow

  const lastScrollTop = useRef(0);
  const scrollThreshold = 10; // Minimum delta to trigger change

  const handleScroll = (e) => {
    const target = e.target;
    const currentScrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    const diff = currentScrollTop - lastScrollTop.current;
    const direction = diff > 0 ? "down" : "up";

    // Update 'isScrolled' (shadow effect)
    setIsScrolled(currentScrollTop > 10);

    // Ignore rubber-band effect (negative scroll)
    if (currentScrollTop < 0) return;

    // Ignore bouncing at the bottom
    const isNearBottom = currentScrollTop + clientHeight > scrollHeight - 50;

    // Debounce/Threshold check
    if (Math.abs(diff) < scrollThreshold) return;

    if (mode === "simple") {
      // Simple Mode: Only toggle TabBar/FAB
      if (direction === "down") {
        setAddButtonVisible(false);
        if (setTabBarVisible) setTabBarVisible(false);
      } else if (!isNearBottom) {
        setAddButtonVisible(true);
        if (setTabBarVisible) setTabBarVisible(true);
      }
    } else if (mode === "staged") {
      // Staged Mode:
      // Down -> TabBar hides immediately. Search hides after threshold.
      // Up -> All show immediately.

      if (direction === "down") {
        // Hide TabBar immediately
        setAddButtonVisible(false);
        if (setTabBarVisible) setTabBarVisible(false);

        // Hide Search if scrolled down enough (past the threshold)
        // OR if we are deep in the list.
        if (currentScrollTop > searchHideThreshold) {
          setSearchVisible(false);
        }
      } else {
        // Scrolling Up
        if (!isNearBottom) {
          // Show everything
          setAddButtonVisible(true);
          setSearchVisible(true);
          if (setTabBarVisible) setTabBarVisible(true);
        }
      }
    }

    lastScrollTop.current = currentScrollTop;
  };

  // Helper to force reset (e.g., when changing tabs)
  const resetScrollState = () => {
    setSearchVisible(true);
    setAddButtonVisible(true);
    if (setTabBarVisible) setTabBarVisible(true);
    setIsScrolled(false);
  };

  return {
    isSearchVisible,
    isAddButtonVisible,
    isScrolled,
    handleScroll,
    resetScrollState,
  };
};

export default useScrollHandling;
