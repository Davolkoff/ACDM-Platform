import { task } from "hardhat/config";
import * as dotenv from "dotenv";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

dotenv.config();

task("redord", "Redeems order")
.addParam("seller", "Seller's address")
.addParam("id", "Order Id")
.addParam("amount", "amount of ETH you want to spend (in wei)")
.setAction(async (args, hre) => {
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);
    await platform.redeemOrder(args.seller, args.id, {value: args.amount}); 
});