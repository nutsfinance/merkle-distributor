#!/usr/bin/env bash
set -e
allBlocks=(1460200 1467400 1474600 1481800 1489000 1496200)
for t in ${allBlocks[@]}; do
  ts-node src/scripts/query-balance-aca.ts $t
done
