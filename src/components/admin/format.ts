export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatNumber(n: number) {
  return n.toLocaleString();
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

export function pluralCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${pluralize(count, singular, plural)}`;
}
