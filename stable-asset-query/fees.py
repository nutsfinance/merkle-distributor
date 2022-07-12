import json

fees = {}
total_amount = 0

fee_amount = 6251311940519 + 34866203737465
tai_amount = 4000 * (10**12) * 7

with open("/Users/cyin/stable-asset-query/airdrop/fees_raw_7.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        fees[addr] = int(float(amount))
        total_amount += int(float(amount))
print(total_amount)
users = []
total_map = {}
tai_total = 0
with open("/Users/cyin/stable-asset-query/airdrop/fees-7.csv", "w+") as out:
    for user in fees:
        dict = {}
        dict['address'] = user
        dict['feesList'] = [
            {
                "title" : "TAI Incentives",
                "tokenName": "TAI",
                "claimable" : int(round(fees[user] * tai_amount / total_amount)),
            },
            {
                "title" : "taiKSM LP Fees",
                "tokenName": "taiKSM",
                "claimable" : int(round(fees[user] * fee_amount / total_amount)),
            }
        ]
        tai_total += int(round(fees[user] * tai_amount / total_amount))
        out.write(user + "," + str(int(round(fees[user] * tai_amount / total_amount))) + "," + str(int(round(fees[user] * fee_amount / total_amount)))+ "\n")
        users.append(dict)
print(tai_total)
with open("/Users/cyin/stable-asset-query/airdrop/fees-7.json", "w+") as out:
    out.write(json.dumps(users, indent=2) + "\n")
