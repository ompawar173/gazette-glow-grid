// Standard browser localStorage provider for Supabase Auth
export function brokeredPreviewStorage() {
  if (typeof window === 'undefined') return undefined;
  return localStorage;
}
