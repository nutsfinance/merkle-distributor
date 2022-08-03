import json
import os

script_directory = os.path.dirname(os.path.realpath(__file__))
blocks = ['2339400','2346600','2353800','2361000','2368200','2372400']
account_data = {}

for block in blocks:
    with open(script_directory + "/../acala-scripts/csv/3usd-balances-" + block + ".csv") as input:
        for line in input:
            addr, balance = line.rstrip().split(",")
            if not 'AccountId' in addr:
                if addr not in account_data:
                    account_data[addr] = {
                        "balance": int(balance)
                    }
                else:
                    account_data[addr]['balance'] += int(balance)

with open(script_directory + "/../stable-asset-query/airdrop/3usd_fees_raw_7.csv", "w") as out:
    for key in account_data:
        amount = account_data[key]['balance']
        out.write(key + "," + str(amount) + "\n")
