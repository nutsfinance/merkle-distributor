#!/usr/bin/env bash
set -e
allBlocks=(1556000 1563200 1570400 1577600 1584800 1592000)
for t in ${allBlocks[@]}; do
  ts-node src/scripts/query-balance-aca.ts $t
done
