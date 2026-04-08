import playersData from "../data/players.json";
import { createSeededRandom, dateToSeed, seededShuffle } from "./seededRandom";
import { CATEGORIES, CONFLICT_PAIRS } from "./categories";

export { getFlagUrl } from "./countries";

const players = playersData;

function playerMatchesCategory(player, cat) {
  switch (cat.type) {
    case "exact": return player[cat.field || cat.key] === cat._selectedValue;
    case "gte": return (player[cat.field || cat.key] || 0) >= cat.threshold;
    case "boolean": return !!player[cat.field || cat.key];
    case "computed": return cat.test(player);
    case "decade": return player.active_decades?.includes(cat._selectedValue);
    default: return false;
  }
}

function getPlayersForCell(rowCat, colCat) {
  return players.filter(
    (p) => playerMatchesCategory(p, rowCat) && playerMatchesCategory(p, colCat)
  );
}

export function isPlayerValidForCell(playerName, rowCat, colCat) {
  const lower = playerName.toLowerCase().trim();
  return players.some(
    (p) => p.name.toLowerCase() === lower && playerMatchesCategory(p, rowCat) && playerMatchesCategory(p, colCat)
  );
}

export function getPlayerByName(playerName) {
  const lower = playerName.toLowerCase().trim();
  return players.find((p) => p.name.toLowerCase() === lower);
}

export function getValidPlayersForCell(rowCat, colCat) {
  return getPlayersForCell(rowCat, colCat);
}

function hasConflicts(selectedKeys) {
  for (const [a, b] of CONFLICT_PAIRS) {
    if (selectedKeys.includes(a) && selectedKeys.includes(b)) return true;
  }
  return false;
}

function pickValue(cat, random) {
  if (cat.type === "exact") {
    const field = cat.field || cat.key;
    const valueCounts = {};
    for (const p of players) {
      const val = p[field];
      if (val != null && val !== "") valueCounts[val] = (valueCounts[val] || 0) + 1;
    }

    const minCount = cat.key === "country" ? 20 : 5;
    const viable = Object.entries(valueCounts)
      .filter(([, count]) => count >= minCount)
      .map(([val]) => val);
    if (viable.length === 0) return null;

    const weighted = [];
    for (const val of viable) {
      const copies = Math.max(1, Math.round(Math.sqrt(valueCounts[val] / 5)));
      for (let i = 0; i < copies; i++) weighted.push(val);
    }
    const selectedValue = seededShuffle(weighted, random)[0];

    const labels = cat.valueLabels;
    let label;
    if (labels?.imperial) {
      label = selectedValue;
    } else {
      label = labels?.[selectedValue] || selectedValue;
    }
    return { ...cat, _selectedValue: selectedValue, value: label };
  }

  if (cat.type === "decade") {
    const decades = ["1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
    const val = seededShuffle(decades, random)[0];
    return { ...cat, _selectedValue: val, value: val };
  }

  return { ...cat };
}

function hasNineUniquePlayers(rows, cols) {
  const cellPlayers = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const matches = getPlayersForCell(rows[r], cols[c]);
      if (matches.length === 0) return false;
      cellPlayers.push(matches);
    }
  }

  const used = new Set();
  let calls = 0;
  function solve(cellIdx) {
    if (cellIdx === 9) return true;
    if (++calls > 100000) return false;
    for (const player of cellPlayers[cellIdx]) {
      if (!used.has(player.name)) {
        used.add(player.name);
        if (solve(cellIdx + 1)) return true;
        used.delete(player.name);
      }
    }
    return false;
  }

  return solve(0);
}

function scorePuzzle(rows, cols) {
  const cellCounts = [];
  const playerAppearances = {};

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const matches = getPlayersForCell(rows[r], cols[c]);
      cellCounts.push(matches.length);
      for (const p of matches) {
        playerAppearances[p.name] = (playerAppearances[p.name] || 0) + 1;
      }
    }
  }

  const singleAnswerCells = cellCounts.filter((c) => c === 1).length;
  const maxAppearances = Math.max(...Object.values(playerAppearances));
  const avgCount = cellCounts.reduce((a, b) => a + b, 0) / 9;

  let score = 0;
  if (avgCount >= 3 && avgCount <= 15) score += 10;
  else if (avgCount >= 2 && avgCount <= 30) score += 5;
  score -= singleAnswerCells * 3;
  score -= maxAppearances * 1.5;
  score += avgCount * 0.5;

  return score;
}

export function generatePuzzle(dateStr) {
  const seed = dateToSeed(dateStr);
  let random = createSeededRandom(seed);

  let bestPuzzle = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < 500; attempt++) {
    const expanded = [];
    for (const cat of CATEGORIES) {
      const w = cat.weight || 1;
      for (let i = 0; i < w; i++) expanded.push(cat);
    }
    const shuffled = seededShuffle(expanded, random);

    const seen = new Set();
    const deduped = [];
    for (const cat of shuffled) {
      if (!seen.has(cat.key)) { seen.add(cat.key); deduped.push(cat); }
    }

    const selected = [];
    for (const cat of deduped) {
      if (selected.length >= 6) break;
      const testKeys = [...selected.map((c) => c.key), cat.key];
      if (hasConflicts(testKeys)) continue;
      selected.push(cat);
    }

    if (selected.length < 6) {
      random = createSeededRandom(seed ^ Math.imul(attempt + 1, 2654435761));
      continue;
    }

    const tourCount = selected.filter((c) => c.key === "tour").length;
    if (tourCount > 1) {
      random = createSeededRandom(seed ^ Math.imul(attempt + 1, 2654435761));
      continue;
    }

    const withValues = selected.map((cat) => pickValue(cat, random));
    if (withValues.some((c) => c === null)) {
      random = createSeededRandom(seed ^ Math.imul(attempt + 1, 2654435761));
      continue;
    }

    const rows = withValues.slice(0, 3);
    const cols = withValues.slice(3, 6);

    if (!hasNineUniquePlayers(rows, cols)) {
      random = createSeededRandom(seed ^ Math.imul(attempt + 1, 2654435761));
      continue;
    }

    const score = scorePuzzle(rows, cols);
    if (score > bestScore) {
      bestScore = score;
      bestPuzzle = { date: dateStr, rows, cols };
    }

    if (score > 12) break;

    random = createSeededRandom(seed ^ Math.imul(attempt + 1, 2654435761));
  }

  if (bestPuzzle) return bestPuzzle;
  throw new Error(`Could not generate valid puzzle for ${dateStr}`);
}

export function getCategoryDisplayValue(cat, units = "imperial") {
  if (cat.key === "height_bucket" && cat._selectedValue) {
    const labels = CATEGORIES.find((c) => c.key === "height_bucket")?.valueLabels;
    if (labels) return labels[units]?.[cat._selectedValue] || cat._selectedValue;
  }
  return cat.value;
}

export { players, CATEGORIES };
