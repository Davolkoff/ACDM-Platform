import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("ordinfo", "Returns information about selected order")
.addParam("seller", "Seller's address")
.addParam("id", "Order Id")
.setAction(async (args, hre) => {
    
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    
    const info = await platform.orderInfo(args.seller, args.id)
    console.log(`Price per token: ${info[0]}`);
    console.log(`Amount: ${info[1]}`);

});