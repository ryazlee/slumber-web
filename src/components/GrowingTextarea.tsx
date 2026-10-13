import { forwardRef, useCallback, useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';
import { WEB_TEXT_AREA_MAX_LINES, autosizeTextarea } from '../lib/commentInputGrow';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Grow until this many lines, then scroll. CSS min-height stays the floor. */
  maxLines?: number;
};

/**
 * Multiline field that grows with its text. Pass `maxLines` to cap it.
 * One line stays at the CSS min-height.
 */
const GrowingTextarea = forwardRef<HTMLTextAreaElement, Props>(function GrowingTextarea({
  maxLines = WEB_TEXT_AREA_MAX_LINES,
  value,
  rows = 1,
  className,
  onInput,
  ...rest
}, ref) {
  const localRef = useRef<HTMLTextAreaElement>(null);

  const setRef = useCallback((node: HTMLTextAreaElement | null) => {
    localRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref]);

  useLayoutEffect(() => {
    autosizeTextarea(localRef.current, maxLines);
  }, [value, maxLines]);

  return (
    <textarea
      {...rest}
      ref={setRef}
      rows={rows}
      value={value}
      onInput={(event) => {
        onInput?.(event);
        // Size from the live DOM value on the keystroke, before paint.
        autosizeTextarea(event.currentTarget, maxLines);
      }}
      className={['growing-textarea', className].filter(Boolean).join(' ')}
    />
  );
});

export default GrowingTextarea;
