import json
blocks = ['2216100','2223300','2230500','2237700','2244000']
account_data = {}

for block in blocks:
    with open("/Users/cyin/scripts/3usd-balances-" + block + ".csv") as input:
        for line in input:
            addr, balance = line.rstrip().split(",")
            if not 'AccountId' in addr:
                if addr not in account_data:
                    account_data[addr] = {
                        "balance": int(balance)
                    }
                else:
                    account_data[addr]['balance'] += int(balance)

with open("/Users/cyin/stable-asset-query/airdrop/3usd_fees_raw_4.csv", "w") as out:
    for key in account_data:
        amount = account_data[key]['balance']
        out.write(key + "," + str(amount) + "\n")
