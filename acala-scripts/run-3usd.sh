#!/usr/bin/env bash
set -e
allBlocks=(2379600 2386800 2394000 2401200 2408400 2411800)
for t in ${allBlocks[@]}; do
  ts-node src/scripts/query-balance-3usd.ts $t
done
