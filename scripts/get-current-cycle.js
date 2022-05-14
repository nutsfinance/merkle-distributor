const { WsProvider, Keyring } = require('@polkadot/api');
const { AccountSigningKey, Provider, Signer } = require("@acala-network/bodhi");
const { ethers } = require("hardhat");

const config = {
    ws: 'wss://mandala-tc7-rpcnode.aca-dev.network/ws',
    seed: '//Bob',
};

async function main () {
  const provider = new Provider({
      provider: new WsProvider(config.ws),
  });
  await provider.api.isReady;

  const keyring = new Keyring({ type: 'sr25519' })
  const pair = keyring.addFromUri(config.seed);
  const signingKey = new AccountSigningKey(provider.api.registry);
  signingKey.addKeyringPair(pair);

  const wallet = new Signer(provider, pair.address, signingKey);
  const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
  const distributor = MerkleDistributor.attach('0xBcFBD51aB3cEB6047100265a20486F694BCD3604').connect(wallet);

  console.log('Current cycle: ' + await distributor.currentCycle());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });
