import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname);
const ATP_DIR = join(ROOT, 'data/tennis_atp');
const WTA_DIR = join(ROOT, 'data/tennis_wta');

function parseCSV(filePath) {
  const text = readFileSync(filePath, 'utf-8');
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
    return obj;
  });
}

function streamCSV(filePath, cb) {
  const text = readFileSync(filePath, 'utf-8');
  const lines = text.split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    cb(line.split(','), headers);
  }
  return headers;
}

function colIdx(headers, name) {
  return headers.indexOf(name);
}

function normalizeSlam(name) {
  const n = name.toLowerCase();
  if (n.includes('australian')) return 'Australian Open';
  if (n.includes('roland') || n.includes('french')) return 'Roland Garros';
  if (n.includes('wimbledon')) return 'Wimbledon';
  if (n.includes('us open') || n === 'us open') return 'US Open';
  return null;
}

const WTA_TIER1_BY_YEAR = {
  1990: ['Chicago', 'Miami', 'Key Biscayne', 'Hilton Head', 'Rome', 'Berlin', 'Montreal'],
  1991: ['Boca Raton', 'Miami', 'Key Biscayne', 'Hilton Head', 'Rome', 'Berlin', 'Toronto'],
  1992: ['Boca Raton', 'Miami', 'Key Biscayne', 'Hilton Head', 'Rome', 'Berlin', 'Montreal'],
  1993: ['Yokohama', 'Tokyo', 'Miami', 'Key Biscayne', 'Hilton Head', 'Rome', 'Berlin', 'Toronto', 'Zurich', 'Philadelphia'],
  1994: ['Tokyo', 'Miami', 'Key Biscayne', 'Hilton Head', 'Rome', 'Berlin', 'Montreal', 'Zurich', 'Philadelphia'],
  1995: ['Tokyo', 'Miami', 'Key Biscayne', 'Hilton Head', 'Rome', 'Berlin', 'Toronto', 'Zurich', 'Philadelphia'],
  1996: ['Tokyo', 'Indian Wells', 'Miami', 'Key Biscayne', 'Hilton Head', 'Rome', 'Berlin', 'Montreal', 'Zurich'],
  1997: ['Tokyo', 'Indian Wells', 'Miami', 'Key Biscayne', 'Hilton Head', 'Rome', 'Berlin', 'Toronto', 'Zurich', 'Moscow'],
  1998: ['Tokyo', 'Indian Wells', 'Miami', 'Key Biscayne', 'Hilton Head', 'Rome', 'Berlin', 'Montreal', 'Zurich', 'Moscow'],
  1999: ['Tokyo', 'Indian Wells', 'Miami', 'Key Biscayne', 'Hilton Head', 'Rome', 'Berlin', 'Toronto', 'Zurich', 'Moscow'],
  2000: ['Tokyo', 'Indian Wells', 'Miami', 'Key Biscayne', 'Hilton Head', 'Rome', 'Berlin', 'Montreal', 'Zurich', 'Moscow'],
  2001: ['Tokyo', 'Indian Wells', 'Miami', 'Key Biscayne', 'Charleston', 'Rome', 'Berlin', 'Toronto', 'Zurich', 'Moscow'],
  2002: ['Tokyo', 'Indian Wells', 'Miami', 'Key Biscayne', 'Charleston', 'Rome', 'Berlin', 'Montreal', 'Zurich', 'Moscow'],
  2003: ['Tokyo', 'Indian Wells', 'Miami', 'Key Biscayne', 'Charleston', 'Rome', 'Berlin', 'Toronto', 'Zurich', 'Moscow'],
};

const WTA_PREMIER5_NAMES = new Set([
  'Dubai', 'Doha', 'Rome', 'Cincinnati', 'Montreal', 'Toronto',
  'Canadian Open', 'Tokyo', 'Wuhan',
]);

