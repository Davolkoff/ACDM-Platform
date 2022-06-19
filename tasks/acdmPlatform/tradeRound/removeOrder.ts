import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("remord", "Removes your order")
.addParam("id", "Order Id")
.setAction(async (args, hre) => {
    
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    
    await platform.removeOrder(args.id);
    console.log("Order successfully removed");
});