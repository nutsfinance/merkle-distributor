#!/usr/bin/env bash
DATE=$(date '+%Y-%m-%d-%H')
export LOG_FILE=${DATE}_stdout.log
export ERROR_LOG_FILE=${DATE}_stderr.log
./distribute.sh 2>${ERROR_LOG_FILE} | tee ${LOG_FILE}
npx hardhat run rewards/upload_log.ts --network acala
