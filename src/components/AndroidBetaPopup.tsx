import Popup from './Popup';

export const ANDROID_BETA_EMAIL = 'useslumber@gmail.com';

const MAILTO = `mailto:${ANDROID_BETA_EMAIL}?subject=${encodeURIComponent(
  'Android closed beta',
)}&body=${encodeURIComponent(
  "Hi — I'd like to try the Slumber Android closed beta.\n\nMy Google / Play email:\n",
)}`;

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Closed-beta notice when someone taps Google Play on the marketing site. */
export default function AndroidBetaPopup({ open, onClose }: Props) {
  return (
    <Popup open={open} onClose={onClose} title="Android closed beta">
      <div className="android-beta-popup">
        <p>
          Android is in a closed beta right now. If you want to try it out, email{' '}
          <a href={MAILTO}>{ANDROID_BETA_EMAIL}</a> with the address you use for
          Google Play and the developer can add you to the list.
        </p>
        <a className="android-beta-popup-cta" href={MAILTO}>
          Email to join the beta
        </a>
      </div>
    </Popup>
  );
}
