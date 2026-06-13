import { useId, useRef } from 'react';
import { EMOJI_PRESETS, singleEmoji } from './emoji';

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (emoji: string) => void;
  presets?: readonly string[];
  required?: boolean;
  hint?: string;
};

export default function AdminEmojiPicker({
  id: idProp,
  label,
  value,
  onChange,
  presets = EMOJI_PRESETS,
  required,
  hint = 'Tap a preset or the preview to type/paste one emoji.',
}: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  };

  return (
    <div className="admin-field admin-emoji-field">
      <span className="admin-label" id={`${id}-label`}>{label}</span>

      <div className="admin-emoji-picker" role="group" aria-labelledby={`${id}-label`}>
        <button
          type="button"
          className="admin-emoji-preview"
          onClick={openPicker}
          aria-label={value ? `Change emoji, currently ${value}` : 'Choose emoji'}
        >
          <span className="admin-emoji-preview-char" aria-hidden>
            {value || '＋'}
          </span>
          <span className="admin-emoji-preview-hint">{value ? 'Change' : 'Pick emoji'}</span>
        </button>

        <div className="admin-emoji-picker-side">
          <input
            ref={inputRef}
            id={id}
            className="admin-emoji-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            required={required}
            placeholder="Emoji"
            aria-label={`${label} text input`}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => onChange(singleEmoji(e.target.value))}
          />
          {value ? (
            <button
              type="button"
              className="admin-button admin-button-ghost admin-button-sm"
              onClick={() => onChange('')}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="admin-emoji-presets" role="list" aria-label="Emoji presets">
        {presets.map((emoji) => (
          <button
            key={emoji}
            type="button"
            role="listitem"
            className={`admin-emoji-preset${value === emoji ? ' admin-emoji-preset--active' : ''}`}
            aria-label={emoji}
            aria-pressed={value === emoji}
            onClick={() => onChange(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>

      {hint ? <p className="admin-field-hint">{hint}</p> : null}
    </div>
  );
}
