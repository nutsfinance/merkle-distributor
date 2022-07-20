#!/usr/bin/env bash
set -e
allBlocks=(2251200 2258400 2265600 2272800 2280000 2285000)
for t in ${allBlocks[@]}; do
  ts-node src/scripts/query-balance.ts $t
done
