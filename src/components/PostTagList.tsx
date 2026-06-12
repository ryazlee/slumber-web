import { formatTagChip } from '../lib/tags';
import { useTags } from '../hooks/useCatalog';

type Props = {
  tags: string[];
};

export default function PostTagList({ tags }: Props) {
  useTags();

  if (!tags.length) return null;

  return (
    <div className="post-tags">
      {tags.map((tag) => (
        <span key={tag} className="post-tag">{formatTagChip(tag)}</span>
      ))}
    </div>
  );
}