function isWtaTopTier(tourneyName, tourneyLevel, year) {
  if (tourneyLevel === 'T1') return true;
  if (tourneyLevel === 'PM') return true;

  if (tourneyLevel === 'P' && year >= 2009 && year <= 2020) {
    const n = tourneyName.toLowerCase();
    for (const p5 of WTA_PREMIER5_NAMES) {
      if (n.includes(p5.toLowerCase())) return true;
    }
  }

  if (tourneyLevel === 'W' && year <= 2003) {
    const tier1List = WTA_TIER1_BY_YEAR[year];
    if (tier1List) {
      const n = tourneyName.toLowerCase();
      return tier1List.some(t => n.includes(t.toLowerCase()));
    }
  }

  return false;
}

console.log('Loading player files...');
const playerInfo = new Map();

function loadPlayers(filePath, tour) {
  const rows = parseCSV(filePath);
  for (const p of rows) {
    const id = `${tour}_${p.player_id}`;
    if (playerInfo.has(id)) continue;
    playerInfo.set(id, {
      rawId: p.player_id,
      firstName: p.name_first || '',
      lastName: p.name_last || '',
      hand: p.hand,
      dob: p.dob,
      ioc: p.ioc,
      height: p.height ? parseInt(p.height) : null,
      tour,
      wikidataId: p.wikidata_id || null,
    });
  }
}

loadPlayers(join(ATP_DIR, 'atp_players.csv'), 'atp');
loadPlayers(join(WTA_DIR, 'wta_players.csv'), 'wta');
console.log(`  ${playerInfo.size} total players loaded`);

function newStats() {
  return {
    w: 0, l: 0, t: 0, gs: 0,
    ao: 0, rg: 0, wi: 0, uso: 0,
    gsfl: 0, m1k: 0, tft: 0, og: 0, om: false,
    sh: 0, sc: 0, sgr: 0,
    fy: 9999, ly: 0,
    firstTitleYear: null,
    decades: new Set(),
  };
}

const stats = new Map();

function ensure(id) {
  if (!stats.has(id)) stats.set(id, newStats());
  return stats.get(id);
}

function processMatchFiles(dir, prefix, tour) {
  const yearPattern = new RegExp(`^${prefix}\\d{4}\\.csv$`);
  const files = readdirSync(dir)
    .filter(f => yearPattern.test(f))
    .sort();

  let totalRows = 0;

  for (const f of files) {
    const filePath = join(dir, f);

    streamCSV(filePath, (cols, hdrs) => {
      totalRows++;

      const rawWId = cols[colIdx(hdrs, 'winner_id')]?.trim();
      const rawLId = cols[colIdx(hdrs, 'loser_id')]?.trim();
      if (!rawWId || !rawLId) return;

      const wId = `${tour}_${rawWId}`;
      const lId = `${tour}_${rawLId}`;

      const dateStr = cols[colIdx(hdrs, 'tourney_date')]?.trim();
      const year = parseInt(dateStr?.slice(0, 4));
      if (isNaN(year)) return;

      const ws = ensure(wId);
      const ls = ensure(lId);

      ws.w++;
      ls.l++;

      ws.fy = Math.min(ws.fy, year);
      ws.ly = Math.max(ws.ly, year);
      ls.fy = Math.min(ls.fy, year);
      ls.ly = Math.max(ls.ly, year);

      ws.decades.add(`${Math.floor(year / 10) * 10}s`);
      ls.decades.add(`${Math.floor(year / 10) * 10}s`);

      const wHand = cols[colIdx(hdrs, 'winner_hand')]?.trim();
      const lHand = cols[colIdx(hdrs, 'loser_hand')]?.trim();
      const wIoc = cols[colIdx(hdrs, 'winner_ioc')]?.trim();
      const lIoc = cols[colIdx(hdrs, 'loser_ioc')]?.trim();

      if (wHand && (wHand === 'R' || wHand === 'L') && playerInfo.has(wId)) {
        const pi = playerInfo.get(wId);
        if (!pi.hand || pi.hand === 'U') pi.hand = wHand;
      }
      if (lHand && (lHand === 'R' || lHand === 'L') && playerInfo.has(lId)) {
        const pi = playerInfo.get(lId);
        if (!pi.hand || pi.hand === 'U') pi.hand = lHand;
      }
      if (wIoc && playerInfo.has(wId) && !playerInfo.get(wId).ioc) {
        playerInfo.get(wId).ioc = wIoc;
      }
      if (lIoc && playerInfo.has(lId) && !playerInfo.get(lId).ioc) {
        playerInfo.get(lId).ioc = lIoc;
      }

      const round = cols[colIdx(hdrs, 'round')]?.trim();
      const level = cols[colIdx(hdrs, 'tourney_level')]?.trim();

      if (level === 'O' && round === 'SF') {
        ls.om = true;
      }

      if (round !== 'F') return;

      const surface = cols[colIdx(hdrs, 'surface')]?.trim();
      const tourneyName = cols[colIdx(hdrs, 'tourney_name')]?.trim();

      ws.t++;
      if (ws.firstTitleYear === null || year < ws.firstTitleYear) {
        ws.firstTitleYear = year;
      }

      if (surface === 'Hard') ws.sh++;
      else if (surface === 'Clay') ws.sc++;
      else if (surface === 'Grass') ws.sgr++;

      if (level === 'G') {
        ws.gs++;
        const slam = normalizeSlam(tourneyName);
        if (slam === 'Australian Open') ws.ao++;
        else if (slam === 'Roland Garros') ws.rg++;
        else if (slam === 'Wimbledon') ws.wi++;
        else if (slam === 'US Open') ws.uso++;
        ls.gsfl++;
      }

      const isYearEndMasters = level === 'M' && (tourneyName === 'Masters' || tourneyName === 'Masters Dec');

      if (tour === 'atp' && level === 'M' && !isYearEndMasters) {
        ws.m1k++;
      } else if (tour === 'wta' && isWtaTopTier(tourneyName, level, year)) {
        ws.m1k++;
      }

      if (level === 'F' || isYearEndMasters) ws.tft++;

      if (level === 'O') {
        ws.og++;
        ws.om = true;
        ls.om = true;
      }
    });
  }

  return totalRows;
}

