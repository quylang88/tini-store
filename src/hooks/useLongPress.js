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
  const loopRef = useRef(null);

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

    // Call loop via ref to avoid "access before declaration" errors
    timeoutRef.current = setTimeout(() => {
      if (loopRef.current) loopRef.current();
    }, currentSpeedRef.current);
  }, [callback, enabled, accelerate, maxSpeed, accelerationStep]);

  // Keep the loop ref up to date
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const start = useCallback(
    () => {
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
    [delay, enabled, speed, loop]
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
