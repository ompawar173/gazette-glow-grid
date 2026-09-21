export function slugify(text: string): string {
  let input = (text ?? "").trim();
  // If a full URL was pasted, use its last meaningful path segment.
  const urlMatch = input.match(/^https?:\/\/[^\s]+$/i);
  if (urlMatch) {
    const withoutQuery = input.split(/[?#]/)[0] ?? input;
    const parts = withoutQuery.replace(/^https?:\/\//i, "").split("/").filter(Boolean);
    input = parts.length > 1 ? (parts[parts.length - 1] as string) : (parts[0] ?? input);
  }
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
