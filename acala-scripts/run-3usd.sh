#!/usr/bin/env bash
set -e
allBlocks=(2292200 2299400 2306600 2313800 2321000 2328200)
for t in ${allBlocks[@]}; do
  ts-node src/scripts/query-balance-3usd.ts $t
done
