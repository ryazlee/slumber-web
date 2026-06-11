import { useEffect, useState } from 'react';
import { formatTagChip, loadTags } from '../lib/tags';

type Props = {
  tags: string[];
};

export default function PostTagList({ tags }: Props) {
  const [, setReady] = useState(false);

  useEffect(() => {
    loadTags().then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  if (!tags.length) return null;

  return (
    <div className="post-tags">
      {tags.map((tag) => (
        <span key={tag} className="post-tag">{formatTagChip(tag)}</span>
      ))}
    </div>
  );
}
