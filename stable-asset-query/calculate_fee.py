import json
import os

script_directory = os.path.dirname(os.path.realpath(__file__))
blocks = ['2251200','2258400','2265600','2272800','2280000','2285000']
excluded_acounts = set(['5EYCAe5fiQJsnqbdsqzNnWhEAGZkyK8uqahrmhwVvcuNRhpd', '5EYCAe5fiQJso5shMc1vDwj12vXpXhuYHDwVES1rKRJwcWVj'])
account_data = {}
dex_total = 0
incentive_total = 0

for block in blocks:
    with open(script_directory + "/../acala-scripts/csv/balances-" + block + ".csv") as input:
        for line in input:
            addr, balance, dex, incentive = line.rstrip().split(",")
            if not 'AccountId' in addr:
                dex_total += int(dex)
                incentive_total += int(incentive)
                if addr not in account_data:
                    account_data[addr] = {
                        "balance": int(balance),
                        "dex": int(dex),
                        "incentive": int(incentive)
                    }
                else:
                    account_data[addr]['balance'] += int(balance)
                    account_data[addr]['dex'] += int(dex)
                    account_data[addr]['incentive'] += int(incentive)

dex_balance = account_data['5EYCAe5fiQJsnqbdsqzNnWhEAGZkyK8uqahrmhwVvcuNRhpd']['balance']
incentive_balance = account_data['5EYCAe5fiQJso5shMc1vDwj12vXpXhuYHDwVES1rKRJwcWVj']['balance']
print(dex_balance)
print(incentive_balance)
with open(script_directory + "/../stable-asset-query/airdrop/fees_raw_8.csv", "w") as out:
    for key in account_data:
        if key not in excluded_acounts:
            amount = account_data[key]['balance'] + int(round(account_data[key]['dex']/dex_total*dex_balance)) + int(round(account_data[key]['incentive']/incentive_total*incentive_balance))
            out.write(key + "," + str(amount) + "\n")
