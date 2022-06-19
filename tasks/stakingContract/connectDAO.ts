import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("connect", "Connects DAO to staking contract")
.setAction(async (args, hre) => {

    const sContract = await hre.ethers.getContractAt("MyStaking", process.env.STAKING_CONTRACT_ADDRESS as string);

    await sContract.connectDAO(process.env.DAO_ADDRESS as string);
    console.log("DAO successfully connected");
});