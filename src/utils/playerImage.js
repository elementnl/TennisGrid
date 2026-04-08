const STORAGE_KEY = "tennisgrid_images";
const memoryCache = new Map();
const pending = new Map();

function loadStorageCache() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      for (const [k, v] of Object.entries(JSON.parse(saved))) {
        memoryCache.set(k, v);
      }
    }
  } catch {}
}
loadStorageCache();

function saveToStorage(key, url) {
  memoryCache.set(key, url);
  try {
    const obj = {};
    for (const [k, v] of memoryCache) {
      if (k.startsWith("wta_")) obj[k] = v;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {}
}

function getAtpHeadshotUrl(slug) {
  return `https://www.atptour.com/-/media/alias/player-headshot/${slug}`;
}

async function fetchWikidataImage(wikidataId) {
  try {
    const resp = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikidataId}&property=P18&format=json&origin=*`
    );
    if (!resp.ok) return null;

    const data = await resp.json();
    const claims = data.claims?.P18;
    if (!claims || claims.length === 0) return null;

    const filename = claims[0].mainsnak?.datavalue?.value;
    if (!filename) return null;

    const thumbResp = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&iiurlwidth=200&format=json&origin=*`
    );
    if (!thumbResp.ok) return null;

    const thumbData = await thumbResp.json();
    const pages = thumbData.query?.pages;
    if (!pages) return null;

    for (const page of Object.values(pages)) {
      const thumbUrl = page.imageinfo?.[0]?.thumburl;
      if (thumbUrl) return thumbUrl;
    }
  } catch {}
  return null;
}

export async function getPlayerImageUrl(player) {
  if (!player) return null;

  const cacheKey = player.id || player.name;

  if (memoryCache.has(cacheKey)) return memoryCache.get(cacheKey);

  if (player.atp_slug) {
    const url = getAtpHeadshotUrl(player.atp_slug);
    memoryCache.set(cacheKey, url);
    return url;
  }

  if (player.wikidata_id) {
    if (pending.has(cacheKey)) return pending.get(cacheKey);

    const promise = fetchWikidataImage(player.wikidata_id).then((url) => {
      saveToStorage(cacheKey, url);
      pending.delete(cacheKey);
      return url;
    });

    pending.set(cacheKey, promise);
    return promise;
  }

  memoryCache.set(cacheKey, null);
  return null;
}
