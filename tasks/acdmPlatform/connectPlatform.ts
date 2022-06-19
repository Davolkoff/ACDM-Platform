import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("connectpl", "Connects platform to XXX token and ACDM token")
.setAction(async (args, hre) => {
    
    const ACDMtoken = await hre.ethers.getContractAt("ACDMToken", process.env.ACDM_TOKEN_ADDRESS as string);
    const XXXtoken = await hre.ethers.getContractAt("XXXToken", process.env.XXX_TOKEN_ADDRESS as string);

    await ACDMtoken.connectPlatform(process.env.ACDM_PLATFORM as string);
    console.log("Connected to ACDM token");
    await XXXtoken.connectPlatform(process.env.ACDM_PLATFORM as string);
    console.log("Connected to XXX token");
});