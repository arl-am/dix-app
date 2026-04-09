export function assetUrl(url: string): string {
  if (window.location.search && !url.startsWith('data:') && !url.includes('?')) {
    return url + window.location.search;
  }
  return url;
}
