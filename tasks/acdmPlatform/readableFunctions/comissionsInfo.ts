import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("cominfo", "Returns information about comissions")
.setAction(async (args, hre) => {
    
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    
    const info = await platform.comissions();
    console.log(`First level referrer comission (Sale round): ${Number(info[0])/10} %`);
    console.log(`Second level referrer comission (Sale round): ${Number(info[1])/10} %`);
    console.log(`First level referrer comission (Trade round): ${Number(info[2])/10} %`);
    console.log(`Second level referrer comission (Trade round): ${Number(info[3])/10} %`);

});