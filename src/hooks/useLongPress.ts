import { useCallback, useRef } from 'react';

type Options = {
  delay?: number;
  disabled?: boolean;
};

/** Tap vs long-press — long-press skips the next click (matches native social rows). */
export function useLongPress(onLongPress: () => void, options: Options = {}) {
  const { delay = 400, disabled = false } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (disabled) return;
    longPressedRef.current = false;
    clearTimer();
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      onLongPress();
    }, delay);
  }, [clearTimer, delay, disabled, onLongPress]);

  const wrapClick = useCallback((onClick: () => void) => () => {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    onClick();
  }, []);

  const longPressProps = {
    onPointerDown: start,
    onPointerUp: clearTimer,
    onPointerLeave: clearTimer,
    onPointerCancel: clearTimer,
    onContextMenu: (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      longPressedRef.current = true;
      onLongPress();
    },
  };

  return { longPressProps, wrapClick };
}
