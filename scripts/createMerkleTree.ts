import * as dotenv from "dotenv"
import { MerkleTree } from "merkletreejs";
import { whitelistMembers } from "../whitelist"
import { keccak256 } from "ethers/lib/utils";

dotenv.config();

async function main() {
  const leaves = whitelistMembers.map(addr => keccak256(addr));

  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const rootHash = merkleTree.getRoot().toString('hex');

  console.log("Root hash, that you should paste to your proposal:", rootHash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });