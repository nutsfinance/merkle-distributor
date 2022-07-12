#!/usr/bin/env python3
import datetime

total_amounts = {}
with open("/Users/cyin/stable-asset-query/csv/interactions.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        if addr in total_amounts:
            total_amounts[addr] += 1
        else:
            total_amounts[addr] = 1
for key in total_amounts:
    print(key + "," + str(total_amounts[key]))
