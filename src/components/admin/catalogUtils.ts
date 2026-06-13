/** SCREAMING_SNAKE_CASE tag value from a human label. */
export function labelToTagValue(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}
