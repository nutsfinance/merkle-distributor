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
    rewardList = RewardsList(5, None)
    for cycle in cycles:
        with open("/Users/cyin/stable-asset-query/airdrop/3usd-fees-" + str(cycle) + ".csv") as input:
            for line in input:
                address,fee,tai,tai_ksm,lksm,kar = line.rstrip().split(",")
                if address:
                    rewardList.increase_user_rewards(ss58_encode(ss58_decode(address), 42), "0x0000000000000000000300000000000000000001", int(fee)) #TAI
                    rewardList.increase_user_rewards(ss58_encode(ss58_decode(address), 42), "0x0000000000000000000100000000000000000084", int(tai)) #TaiKSM
                    rewardList.increase_user_rewards(ss58_encode(ss58_decode(address), 42), "0x0000000000000000000300000000000000000000", int(tai_ksm)) #TAI
                    rewardList.increase_user_rewards(ss58_encode(ss58_decode(address), 42), "0x0000000000000000000100000000000000000083", int(lksm)) #TaiKSM
                    rewardList.increase_user_rewards(ss58_encode(ss58_decode(address), 42), "0x0000000000000000000100000000000000000080", int(kar)) #TAI
    merkleTree = rewards_to_merkle_tree(rewardList, 2208900, 2244000, {})
    with open("/Users/cyin/badger-system/3usd-fees-merkle-4.json", "w") as out:
        out.write(json.dumps(merkleTree) + "\n")
main()
