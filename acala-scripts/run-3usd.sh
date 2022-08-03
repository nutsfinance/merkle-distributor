#!/usr/bin/env bash
set -e
allBlocks=(2339400 2346600 2353800 2361000 2368200 2372400)
for t in ${allBlocks[@]}; do
  ts-node src/scripts/query-balance-3usd.ts $t
done
