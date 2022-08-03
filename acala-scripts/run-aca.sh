#!/usr/bin/env bash
set -e
allBlocks=(1508200 1515400 1522600 1529800 1537000 1544200)
for t in ${allBlocks[@]}; do
  ts-node src/scripts/query-balance-aca.ts $t
done
