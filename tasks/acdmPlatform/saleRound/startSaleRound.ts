import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("ssr", "Starts sale round")
.setAction(async (args, hre) => {
    
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    
    await platform.startSaleRound();
    console.log("Sale round successfully started!");

});