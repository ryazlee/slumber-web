import PostDetailSectionHeader from './PostDetailSectionHeader';
import { useVisiblePostTags } from '../hooks/useVisiblePostTags';

type Props = {
  tags: string[];
  isOwnPost?: boolean;
};

export default function PostTagList({ tags, isOwnPost = false }: Props) {
  const chips = useVisiblePostTags(tags, isOwnPost);
  if (!chips.length) return null;

  return (
    <div className="post-tags">
      {chips.map((chip) => (
        <span key={chip.value} className={chip.pending ? 'post-tag post-tag-pending' : 'post-tag'}>
          {chip.text}
          {chip.pending ? ' · Pending' : ''}
        </span>
      ))}
    </div>
  );
}

export function PostDetailFactors({ tags, isOwnPost = false }: Props) {
  const chips = useVisiblePostTags(tags, isOwnPost);
  if (!chips.length) return null;

  return (
    <>
      <PostDetailSectionHeader title="Factors" />
      <div className="post-detail-panel post-detail-tags">
        <div className="post-tags">
          {chips.map((chip) => (
            <span key={chip.value} className={chip.pending ? 'post-tag post-tag-pending' : 'post-tag'}>
              {chip.text}
              {chip.pending ? ' · Pending' : ''}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
