from substrateinterface.utils.ss58 import ss58_decode
from substrateinterface.utils.ss58 import ss58_encode

with open("/Users/cyin/stable-asset-query/airdrop/airdrop.csv") as input:
    sum = 0
    for line in input:
        acct,amt = line.rstrip().split(",")
        if acct:
            sum += int(amt)
    print(sum)
