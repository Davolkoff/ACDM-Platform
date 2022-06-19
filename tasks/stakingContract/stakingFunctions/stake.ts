import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("stake", "Sends lp tokens to contract")
.addParam("amount", "Amount of tokens")
.setAction(async (args, hre) => {

    const lpToken = await hre.ethers.getContractAt("IERC20", process.env.LP_TOKEN_ADDRESS as string);
    const sContract = await hre.ethers.getContractAt("MyStaking", process.env.STAKING_CONTRACT_ADDRESS as string);

    await lpToken.approve(process.env.STAKING_CONTRACT_ADDRESS as string, args.amount);
    console.log("Tokens approved")
    await sContract.stake(args.amount);
    console.log("Tokens staked");
});