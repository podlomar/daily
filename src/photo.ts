const GOOGLE_PHOTOS_HOSTS = ['photos.app.goo.gl', 'photos.google.com'];

function isGooglePhotosUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return GOOGLE_PHOTOS_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

// Strip Google image-serving size params (=w…-h…-etc) and query string,
// leaving only the base CDN path so we can append our own size params later.
// Strip Google image-serving size params (=w…-h…-etc) from the pathname
// but preserve the query string (e.g. ?authuser=0) which is needed for private photos.
function stripGoogleImageParams(url: string): string {
  try {
    const u = new URL(url);
    const basePath = u.pathname.replace(/=[^/]*$/, '');
    return `${u.protocol}//${u.host}${basePath}${u.search}`;
  } catch {
    return url;
  }
}

export async function resolvePhotoUrl(url: string): Promise<string> {
  if (!isGooglePhotosUrl(url)) {
    return url;
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; daily-app/1.0)' },
    });

    if (!res.ok) {
      console.warn(`resolvePhotoUrl: fetch returned ${res.status} for ${url}`);
      return url;
    }

    const html = await res.text();
    console.log(`resolvePhotoUrl: fetched ${html.length} bytes from ${url}`);

    // 1. og:image meta tag (server-rendered, most reliable)
    const ogImage = (
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ??
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)
    )?.[1];

    // 2. Any lh3.googleusercontent.com/pw/ URL in the raw source (embedded JSON/JS data)
    //    Handles both unescaped (https://) and JSON-escaped (https:\/\/) slashes
    const cdnRawMatch = html.match(/https:(?:\/\/|\\\/\\\/)lh3\.googleusercontent\.com\/pw\/([A-Za-z0-9_-]+)/);
    const cdnDirect = cdnRawMatch
      ? `https://lh3.googleusercontent.com/pw/${cdnRawMatch[1]}`
      : null;

    const rawUrl = ogImage ?? cdnDirect;

    if (!rawUrl) {
      console.warn(`resolvePhotoUrl: no image URL found — first 500 chars: ${html.slice(0, 500)}`);
      return url;
    }

    const cdnUrl = stripGoogleImageParams(rawUrl);
    console.log(`resolvePhotoUrl: resolved to ${cdnUrl}`);
    return cdnUrl;
  } catch (err) {
    console.warn(`resolvePhotoUrl: failed for ${url}:`, err);
    return url;
  }
}
