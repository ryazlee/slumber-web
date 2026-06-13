import { useEffect, useState } from 'react';

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
};

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(raw: string, allowEmpty: boolean): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return allowEmpty ? '' : null;
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (!HEX_PATTERN.test(withHash)) return null;
  if (withHash.length === 4) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return withHash.toLowerCase();
}

export default function AdminColorField({ id, label, value, onChange, optional }: Props) {
  const [hexText, setHexText] = useState(value);

  useEffect(() => {
    setHexText(value);
  }, [value]);

  const pickerValue = normalizeHex(value, false) ?? '#000000';

  const commitHex = (raw: string) => {
    const normalized = normalizeHex(raw, Boolean(optional));
    if (normalized === null) return;
    onChange(normalized);
    setHexText(normalized);
  };

  return (
    <div className="admin-field">
      <label className="admin-label" htmlFor={id}>{label}</label>
      <div className="admin-color-field">
        <input
          id={id}
          className="admin-input admin-input-color"
          type="color"
          value={pickerValue}
          onChange={(e) => {
            onChange(e.target.value);
            setHexText(e.target.value);
          }}
          aria-label={`${label} color picker`}
        />
        <input
          className="admin-input admin-color-hex"
          type="text"
          value={hexText}
          placeholder={optional ? 'Optional' : '#9B7EDE'}
          spellCheck={false}
          onChange={(e) => setHexText(e.target.value)}
          onBlur={(e) => commitHex(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitHex(hexText);
            }
          }}
        />
      </div>
    </div>
  );
}
