import { IoMoonOutline, IoPhonePortraitOutline, IoSunnyOutline } from 'react-icons/io5';
import { useThemePreference } from '../context/ThemeContext';
import { cycleThemePreference, type ThemePreference } from '../lib/themePreference';

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof IoSunnyOutline }[] = [
  { value: 'system', label: 'System', Icon: IoPhonePortraitOutline },
  { value: 'light', label: 'Light', Icon: IoSunnyOutline },
  { value: 'dark', label: 'Dark', Icon: IoMoonOutline },
];

export default function ThemeToggle() {
  const { preference, setPreference } = useThemePreference();
  const current = OPTIONS.find((option) => option.value === preference) ?? OPTIONS[0];

  return (
    <div className="theme-toggle-slot">
      <div className="theme-toggle" role="radiogroup" aria-label="Theme">
        {OPTIONS.map((option) => {
          const selected = preference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              title={option.label}
              className="theme-toggle-btn"
              onClick={() => setPreference(option.value)}
            >
              <option.Icon aria-hidden size={15} />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="theme-toggle-bubble"
        aria-label={`Theme: ${current.label}. Switch theme.`}
        title={current.label}
        onClick={() => setPreference(cycleThemePreference(preference))}
      >
        <current.Icon aria-hidden size={16} />
      </button>
    </div>
  );
}
