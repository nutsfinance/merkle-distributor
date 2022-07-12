from substrateinterface.utils.ss58 import ss58_decode
from substrateinterface.utils.ss58 import ss58_encode

with open("/Users/cyin/scripts/sap_balances.csv") as input:
    for line in input:
        acct,pool_bal,dex_bal,inc_share = line.rstrip().split(",")
        new_addr = ss58_encode(ss58_decode(acct), 8)
        print(new_addr + "," + pool_bal + "," + dex_bal + "," + inc_share)
