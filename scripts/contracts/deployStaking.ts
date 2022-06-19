import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

async function main() {

    const Staking = await ethers.getContractFactory("MyStaking");
    
    const contract = await Staking.deploy(259200, 3, 604800, process.env.LP_TOKEN_ADDRESS, process.env.XXX_TOKEN_ADDRESS);
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