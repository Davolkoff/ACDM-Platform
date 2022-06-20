import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("register", "Register on platform")
.addParam("referrer", "Your referrer")
.setAction(async (args, hre) => {

    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    await platform.register(args.referrer);    
    console.log("Successfully registered");
    
});