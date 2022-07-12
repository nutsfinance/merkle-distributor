from substrateinterface.utils.ss58 import ss58_decode
from substrateinterface.utils.ss58 import ss58_encode

with open("/Users/cyin/badger-system/test-address.csv") as input:
    for line in input:
        acct = line.rstrip()
        if acct:
            new_addr = ss58_encode(ss58_decode(acct), 8)
            print(new_addr)
