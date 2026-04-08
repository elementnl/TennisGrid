import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname);
const PLAYERS_PATH = join(ROOT, 'src/data/players.json');
const CACHE_PATH = join(ROOT, 'scripts/.wikidata-cache.json');

const SPARQL_URL = 'https://query.wikidata.org/sparql';
const DELAY_MS = 2000;
const BATCH_SIZE = 40;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function queryWikidata(wikidataIds) {
  const values = wikidataIds.map(id => `wd:${id}`).join(' ');

  const query = `
    SELECT ?player ?playerLabel ?handLabel ?birthPlaceLabel ?birthCountryLabel ?turnedPro
    WHERE {
      VALUES ?player { ${values} }
      OPTIONAL { ?player wdt:P741 ?hand . }
      OPTIONAL {
        ?player wdt:P19 ?birthPlace .
        OPTIONAL { ?birthPlace wdt:P17 ?birthCountry . }
      }
      OPTIONAL { ?player wdt:P2031 ?turnedPro . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;

  const resp = await fetch(`${SPARQL_URL}?query=${encodeURIComponent(query)}&format=json`, {
    headers: {
      'User-Agent': 'TennisGridBot/1.0',
      'Accept': 'application/sparql-results+json',
    },
  });

  if (!resp.ok) {
    console.error(`  SPARQL error: ${resp.status} ${resp.statusText}`);
    return [];
  }

  const data = await resp.json();
  return data.results?.bindings || [];
}

function parseResults(bindings) {
  const byId = new Map();

  for (const b of bindings) {
    const uri = b.player?.value;
    if (!uri) continue;
    const wdId = uri.split('/').pop();

    if (!byId.has(wdId)) {
      byId.set(wdId, { hand_label: null, birth_place: null, birth_country: null, turned_pro: null });
    }

    const entry = byId.get(wdId);
    if (b.handLabel?.value) entry.hand_label = b.handLabel.value;
    if (b.birthPlaceLabel?.value) entry.birth_place = b.birthPlaceLabel.value;
    if (b.birthCountryLabel?.value) entry.birth_country = b.birthCountryLabel.value;
    if (b.turnedPro?.value) entry.turned_pro = b.turnedPro.value;
  }

  return byId;
}

console.log('Loading players...');
const players = JSON.parse(readFileSync(PLAYERS_PATH, 'utf-8'));

const toEnrich = players.filter(p => p.wikidata_id && (!p.backhand || !p.birth_city));
console.log(`  ${toEnrich.length} players to query`);

let cache = {};
if (existsSync(CACHE_PATH)) {
  cache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
  console.log(`  ${Object.keys(cache).length} already cached`);
}

function saveCache() {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

const uncached = toEnrich.filter(p => !cache[p.wikidata_id]);
console.log(`  ${uncached.length} uncached players to query`);

const batches = [];
for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
  batches.push(uncached.slice(i, i + BATCH_SIZE));
}

console.log(`  ${batches.length} batches of ${BATCH_SIZE}`);

let batchNum = 0;
for (const batch of batches) {
  batchNum++;
  const wdIds = batch.map(p => p.wikidata_id);

  try {
    await sleep(DELAY_MS);
    const bindings = await queryWikidata(wdIds);
    const parsed = parseResults(bindings);

    for (const player of batch) {
      const result = parsed.get(player.wikidata_id);
      cache[player.wikidata_id] = result
        ? { status: 'ok', ...result }
        : { status: 'no_data' };
    }
  } catch (err) {
    console.error(`  Batch ${batchNum} error: ${err.message}`);
    for (const player of batch) {
      cache[player.wikidata_id] = { status: 'error', message: err.message };
    }
  }

  if (batchNum % 5 === 0) {
    saveCache();
    const okCount = Object.values(cache).filter(c => c.status === 'ok').length;
    console.log(`  Batch ${batchNum}/${batches.length} done, ${okCount} with data`);
  }
}

saveCache();

const okCount = Object.values(cache).filter(c => c.status === 'ok').length;
console.log(`\nDone! ${okCount} players with data from Wikidata`);

console.log('\nMerging Wikidata results into players.json...');

let updated = 0;
for (const player of players) {
  if (!player.wikidata_id) continue;
  const c = cache[player.wikidata_id];
  if (!c || c.status !== 'ok') continue;

  let changed = false;

  if (!player.birth_city && c.birth_place) {
    player.birth_city = c.birth_place;
    if (c.birth_country) player.birth_country = c.birth_country;
    changed = true;
  }

  if (!player.pro_year && c.turned_pro) {
    const year = parseInt(c.turned_pro);
    if (!isNaN(year) && year > 1900 && year < 2030) {
      player.pro_year = year;
      changed = true;
    }
  }

  if (changed) updated++;
}

writeFileSync(PLAYERS_PATH, JSON.stringify(players, null, 2));
console.log(`Updated ${updated} players in ${PLAYERS_PATH}`);
