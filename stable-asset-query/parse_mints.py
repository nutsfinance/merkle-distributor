import json
# for i in range(36):
#     with open("/Users/cyin/stable-asset-query/dex_swap_" + str(i * 100) + ".json") as input:
#         content = json.loads(input.read())
#         for node in content['data']['swaps']['nodes']:
#             if node['timestamp'] >= '2022-03-08T03' and node['timestamp'] < '2022-04-29T00':
#                 print(node['addressId'] + ","+ node['timestamp'])
for i in range(120):
    with open("/Users/cyin/stable-asset-query/swaps_" + str(i * 100) + ".json") as input:
        content = json.loads(input.read())
        for node in content['data']['swaps']['nodes']:
            if node['timestamp'] >= '2022-03-08T03' and node['timestamp'] < '2022-04-29T00':
                print(node['addressId'] + ","+ node['timestamp'][0:10])
for i in range(23):
    with open("/Users/cyin/stable-asset-query/mint_" + str(i * 100) + ".json") as input:
        content = json.loads(input.read())
        for node in content['data']['mints']['nodes']:
            if node['timestamp'] >= '2022-03-08T03' and node['timestamp'] < '2022-04-29T00':
                print(node['addressId'] + ","+ node['timestamp'][0:10])
