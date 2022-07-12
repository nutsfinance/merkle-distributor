#!/usr/bin/env python3
total_amounts = {}
with open("/Users/cyin/stable-asset-query/csv/mints_tai_agg.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        if addr in total_amounts:
            total_amounts[addr] = total_amounts[addr] + (float(amount) * 0.08)
        else:
            total_amounts[addr] = float(amount) * 0.08
with open("/Users/cyin/stable-asset-query/csv/mints_taiksm_agg.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        if addr in total_amounts:
            total_amounts[addr] = total_amounts[addr] + (float(amount) * 101.04)
        else:
            total_amounts[addr] = float(amount) * 101.04
with open("/Users/cyin/stable-asset-query/csv/mints_agg.csv") as input:
    for line in input:
        addr, amount = line.rstrip().split(",")
        if addr in total_amounts:
            total_amounts[addr] = total_amounts[addr] + (float(amount) * 101.04)
        else:
            total_amounts[addr] = float(amount) * 101.04
for key in total_amounts:
    print(key + "," + str(total_amounts[key]))
