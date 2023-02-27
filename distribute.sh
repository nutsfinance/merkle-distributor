#!/usr/bin/env bash
set -euo pipefail
npx hardhat run rewards/run_taiksm.ts --network karura
npx hardhat run rewards/run_3usd.ts --network karura
npx hardhat run rewards/run_tdot.ts --network acala
