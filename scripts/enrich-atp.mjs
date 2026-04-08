import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname);
const PLAYERS_PATH = join(ROOT, 'src/data/players.json');
const CACHE_PATH = join(ROOT, 'scripts/.atp-cache.json');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BASE = 'https://www.atptour.com';
const DELAY_MS = 800;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJSON(url) {
  const resp = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!resp.ok) return null;
  const text = await resp.text();
  try { return JSON.parse(text); } catch { return null; }
}

async function searchPlayer(lastName) {
  const url = `${BASE}/en/-/ajax/playersearch/PlayerUrlSearch?searchTerm=${encodeURIComponent(lastName)}`;
  const data = await fetchJSON(url);
  if (!data || !data.items) return [];
  return data.items.map(item => {
    const parts = item.Value.split('/');
    const overviewIdx = parts.indexOf('overview');
    const slug = overviewIdx >= 2 ? parts[overviewIdx - 1] : null;
    return { name: item.Key, slug, path: item.Value };
  });
}

async function fetchHero(slug) {
  return await fetchJSON(`${BASE}/en/-/www/players/hero/${slug}`);
}

function normalizeStr(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim();
}

function matchPlayer(searchResults, firstName, lastName) {
  const normFirst = normalizeStr(firstName);
  const normLast = normalizeStr(lastName);
  const fullTarget = `${normFirst} ${normLast}`;

  for (const r of searchResults) {
    if (normalizeStr(r.name) === fullTarget) return r;
  }
  for (const r of searchResults) {
    const normName = normalizeStr(r.name);
    if (normName.includes(normFirst) && normName.includes(normLast)) return r;
  }
  for (const r of searchResults) {
    const parts = normalizeStr(r.name).split(' ');
    if (parts[0] === normFirst) return r;
  }
  return null;
}

console.log('Loading players...');
const players = JSON.parse(readFileSync(PLAYERS_PATH, 'utf-8'));
const atpPlayers = players.filter(p => p.tour === 'atp');
console.log(`  ${atpPlayers.length} ATP players to process`);

let cache = {};
if (existsSync(CACHE_PATH)) {
  cache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
  console.log(`  ${Object.keys(cache).length} already cached`);
}

function saveCache() {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

let processed = 0;
let found = 0;
let errors = 0;

for (const player of atpPlayers) {
  if (cache[player.id]) {
    found++;
    processed++;
    continue;
  }

  if (!player.last_name) {
    processed++;
    continue;
  }

  try {
    await sleep(DELAY_MS);
    const results = await searchPlayer(player.last_name);

    if (!results.length) {
      cache[player.id] = { status: 'not_found' };
      processed++;
      continue;
    }

    const match = matchPlayer(results, player.first_name, player.last_name);
    if (!match || !match.slug) {
      cache[player.id] = { status: 'no_match', searched: player.last_name };
      processed++;
      continue;
    }

    await sleep(DELAY_MS);
    const hero = await fetchHero(match.slug);

    if (!hero) {
      cache[player.id] = { status: 'hero_failed', slug: match.slug };
      processed++;
      errors++;
      continue;
    }

    cache[player.id] = {
      status: 'ok',
      slug: match.slug,
      backhand: hero.BackHand?.Id || null,
      backhand_desc: hero.BackHand?.Description || null,
      play_hand: hero.PlayHand?.Id || null,
      birth_city: hero.BirthCity || null,
      coach: hero.Coach || null,
      pro_year: hero.ProYear || null,
      height_cm: hero.HeightCm || null,
      weight_kg: hero.WeightKg || null,
      active: hero.Active?.Id || null,
    };
    found++;

  } catch (err) {
    cache[player.id] = { status: 'error', message: err.message };
    errors++;
  }

  processed++;

  if (processed % 50 === 0) {
    saveCache();
    const okCount = Object.values(cache).filter(c => c.status === 'ok').length;
    console.log(`  Progress: ${processed}/${atpPlayers.length} processed, ${okCount} enriched, ${errors} errors`);
  }
}

saveCache();

const okCount = Object.values(cache).filter(c => c.status === 'ok').length;
const notFound = Object.values(cache).filter(c => c.status === 'not_found' || c.status === 'no_match').length;
console.log(`\nDone! ${okCount} enriched, ${notFound} not found, ${errors} errors out of ${atpPlayers.length}`);

console.log('\nMerging enriched data into players.json...');

let updated = 0;
for (const player of players) {
  const c = cache[player.id];
  if (!c || c.status !== 'ok') continue;

  if (c.backhand === '1') player.backhand = 'One-Handed';
  else if (c.backhand === '2') player.backhand = 'Two-Handed';
  if (c.birth_city) player.birth_city = c.birth_city;
  if (c.coach) player.coach = c.coach;
  if (c.pro_year) player.pro_year = c.pro_year;
  if (!player.height_cm && c.height_cm) player.height_cm = c.height_cm;
  if (c.weight_kg) player.weight_kg = c.weight_kg;
  if (!player.hand && c.play_hand) player.hand = c.play_hand;

  updated++;
}

writeFileSync(PLAYERS_PATH, JSON.stringify(players, null, 2));
console.log(`Updated ${updated} players in ${PLAYERS_PATH}`);
