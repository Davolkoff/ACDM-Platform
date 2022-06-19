import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("neword", "Creates new order at trade round")
.addParam("ameth", "Amount of ETH (in wei)")
.addParam("amxxx", "Amount of XXX")
.setAction(async (args, hre) => {
    
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    const token = await hre.ethers.getContractAt("ACDMToken", process.env.ACDM_TOKEN_ADDRESS as string);

    await token.approve(process.env.ACDM_PLATFORM as string, args.amxxx);

    const newOrderResponse = await platform.addOrder(args.amxxx, args.ameth);;
    const newOrderReceipt = await newOrderResponse.wait();
    console.log("Order successfully created!");
    console.log(`Order Id: ${newOrderReceipt.events[0].args[1].toString()}`);

});