import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("stinfo", "Information about settings of staking contract")
.setAction(async (args, hre) => {

    const sContract = await hre.ethers.getContractAt("MyStaking", process.env.STAKING_CONTRACT_ADDRESS as string);

    const info = await sContract.stakingInfo();
    console.log("INFORMATION:\n");
    console.log(`Freeze time: ${info[0]}`);
    console.log(`Rewards percent: ${info[1]}%\n`);
});