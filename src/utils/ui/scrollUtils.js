/**
 * Checks if the scrollable element is near the bottom.
 *
 * @param {HTMLElement} element - The scrollable DOM element.
 * @param {number} threshold - The distance in pixels from the bottom to trigger.
 * @returns {boolean}
 */
export const isScrollNearBottom = (element, threshold = 50) => {
  if (!element) return false;
  const { scrollTop, scrollHeight, clientHeight } = element;
  // Use >= to ensure it catches even if slightly past (though unlikely with scroll)
  // Check if scrollTop + clientHeight is within threshold of scrollHeight
  return scrollTop + clientHeight >= scrollHeight - threshold;
};