console.log('Processing ATP matches...');
const atpRows = processMatchFiles(ATP_DIR, 'atp_matches_', 'atp');
console.log(`  ${atpRows} rows`);

console.log('Processing WTA matches...');
const wtaRows = processMatchFiles(WTA_DIR, 'wta_matches_', 'wta');
console.log(`  ${wtaRows} rows`);

console.log('Processing rankings...');

const rankingStats = new Map();

function ensureRS(id) {
  if (!rankingStats.has(id)) rankingStats.set(id, { bestRank: 9999, weeksAt1: 0 });
  return rankingStats.get(id);
}

const yearEndNo1 = new Map();

function processRankingFiles(dir, prefix, tour) {
  const files = readdirSync(dir)
    .filter(f => f.startsWith(prefix) && f.endsWith('.csv'))
    .sort();

  const yearLastDate = new Map();
  const no1ByDate = new Map();
  let totalRows = 0;

  for (const f of files) {
    streamCSV(join(dir, f), (cols, hdrs) => {
      totalRows++;
      const date = cols[colIdx(hdrs, 'ranking_date')]?.trim();
      const rawId = cols[colIdx(hdrs, 'player')]?.trim();
      const rank = parseInt(cols[colIdx(hdrs, 'rank')]?.trim());
      if (!rawId || isNaN(rank)) return;

      const id = `${tour}_${rawId}`;
      const rs = ensureRS(id);
      if (rank < rs.bestRank) rs.bestRank = rank;
      if (rank === 1) {
        rs.weeksAt1++;
        if (date) {
          const year = date.slice(0, 4);
          if (!yearLastDate.has(year) || date > yearLastDate.get(year)) {
            yearLastDate.set(year, date);
          }
          no1ByDate.set(date, id);
        }
      }
    });
  }

  for (const [year, date] of yearLastDate) {
    const id = no1ByDate.get(date);
    if (id) {
      if (!yearEndNo1.has(id)) yearEndNo1.set(id, new Set());
      yearEndNo1.get(id).add(year);
    }
  }

  console.log(`  ${totalRows} ranking rows processed`);
}

processRankingFiles(ATP_DIR, 'atp_rankings', 'atp');
processRankingFiles(WTA_DIR, 'wta_rankings', 'wta');

console.log('Building final player list...');

const players = [];

