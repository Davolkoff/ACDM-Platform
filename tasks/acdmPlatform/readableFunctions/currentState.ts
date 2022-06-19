import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("state", "Returns current state of ACDM platform")
.setAction(async (args, hre) => {
    
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    
    const state = await platform.currentState();
    if(state[0]) {
        console.log("Sale round");
    }
    else {
        console.log("Trade round");
    }
    const timeObject = new Date(Number(state[1])*1000);

    console.log(`Started: ${timeObject}`);
});