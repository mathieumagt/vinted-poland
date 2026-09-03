const BUNDLE_TITLE_PATTERN = /^lot\s+(\d+)\s+articles?$/i;

/** DOTB auto-generates French titles for multi-item bundle orders (e.g. "Lot 2 articles")
 * while single-item titles are the actual (French) Vinted listing title, which we leave
 * untouched. Only the auto-generated bundle title gets swapped for an English equivalent. */
export function formatOrderTitle(title: string): string {
  const match = title.match(BUNDLE_TITLE_PATTERN);
  if (!match) return title;
  const count = Number(match[1]);
  return `Bundle of ${count} item${count === 1 ? "" : "s"}`;
}
