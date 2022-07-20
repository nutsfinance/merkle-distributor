#!/usr/bin/env bash
set -e
allBlocks=(1405700 1412900 1420100 1427300 1434500 1441700 )
for t in ${allBlocks[@]}; do
  ts-node src/scripts/query-balance-aca.ts $t
done
