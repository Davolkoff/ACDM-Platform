import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("mintappr", "Mints 30000 XXX and approves them to router")
.setAction(async (args, hre) => {
    const [ user ] = await hre.ethers.getSigners()

    const XXX = await hre.ethers.getContractAt("XXXToken", process.env.XXX_TOKEN_ADDRESS as string);

    const xxxAmount = await hre.ethers.utils.parseEther("30000");

    await XXX.mint(user.address, xxxAmount);
    console.log("Token XXX minted");

    await XXX.approve(process.env.ROUTER_ADDRESS, xxxAmount);
    console.log("Token XXX approved");
    
    console.log("Tokens successfully minted and approved");
});