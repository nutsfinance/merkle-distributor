from brownie import *
from rich.console import Console

from assistant.rewards.classes.RewardsList import RewardsList
from assistant.rewards.classes.MerkleTree import rewards_to_merkle_tree
from substrateinterface.utils.ss58 import ss58_decode
from substrateinterface.utils.ss58 import ss58_encode
import json


console = Console()
cycles = [1, 2, 3, 4, 5, 6, 7]
def main():
    rewardList = RewardsList(8, None)
    for cycle in cycles:
        with open("/Users/cyin/stable-asset-query/airdrop/fees-" + str(cycle) + ".csv") as input:
            for line in input:
                address,tai,tai_ksm = line.rstrip().split(",")
                if address:
                    rewardList.increase_user_rewards(ss58_encode(ss58_decode(address), 42), "0x0000000000000000000100000000000000000084", int(tai)) #TAI
                    rewardList.increase_user_rewards(ss58_encode(ss58_decode(address), 42), "0x0000000000000000000300000000000000000000", int(tai_ksm)) #TaiKSM
    merkleTree = rewards_to_merkle_tree(rewardList, 2208900, 2244000, {})
    with open("/Users/cyin/badger-system/fees-merkle-7.json", "w") as out:
        out.write(json.dumps(merkleTree) + "\n")
main()
