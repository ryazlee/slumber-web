export function formatRecalcStagesError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message: string }).message);
    if (msg.includes('no_raw_samples')) return 'No raw_samples on this post.';
    if (msg.includes('manual_post')) return 'Manual posts are skipped.';
    if (msg.includes('post_not_found')) return 'Post not found.';
    return msg;
  }
  return 'Could not recalculate sleep stages.';
}
