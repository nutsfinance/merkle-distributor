import json
import os

script_directory = os.path.dirname(os.path.realpath(__file__))
blocks = ['1556000','1563200','1570400','1577600','1584800','1592000']
account_data = {}
excluded_acounts = set(['5EYCAe5fiQJsnqbdsqzNnWhEAGZkyK8uqahrmhwVvcuNRhpd', '5EYCAe5fiQJso5shMc1vDwj12vXpXhuYHDwVES1rKRJwcWVj'])
incentive_total = 0

for block in blocks:
    with open(script_directory + "/../acala-scripts/csv/aca-balances-" + block + ".csv") as input:
        for line in input:
            addr, balance, incentive = line.rstrip().split(",")
            if not 'AccountId' in addr:
                if addr not in account_data:
                    incentive_total += int(incentive)
                    account_data[addr] = {
                        "balance": int(balance),
                        "incentive": int(incentive)
                    }
                else:
                    account_data[addr]['balance'] += int(balance)
                    account_data[addr]['incentive'] += int(incentive)
incentive_balance = account_data['5EYCAe5fiQJso5shMc1vDwj12vXpXhuYHDwVES1rKRJwcWVj']['balance']
print(incentive_balance)
with open(script_directory + "/../stable-asset-query/airdrop/aca_fees_raw_8.csv", "w") as out:
    for key in account_data:
        if key not in excluded_acounts:
            amount = account_data[key]['balance'] + int(round(account_data[key]['incentive']/incentive_total*incentive_balance))
            out.write(key + "," + str(amount) + "\n")
