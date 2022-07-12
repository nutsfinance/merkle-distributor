import json
blocks = ['1080472','1087672','1094872','1102072','1109272','1116472','1123672','1130872','1138072','1145272','1152472','1159672','1166872','1174072','1181272','1188472','1195672','1202872','1210072','1217272','1224472','1231672','1238872','1246072','1253272','1260472']
account_data = {}
total_incentive = 0
incentive_fees = 1955151462444
for block in blocks:
    with open("/Users/cyin/scripts/aca-balances-" + block + ".csv") as input:
        for line in input:
            addr, balance, incentive = line.rstrip().split(",")
            if not 'AccountId' in addr:
                total_incentive += int(incentive)
                if addr not in account_data:
                    account_data[addr] = {
                        "balance": int(balance),
                        "incentive": int(incentive)
                    }
                else:
                    account_data[addr]['balance'] += int(balance)
                    account_data[addr]['incentive'] += int(incentive)

with open("/Users/cyin/stable-asset-query/airdrop/aca_fees_incentive_1.csv", "w") as out:
    for key in account_data:
        amount = account_data[key]['incentive']
        if amount > 0:
            out.write(key + "," + str(int(round(amount * incentive_fees / total_incentive))) + "\n")
