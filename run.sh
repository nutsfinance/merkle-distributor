#!/usr/bin/env bash
DATE=$(date '+%Y-%m-%d-%H')
export LOG_FILE=${DATE}.log
./distribute.sh > ${DATE}.log
npx hardhat run rewards/upload_log.ts --network acala
