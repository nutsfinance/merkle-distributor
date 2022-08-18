#!/usr/bin/env bash
set -e
allBlocks=(2419000 2426200 2433400 2440600 2447800 2455000)
for t in ${allBlocks[@]}; do
  ts-node src/scripts/query-balance-3usd.ts $t
done
