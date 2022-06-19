import { task } from "hardhat/config";
import * as dotenv from "dotenv";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

dotenv.config();

task("buy", "Buy tokens at sale round")
.addParam("amount", "Amount of ETH you want to spend (in wei)")
.setAction(async (args, hre) => {
    let spender: SignerWithAddress;
    const token = await hre.ethers.getContractAt("ACDMToken", process.env.ACDM_TOKEN_ADDRESS as string);
    const platform = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM as string);

    [spender] = await hre.ethers.getSigners();
    const initBalance = Number(await token.balanceOf(spender.address));

    await platform.buyACDM({value: args.amount});

    const endBalance = Number(await token.balanceOf(spender.address));

    console.log(`Successfully bought ${(endBalance - initBalance)/10**6} ACDM tokens`);
});