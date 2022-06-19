import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("claim", "Withdraws rewards tokens from contract")
.setAction(async (args, hre) => {

    const sContract = await hre.ethers.getContractAt("MyStaking", process.env.STAKING_CONTRACT_ADDRESS as string);

    await sContract.claim();
    console.log("Rewards claimed");
});