import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("srinfo", "Returns information about sale round")
.setAction(async (args, hre) => {
    
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    
    const info = await platform.saleRoundInfo();
    console.log(`Amount of tokens: ${Number(info[0])/1000000}`);
    console.log(`Price (ACDM/ETH): ${Number(info[1])/100}`);

});