import json
blocks = ['1364600','1371800','1379000','1386200','1393400','1398500']
account_data = {}
excluded_acounts = set(['5EYCAe5fiQJsnqbdsqzNnWhEAGZkyK8uqahrmhwVvcuNRhpd', '5EYCAe5fiQJso5shMc1vDwj12vXpXhuYHDwVES1rKRJwcWVj'])
incentive_total = 0

for block in blocks:
    with open("/Users/cyin/scripts/aca-balances-" + block + ".csv") as input:
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
with open("/Users/cyin/stable-asset-query/airdrop/aca_fees_raw_4.csv", "w") as out:
    for key in account_data:
        if key not in excluded_acounts:
            amount = account_data[key]['balance'] + int(round(account_data[key]['incentive']/incentive_total*incentive_balance))
            out.write(key + "," + str(amount) + "\n")
