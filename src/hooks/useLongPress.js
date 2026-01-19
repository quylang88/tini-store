import { useRef, useEffect, useCallback } from "react";

const useLongPress = (
  callback,
  {
    speed = 100, // Base speed (ms between calls)
    delay = 500, // Initial delay before repeating starts
    enabled = true,
    accelerate = false, // Enable acceleration
    maxSpeed = 30, // Fastest speed (min ms)
    accelerationStep = 0.8, // Multiply interval by this factor
  } = {}
) => {
  const timeoutRef = useRef(null);
  const isPressingRef = useRef(false);
  const currentSpeedRef = useRef(speed);

  // Helper to run the loop with dynamic speed
  const loop = useCallback(() => {
    if (!isPressingRef.current || !enabled) return;

    callback();

    if (accelerate) {
      currentSpeedRef.current = Math.max(
        currentSpeedRef.current * accelerationStep,
        maxSpeed
      );
    }

    timeoutRef.current = setTimeout(loop, currentSpeedRef.current);
  }, [callback, enabled, accelerate, maxSpeed, accelerationStep]);

  const start = useCallback(
    (e) => {
      // Note: We don't preventDefault here to allow click events if needed,
      // but users of this hook might want to if it conflicts with scrolling.
      if (!enabled) return;
      if (isPressingRef.current) return;

      isPressingRef.current = true;
      currentSpeedRef.current = speed; // Reset speed

      // Remove immediate callback to prevent conflict with onClick (double tap issue)
      // callback(); // Fire immediately

      timeoutRef.current = setTimeout(() => {
        // Start the loop
        loop();
      }, delay);
    },
    [callback, delay, enabled, speed, loop]
  );

  const stop = useCallback(() => {
    isPressingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return stop; // Cleanup
  }, [stop]);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
};

export default useLongPress;
