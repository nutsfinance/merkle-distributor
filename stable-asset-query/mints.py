#!/usr/bin/env python3
with open("/Users/cyin/stable-asset-query/csv/mints.csv") as input:
    total_amounts = {}
    for line in input:
        #addr, date, t0, t1, amount0, amount1 = line.rstrip().split(",")
        addr, date, amount0 = line.rstrip().split(",")
        if addr in total_amounts:
            total_amounts[addr] = total_amounts[addr] + int(amount0)
        else:
            total_amounts[addr] = int(amount0)
    #print(total_amounts)
    for key in total_amounts:
        if total_amounts[key] > 0:
            print(key + "," + str(total_amounts[key]/1e12))
