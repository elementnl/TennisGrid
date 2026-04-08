# TennisGrid

A daily tennis trivia game inspired by Immaculate Grid. Guess players that match the row and column categories in a 3x3 grid.

## Play

Each day generates a new puzzle with 6 categories (3 rows, 3 columns). You get 9 guesses to fill all 9 cells with a valid tennis player that satisfies both the row and column category.

5,000+ ATP and WTA players from the Open Era (1968–2024). Singles data only.

## Dev

```
npm install
npm run dev
```

## Rebuilding the Dataset

The player dataset (`src/data/players.json`) is pre-built and committed. To rebuild it from source:

```
bash scripts/fetch-data.sh        # Clone Sackmann's CSV repos (~500MB)
node scripts/build-players.mjs    # Parse matches/rankings → base JSON
node scripts/enrich-atp.mjs       # Add backhand, birth city, etc. from ATP API
node scripts/enrich-wikidata.mjs  # Add birth city for WTA players via Wikidata
```

Source data: [Jeff Sackmann's tennis repos](https://github.com/JeffSackmann)

## Stack

React, Vite, Tailwind CSS, shadcn/ui

## License

MIT
