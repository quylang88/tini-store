import { useRef, useEffect, useCallback } from "react";

const useLongPress = (
  callback,
  { speed = 100, delay = 500, enabled = true } = {}
) => {
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const isPressingRef = useRef(false);

  const start = useCallback(() => {
    if (!enabled) return;
    if (isPressingRef.current) return;
    isPressingRef.current = true;
    callback(); // Fire immediately

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        callback();
      }, speed);
    }, delay);
  }, [callback, delay, enabled, speed]);

  const stop = useCallback(() => {
    isPressingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
