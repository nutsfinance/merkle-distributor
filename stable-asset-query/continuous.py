#!/usr/bin/env python3
import datetime

total_amounts = {}
with open("/Users/cyin/stable-asset-query/csv/unique.csv") as input:
    prev_addr = None
    prev_date = None
    longest = 0
    current_streak = 0
    for line in input:
        addr, date_str = line.rstrip().split(",")
        date = datetime.datetime.strptime(date_str,"%Y-%m-%d")
        if prev_addr != addr:
            if prev_addr:
                total_amounts[prev_addr] = longest
            prev_date = date
            longest = 0
            current_streak = 0
        if (date - prev_date).days <= 1:
            current_streak += 1
        else:
            current_streak = 1
        if current_streak > longest:
            longest = current_streak
        prev_addr = addr
        prev_date = date
    total_amounts[prev_addr] = longest
for key in total_amounts:
    print(key + "," + str(total_amounts[key]))
