with open("/Users/cyin/stable-asset-query/csv/mints.csv") as input:
    for line in input:
        addr, date, amount = line.rstrip().split(",")
        if date >= '2022-04-14' and date <= '2022-04-28':
            print(addr)
# with open("/Users/cyin/stable-asset-query/csv/dex_mints.csv") as input:
#     for line in input:
#         addr, date, t0, t1, a0, a1 = line.rstrip().split(",")
#         if date >= '2022-03-23' and date <= '2022-04-14':
#             print(addr)
