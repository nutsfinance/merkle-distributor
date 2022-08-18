import json
import os

script_directory = os.path.dirname(os.path.realpath(__file__))
fees = {}
total_amount = 0

fee_amount = 30947991196229 + 44475346694258
tai_amount = 4000 * (10**12) * 7

with open(script_directory + "/../stable-asset-query/airdrop/fees_raw_12.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        fees[addr] = int(float(amount))
        total_amount += int(float(amount))
print(total_amount)
users = []
total_map = {}
tai_total = 0
with open(script_directory + "/../stable-asset-query/airdrop/fees-12.csv", "w+") as out:
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
with open(script_directory + "/../stable-asset-query/airdrop/fees-12.json", "w+") as out:
    out.write(json.dumps(users, indent=2) + "\n")
