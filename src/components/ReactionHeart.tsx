import { REACTION_EMOJI_ACTIVE } from '../lib/reactionEmojis';
import { HeartOutlineIcon } from './icons/SocialIcons';

type Props = {
  liked: boolean;
  size?: 'sm' | 'md';
};

const ICON_SIZE = { sm: 16, md: 20 } as const;
const EMOJI_SIZE = { sm: 16, md: 18 } as const;

/** Post kudos + comment likes — outline heart when inactive, 🫶 when liked. */
export default function ReactionHeart({ liked, size = 'md' }: Props) {
  const px = ICON_SIZE[size];

  if (liked) {
    return (
      <span
        className="social-icon-slot reaction-heart-emoji"
        style={{ width: px, height: px, minWidth: px, minHeight: px, fontSize: EMOJI_SIZE[size] }}
        aria-hidden
      >
        {REACTION_EMOJI_ACTIVE}
      </span>
    );
  }

  return <HeartOutlineIcon size={px} className="social-icon-muted" />;
}
