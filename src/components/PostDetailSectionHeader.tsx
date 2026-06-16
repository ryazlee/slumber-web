type Props = {
  title: string;
};

export default function PostDetailSectionHeader({ title }: Props) {
  return (
    <div className="post-detail-section-header">
      <span className="post-detail-section-line" aria-hidden />
      <h2 className="post-detail-section-heading">{title}</h2>
      <span className="post-detail-section-line" aria-hidden />
    </div>
  );
}
