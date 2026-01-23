/**
 * Utility for handling Haptic Feedback (Vibration)
 * Note: specific to Android devices. iOS Safari does not support navigator.vibrate.
 */

export const HAPTIC_PATTERNS = {
  light: 20, // Slightly increased from 15ms for better perceptibility
  medium: 50, // Standard feedback
  heavy: 100, // Strong feedback
  success: [50, 50, 50],
  error: [50, 100, 50, 100],
  selection: 10,
};

export const triggerHaptic = (pattern = HAPTIC_PATTERNS.light) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn("Haptic warning:", e);
    }
  }
};
