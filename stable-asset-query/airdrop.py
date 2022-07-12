import json

cont = {}
existing_users = {}
liq_mig = {}
pool_int = {}
soft_launch = {}
mints = {}

with open("/Users/cyin/stable-asset-query/airdrop/total_mints.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        mints[addr] = str(int(amount) * (10 ** 12))
with open("/Users/cyin/stable-asset-query/airdrop/pool_interactions.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        pool_int[addr] = str(int(amount) * (10 ** 12))
with open("/Users/cyin/stable-asset-query/airdrop/continuity.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        cont[addr] = str(int(amount) * (10 ** 12))
with open("/Users/cyin/stable-asset-query/airdrop/soft_launch.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        soft_launch[addr] = str(int(amount) * (10 ** 12))
with open("/Users/cyin/stable-asset-query/airdrop/liquidity_migration.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        liq_mig[addr] = str(int(amount) * (10 ** 12))
with open("/Users/cyin/stable-asset-query/airdrop/existing_users.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        existing_users[addr] = str(int(amount) * (10 ** 12))
all_users = set()
all_users.update(mints.keys())
all_users.update(pool_int.keys())
all_users.update(cont.keys())
all_users.update(soft_launch.keys())
all_users.update(liq_mig.keys())
all_users.update(existing_users.keys())

users = []
total_map = {}
for user in all_users:
    dict = {}
    dict['address'] = user
    dict['airdropList'] = [
        {
            "title" : "Total Assets Staked",
            "tokenName": "TAI",
            "balance" : mints.get(user, "0"),
        },
        {
            "title" : "Protocol Interaction",
            "tokenName": "TAI",
            "balance" : pool_int.get(user, "0"),
        },
        {
            "title" : "Interaction Frequency and Continuity",
            "tokenName": "TAI",
            "balance" : cont.get(user, "0"),
        },
        {
            "title" : "Soft Launch Participation",
            "tokenName": "TAI",
            "balance" : soft_launch.get(user, "0"),
        },
        {
            "title" : "Liquidity Migration Participation",
            "tokenName": "TAI",
            "balance" : liq_mig.get(user, "0"),
        },
        {
            "title" : "Existing Karura DeFi User",
            "tokenName": "TAI",
            "balance" : existing_users.get(user, "0"),
        }
    ]
    total = int(mints.get(user, "0")) + int(pool_int.get(user, "0")) + int(cont.get(user, "0")) + int(soft_launch.get(user, "0")) + int(liq_mig.get(user, "0")) + int(existing_users.get(user, "0"))
    users.append(dict)
    total_map[user] = total
with open("/Users/cyin/stable-asset-query/airdrop/airdrop.json", "w+") as out:
    out.write(json.dumps(users) + "\n")
with open("/Users/cyin/stable-asset-query/airdrop/airdrop.csv", "w+") as out:
    for key in total_map:
        out.write(key + "," + str(total_map[key]) + "\n")
