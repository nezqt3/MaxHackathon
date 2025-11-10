import { useCallback, useEffect, useRef } from "react";

const getTouchById = (touchList, identifier) =>
  Array.from(touchList ?? []).find((touch) => touch.identifier === identifier);

const useSwipeNavigation = ({ enabled = false, threshold = 60, onSwipe = () => {} }) => {
  const swipeSessionRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    target: null,
  });

  const clearSwipeSession = useCallback(() => {
    const { pointerId, target } = swipeSessionRef.current;

    if (pointerId !== null && target?.releasePointerCapture) {
      try {
        target.releasePointerCapture(pointerId);
      } catch {
        /* noop */
      }
    }

    swipeSessionRef.current.pointerId = null;
    swipeSessionRef.current.startX = 0;
    swipeSessionRef.current.startY = 0;
    swipeSessionRef.current.target = null;
  }, []);

  const startSwipe = useCallback(
    (x, y, pointerId, target) => {
      if (!enabled || swipeSessionRef.current.pointerId !== null) {
        return;
      }

      swipeSessionRef.current.pointerId = pointerId;
      swipeSessionRef.current.startX = x;
      swipeSessionRef.current.startY = y;
      swipeSessionRef.current.target = target ?? null;
    },
    [enabled],
  );

  const finishSwipe = useCallback(
    (x, y, pointerId) => {
      if (swipeSessionRef.current.pointerId !== pointerId) {
        return;
      }

      const deltaX = x - swipeSessionRef.current.startX;
      const deltaY = y - swipeSessionRef.current.startY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        onSwipe(deltaX < 0 ? 1 : -1);
      }

      clearSwipeSession();
    },
    [clearSwipeSession, onSwipe, threshold],
  );

  const cancelSwipe = useCallback(
    (pointerId) => {
      if (swipeSessionRef.current.pointerId !== pointerId) {
        return;
      }

      clearSwipeSession();
    },
    [clearSwipeSession],
  );

  const handlePointerDown = useCallback(
    (event) => {
      if (
        !enabled ||
        swipeSessionRef.current.pointerId !== null ||
        (event.pointerType === "mouse" && event.button !== 0)
      ) {
        return;
      }

      startSwipe(event.clientX, event.clientY, event.pointerId, event.currentTarget);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [enabled, startSwipe],
  );

  const handlePointerUp = useCallback(
    (event) => {
      finishSwipe(event.clientX, event.clientY, event.pointerId);
    },
    [finishSwipe],
  );

  const handlePointerCancel = useCallback(
    (event) => {
      cancelSwipe(event.pointerId);
    },
    [cancelSwipe],
  );

  const handleTouchStart = useCallback(
    (event) => {
      if (!enabled || swipeSessionRef.current.pointerId !== null) {
        return;
      }

      const touch = event.touches[0];

      if (!touch) {
        return;
      }

      startSwipe(touch.clientX, touch.clientY, touch.identifier, event.currentTarget);
    },
    [enabled, startSwipe],
  );

  const handleTouchEnd = useCallback(
    (event) => {
      const touch = getTouchById(event.changedTouches, swipeSessionRef.current.pointerId);

      if (!touch) {
        return;
      }

      finishSwipe(touch.clientX, touch.clientY, touch.identifier);
    },
    [finishSwipe],
  );

  const handleTouchCancel = useCallback(
    (event) => {
      const touch = getTouchById(event.changedTouches, swipeSessionRef.current.pointerId);

      if (!touch) {
        return;
      }

      cancelSwipe(touch.identifier);
    },
    [cancelSwipe],
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      clearSwipeSession();
      return undefined;
    }

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [
    clearSwipeSession,
    enabled,
    handlePointerCancel,
    handlePointerUp,
    handleTouchCancel,
    handleTouchEnd,
  ]);

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };
};

export default useSwipeNavigation;
