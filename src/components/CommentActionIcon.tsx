import { ChatBubbleOutlineIcon } from './icons/SocialIcons';

type Props = {
  size?: number;
};

export default function CommentActionIcon({ size = 20 }: Props) {
  return <ChatBubbleOutlineIcon size={size} className="social-icon-muted" />;
}
