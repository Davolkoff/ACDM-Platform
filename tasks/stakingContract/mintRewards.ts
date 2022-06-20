import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("mintrewards", "Mints 100000 XXX tokens to staking contract")
.setAction(async (args, hre) => {

    const rewardsToken = await hre.ethers.getContractAt("XXXToken", process.env.XXX_TOKEN_ADDRESS as string);
    
    await rewardsToken.mint(process.env.STAKING_CONTRACT_ADDRESS as string, "100000000000000000000000");
    console.log("Rewards tokens successfully minted");
});