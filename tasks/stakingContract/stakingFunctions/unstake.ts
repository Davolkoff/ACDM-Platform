import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("unstake", "Withdraws lp tokens from contract")
.setAction(async (args, hre) => {

    const sContract = await hre.ethers.getContractAt("MyStaking", process.env.STAKING_CONTRACT_ADDRESS as string);

    await sContract.unstake();
    console.log("Tokens successfully unstaked");
});