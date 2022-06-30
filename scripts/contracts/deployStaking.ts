import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { whitelistMembers } from "../../whitelist";
import { keccak256 } from "ethers/lib/utils";
import { MerkleTree } from "merkletreejs";

dotenv.config();

async function main() {

    const Staking = await ethers.getContractFactory("MyStaking");

    const leaves = whitelistMembers.map(addr => keccak256(addr));

    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const rootHash = '0x' + merkleTree.getRoot().toString('hex');

    const contract = await Staking.deploy(259200, 3, 604800, rootHash, process.env.LP_TOKEN_ADDRESS, process.env.XXX_TOKEN_ADDRESS);
    await contract.deployed();

    console.log("Staking contract address: ", contract.address);
    fs.appendFileSync('.env', `\nSTAKING_CONTRACT_ADDRESS=${contract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });