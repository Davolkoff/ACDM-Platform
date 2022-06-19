import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("state", "Returns current state of ACDM platform")
.setAction(async (args, hre) => {
    
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    
    if(await platform.currentState()) {
        console.log("Sale round");
    }
    else {
        console.log("Trade round");
    }

});