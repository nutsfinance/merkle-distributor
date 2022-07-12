import json

fees = {}
total_amount = 0

fee_amount = 255197344532557
tai_amount = 8000 * (10**12)
tai_ksm_amount = 30 * (10**12)
lksm_amount = 250 * (10**12)
kar_amount = 2000 * (10**12)

with open("/Users/cyin/stable-asset-query/airdrop/3usd_fees_raw_4.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        fees[addr] = int(float(amount))
        total_amount += int(float(amount))
print(total_amount)
users = []
total_map = {}
tai_total = 0
with open("/Users/cyin/stable-asset-query/airdrop/3usd-fees-4.csv", "w+") as out:
    for user in fees:
        dict = {}
        dict['address'] = user
        fee = int(round(fees[user] * fee_amount / total_amount))
        tai = int(round(fees[user] * tai_amount / total_amount))
        tai_ksm = int(round(fees[user] * tai_ksm_amount / total_amount))
        lksm = int(round(fees[user] * lksm_amount / total_amount))
        kar = int(round(fees[user] * kar_amount / total_amount))
        dict['feesList'] = [
            {
                "title" : "3USD LP Fees",
                "tokenName": "3USD",
                "claimable" : fee,
            },
            {
                "title" : "TAI Incentives",
                "tokenName": "TAI",
                "claimable" : tai,
            },
            {
                "title" : "taiKSM Incentives",
                "tokenName": "taiKSM",
                "claimable" : tai_ksm,
            },
            {
                "title" : "LKSM Incentives",
                "tokenName": "LKSM",
                "claimable" : lksm,
            },
            {
                "title" : "KAR Incentives",
                "tokenName": "KAR",
                "claimable" : kar,
            }
        ]
        out.write(user + "," + str(fee) + "," + str(tai) + "," + str(tai_ksm) + "," + str(lksm) + "," + str(kar) + "\n")
        users.append(dict)
with open("/Users/cyin/stable-asset-query/airdrop/3usd-fees-4.json", "w+") as out:
    out.write(json.dumps(users, indent=2) + "\n")
