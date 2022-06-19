import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("str", "Starts trade round")
.setAction(async (args, hre) => {
    
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    
    await platform.startTradeRound();
    console.log("Trade round successfully started!");
});