import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("buy", "Buy tokens at sale round")
.addParam("amount", "Amount of ETH you want to spend (in wei)")
.setAction(async (args, hre) => {

    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    await platform.buyACDM({value: args.amount});

    console.log(`Successfully bought ACDM tokens`);
});