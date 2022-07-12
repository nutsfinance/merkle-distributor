from substrateinterface.utils.ss58 import ss58_decode
from substrateinterface.utils.ss58 import ss58_encode
import json

with open("/Users/cyin/stable-asset-query/airdrop/airdrop-converted.json", "w+") as out:
    with open("/Users/cyin/stable-asset-query/airdrop/airdrop.json") as input:
        data = json.loads(input.read())
        for user_data in data:
            user_data['address'] = ss58_encode(ss58_decode(user_data['address']), 42)
        out.write(json.dumps(data, indent=2) + "\n")
