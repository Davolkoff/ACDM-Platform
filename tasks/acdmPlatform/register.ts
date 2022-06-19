import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("register", "Register on platform")
.addOptionalParam("referrer", "Your referrer")
.setAction(async (args, hre) => {
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    
    if(args.referrer == undefined) {
        await platform.register(process.env.ACDM_PLATFORM as string);
    }
    else {
        await platform.register(args.referrer);
    }
    
    console.log("Successfully registered");
});