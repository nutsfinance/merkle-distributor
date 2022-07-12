import json

fees = {}
total_amount = 0

fee_amount = 1445455477077 + 2304731673195

incentive_back = {}

all_users = set()

with open("/Users/cyin/stable-asset-query/airdrop/aca_fees_raw_4.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        fees[addr] = int(float(amount))
        total_amount += int(float(amount))
        all_users.add(addr)
print(total_amount)
users = []
total_map = {}
tai_total = 0
with open("/Users/cyin/stable-asset-query/airdrop/aca-fees-4.csv", "w+") as out:
    for user in all_users:
        dict = {}
        dict['address'] = user
        fee = int(round(fees.get(user, 0) * fee_amount / total_amount)) + incentive_back.get(user, 0)
        dict['feesList'] = [
            {
                "title" : "tDOT LP Fees",
                "tokenName": "tDOT",
                "claimable" : fee,
            }
        ]
        out.write(user + "," + str(fee) + "\n")
        users.append(dict)
with open("/Users/cyin/stable-asset-query/airdrop/aca-fees-4.json", "w+") as out:
    out.write(json.dumps(users, indent=2) + "\n")
