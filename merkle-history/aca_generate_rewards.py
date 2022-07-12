from brownie import *
from rich.console import Console

from assistant.rewards.classes.RewardsList import RewardsList
from assistant.rewards.classes.MerkleTree import rewards_to_merkle_tree
from substrateinterface.utils.ss58 import ss58_decode
from substrateinterface.utils.ss58 import ss58_encode
import json


console = Console()

cycles = [1, 2, 3, 4]
def main():
    rewardList = RewardsList(4, None)
    for cycle in cycles:
        with open("/Users/cyin/stable-asset-query/airdrop/aca-fees-" + str(cycle) + ".csv") as input:
            for line in input:
                address,fee = line.rstrip().split(",")
                if address:
                    rewardList.increase_user_rewards(ss58_encode(ss58_decode(address), 42), "0x0000000000000000000300000000000000000000", int(fee)) #TAI
    merkleTree = rewards_to_merkle_tree(rewardList, 1357400, 1398500, {})
    with open("/Users/cyin/badger-system/aca-fees-merkle-4.json", "w") as out:
        out.write(json.dumps(merkleTree) + "\n")
main()
