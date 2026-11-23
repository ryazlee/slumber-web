/** Quiet accent circles — same language as the app's floating bubbles and stage dots. */
export default function AccentBubbles() {
  return (
    <div className="accent-bubbles" aria-hidden="true">
      <span className="accent-bubble accent-bubble--lg accent-bubble--accent" />
      <span className="accent-bubble accent-bubble--md accent-bubble--core" />
      <span className="accent-bubble accent-bubble--sm accent-bubble--rem" />
      <span className="accent-bubble accent-bubble--xs accent-bubble--deep" />
    </div>
  );
}
