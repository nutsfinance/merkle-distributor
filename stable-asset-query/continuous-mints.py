#!/usr/bin/env python3
import datetime

total_amounts = {}
curr_date = datetime.datetime.strptime("2022-04-28","%Y-%m-%d")
with open("/Users/cyin/stable-asset-query/csv/mints_date.csv") as input:
    for line in input:
        addr, date_str = line.rstrip().split(",")
        date = datetime.datetime.strptime(date_str[0:10],"%Y-%m-%d")
        if addr in total_amounts:
            if date < total_amounts[addr]:
                total_amounts[addr] = date
        else:
            total_amounts[addr] = date
for key in total_amounts:
    print(key + "," + str((curr_date - total_amounts[key]).days + 1))
