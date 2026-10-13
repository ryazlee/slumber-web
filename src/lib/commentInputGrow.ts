import { useLayoutEffect, type RefObject } from 'react';

/** Match app comment fields: grow until 4 lines, then scroll. */
export const WEB_COMMENT_INPUT_MAX_LINES = 4;

/** Notes and other writing fields. CSS min-height still wins as the floor. */
export const WEB_TEXT_AREA_MAX_LINES = 12;

/** Autosize a textarea up to `maxLines`, then clip + scroll. */
export function autosizeTextarea(
  el: HTMLTextAreaElement | null,
  maxLines = WEB_COMMENT_INPUT_MAX_LINES,
) {
  if (!el) return;
  const styles = window.getComputedStyle(el);
  const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
  const padTop = Number.parseFloat(styles.paddingTop) || 0;
  const padBottom = Number.parseFloat(styles.paddingBottom) || 0;
  const borderY = (Number.parseFloat(styles.borderTopWidth) || 0)
    + (Number.parseFloat(styles.borderBottomWidth) || 0);
  const borderBox = styles.boxSizing === 'border-box';
  const chrome = padTop + padBottom + (borderBox ? borderY : 0);
  const cssMin = Number.parseFloat(styles.minHeight);
  const cssMax = Number.parseFloat(styles.maxHeight);
  const minHeight = Math.max(lineHeight + chrome, Number.isFinite(cssMin) ? cssMin : 0);
  let maxHeight = Math.max(minHeight, lineHeight * maxLines + chrome);
  if (Number.isFinite(cssMax)) maxHeight = Math.max(minHeight, Math.min(maxHeight, cssMax));

  // A CSS min-height keeps the used box at one line, so scrollHeight never
  // reports the wrapped text and the field looks stuck. Clear it while measuring.
  // Height 0 first: measuring border-box scrollHeight against a set height
  // otherwise grows the box on every keystroke, even for one line.
  const prevMin = el.style.minHeight;
  const prevMax = el.style.maxHeight;
  const prevOverflow = el.style.overflowY;
  el.style.minHeight = '0px';
  el.style.maxHeight = 'none';
  el.style.overflowY = 'hidden';
  el.style.height = '0px';
  const needed = el.scrollHeight + (borderBox ? borderY : 0);
  el.style.minHeight = prevMin;
  el.style.maxHeight = prevMax;
  el.style.overflowY = prevOverflow;
  const next = Math.min(Math.max(needed, minHeight), maxHeight);
  el.style.height = `${Math.ceil(next)}px`;
  el.style.overflowY = needed > maxHeight + 1 ? 'auto' : 'hidden';
}

/** @deprecated Use `autosizeTextarea`. */
export const autosizeCommentTextarea = autosizeTextarea;

/** Keep a textarea height in sync with its value. */
export function useAutosizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  maxLines = WEB_COMMENT_INPUT_MAX_LINES,
) {
  useLayoutEffect(() => {
    autosizeTextarea(ref.current, maxLines);
  }, [ref, value, maxLines]);
}

/** @deprecated Use `useAutosizeTextarea` or `GrowingTextarea`. */
export const useAutosizeCommentTextarea = useAutosizeTextarea;
