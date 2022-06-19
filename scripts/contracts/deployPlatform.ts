import { run, ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from 'fs';

dotenv.config();

async function main() {
  await run("compile");

  const Platform = await ethers.getContractFactory("ACDMPlatform");
  
  const contract = await Platform.deploy(
    process.env.ROUTER_ADDRESS, 
    process.env.ACDM_TOKEN_ADDRESS, 
    process.env.DAO_ADDRESS, 
    process.env.XXX_TOKEN_ADDRESS, 
    await ethers.utils.parseEther("0.00000000001"), 
    await ethers.utils.parseEther("1"), 
    30, 20, 25, 25);

  await contract.deployed();

  console.log("ACDM platform address: ", contract.address);
  fs.appendFileSync('.env', `\nACDM_PLATFORM=${contract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });