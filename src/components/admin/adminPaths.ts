/** Deep-link into the Users admin page, opening the detail panel when an id is known. */
export function adminUserPath(opts: {
  id?: string | null;
  username?: string | null;
}): string | null {
  const id = opts.id?.trim();
  if (id) return `/admin/users?user=${encodeURIComponent(id)}`;
  const username = opts.username?.trim().replace(/^@/, '');
  if (username) return `/admin/users?q=${encodeURIComponent(username)}`;
  return null;
}
