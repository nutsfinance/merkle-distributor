import json
import os

script_directory = os.path.dirname(os.path.realpath(__file__))
fees = {}
total_amount = 0

fee_amount = 2871056310425 + 2606961784006

incentive_back = {}

all_users = set()

with open(script_directory + "/../stable-asset-query/airdrop/aca_fees_raw_6.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        fees[addr] = int(float(amount))
        total_amount += int(float(amount))
        all_users.add(addr)
print(total_amount)
users = []
total_map = {}
tai_total = 0
with open(script_directory + "/../stable-asset-query/airdrop/aca-fees-6.csv", "w+") as out:
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
with open(script_directory + "/../stable-asset-query/airdrop/aca-fees-6.json", "w+") as out:
    out.write(json.dumps(users, indent=2) + "\n")
