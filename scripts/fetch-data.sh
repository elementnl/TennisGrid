#!/bin/bash
set -e

mkdir -p data

if [ ! -d "data/tennis_atp" ]; then
  echo "Cloning tennis_atp..."
  git clone --depth 1 https://github.com/JeffSackmann/tennis_atp.git data/tennis_atp
else
  echo "data/tennis_atp already exists, skipping."
fi

if [ ! -d "data/tennis_wta" ]; then
  echo "Cloning tennis_wta..."
  git clone --depth 1 https://github.com/JeffSackmann/tennis_wta.git data/tennis_wta
else
  echo "data/tennis_wta already exists, skipping."
fi

echo "Done. Run 'node scripts/build-players.mjs' next."
