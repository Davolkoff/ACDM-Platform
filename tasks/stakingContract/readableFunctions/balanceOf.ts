import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("sbalance", "Balance of user in staking contract")
.addParam("user", "Address of user")
.setAction(async (args, hre) => {

    const sContract = await hre.ethers.getContractAt("MyStaking", process.env.STAKING_CONTRACT_ADDRESS as string);

    console.log(`Balance: ${await sContract.balanceOf(args.user)}`);
});