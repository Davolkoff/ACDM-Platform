import { task } from "hardhat/config";
import * as dotenv from "dotenv";
import { MerkleTree } from "merkletreejs";
import { whitelistMembers } from "../../../whitelist"
import { keccak256 } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

dotenv.config();

task("stake", "Sends lp tokens to contract")
.addParam("amount", "Amount of tokens")
.setAction(async (args, hre) => {
    let user: SignerWithAddress;

    [ user ] = await hre.ethers.getSigners();

    const lpToken = await hre.ethers.getContractAt("IERC20", process.env.LP_TOKEN_ADDRESS as string);
    const sContract = await hre.ethers.getContractAt("MyStaking", process.env.STAKING_CONTRACT_ADDRESS as string);

    const leaves = whitelistMembers.map(addr => keccak256(addr));

    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const hexProof = merkleTree.getHexProof(keccak256(user.address));

    await lpToken.approve(process.env.STAKING_CONTRACT_ADDRESS as string, args.amount);
    console.log("Tokens approved");

    await sContract.stake(args.amount, hexProof);
    console.log("Tokens staked");
});