for (const [id, s] of stats) {
  const info = playerInfo.get(id);
  if (!info) continue;

  const name = `${info.firstName} ${info.lastName}`.trim();
  if (!name || name === 'X X' || name === '') continue;

  const totalMatches = s.w + s.l;
  if (totalMatches < 10) continue;

  const rs = rankingStats.get(id) || { bestRank: null, weeksAt1: 0 };
  const yeNo1 = yearEndNo1.get(id);
  const winPct = totalMatches > 0 ? Math.round((s.w / totalMatches) * 1000) / 10 : 0;

  const dob = info.dob && info.dob.length === 8 && info.dob !== '00000000' ? info.dob : null;
  const birthYear = dob ? parseInt(dob.slice(0, 4)) : null;
  const birth_decade = birthYear ? `${Math.floor(birthYear / 10) * 10}s` : null;

  let age_at_first_title = null;
  if (birthYear && s.firstTitleYear) {
    age_at_first_title = s.firstTitleYear - birthYear;
  }

  const won_title_as_teenager = age_at_first_title !== null && age_at_first_title < 20 && s.t > 0;

  let height_bucket = null;
  if (info.height) {
    if (info.height < 175) height_bucket = 'under_175';
    else if (info.height < 183) height_bucket = '175_182';
    else if (info.height < 190) height_bucket = '183_189';
    else height_bucket = '190_plus';
  }

  const surfaceCount = (s.sh > 0 ? 1 : 0) + (s.sc > 0 ? 1 : 0) + (s.sgr > 0 ? 1 : 0);

  players.push({
    id, name,
    first_name: info.firstName,
    last_name: info.lastName,
    tour: info.tour,
    country: info.ioc || null,
    hand: (info.hand === 'R' || info.hand === 'L') ? info.hand : null,
    height_cm: info.height,
    height_bucket,
    dob,
    birth_year: birthYear,
    birth_decade,
    wikidata_id: info.wikidataId,
    career_wins: s.w,
    career_losses: s.l,
    career_win_pct: winPct,
    total_titles: s.t,
    grand_slam_titles: s.gs,
    australian_open_titles: s.ao,
    roland_garros_titles: s.rg,
    wimbledon_titles: s.wi,
    us_open_titles: s.uso,
    grand_slam_finals_lost: s.gsfl,
    masters_1000_titles: s.m1k,
    tour_finals_titles: s.tft,
    olympic_gold: s.og,
    olympic_medal: s.om,
    hard_court_titles: s.sh,
    clay_court_titles: s.sc,
    grass_court_titles: s.sgr,
    titles_on_all_surfaces: surfaceCount === 3,
    career_high_rank: rs.bestRank < 9999 ? rs.bestRank : null,
    weeks_at_no1: rs.weeksAt1,
    year_end_no1_count: yeNo1 ? yeNo1.size : 0,
    first_year: s.fy < 9999 ? s.fy : null,
    last_year: s.ly > 0 ? s.ly : null,
    active_decades: [...s.decades].sort(),
    age_at_first_title,
    won_title_as_teenager,
  });
}

players.sort((a, b) => b.total_titles - a.total_titles || b.career_wins - a.career_wins);

console.log(`\nTotal players with 10+ matches: ${players.length}`);
console.log(`  ATP: ${players.filter(p => p.tour === 'atp').length}`);
console.log(`  WTA: ${players.filter(p => p.tour === 'wta').length}`);
console.log(`  With titles: ${players.filter(p => p.total_titles > 0).length}`);
console.log(`  Grand Slam champions: ${players.filter(p => p.grand_slam_titles > 0).length}`);
console.log(`  Reached #1: ${players.filter(p => p.career_high_rank === 1).length}`);

const outDir = join(ROOT, 'src/data');
mkdirSync(outDir, { recursive: true });

const outPath = join(outDir, 'players.json');
writeFileSync(outPath, JSON.stringify(players, null, 2));
console.log(`\nWrote ${outPath}`);
console.log(`File size: ${(readFileSync(outPath).length / 1024 / 1024).toFixed(1)} MB`);

console.log('\nTop 20 players by titles:');
for (const p of players.slice(0, 20)) {
  console.log(`  ${p.name} (${p.tour.toUpperCase()}) — ${p.total_titles} titles, ${p.grand_slam_titles} GS, rank peak: ${p.career_high_rank}, ${p.country}`);
}
