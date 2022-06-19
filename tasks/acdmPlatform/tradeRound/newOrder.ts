import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("neword", "Creates new order at trade round")
.addParam("ameth", "Amount of ETH (in wei)")
.addParam("amacdm", "Amount of ACDM")
.setAction(async (args, hre) => {
    
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    const token = await hre.ethers.getContractAt("ACDMToken", process.env.ACDM_TOKEN_ADDRESS as string);

    await token.approve(process.env.ACDM_PLATFORM as string, args.amacdm);

    const newOrderResponse = await platform.addOrder(args.amacdm, args.ameth);;
    const newOrderReceipt = await newOrderResponse.wait();
    console.log("Order successfully created!");
    console.log(`Order Id: ${newOrderReceipt.events[1].args[1]}`);
});