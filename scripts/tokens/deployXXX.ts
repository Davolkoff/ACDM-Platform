import { run, ethers } from "hardhat";
import * as fs from 'fs';

async function main() {
  await run("compile");

  const ERC20 = await ethers.getContractFactory("XXXToken");
  const contract = await ERC20.deploy("XXXToken", "XXX", 18);

  await contract.deployed();

  console.log("XXX token address: ", contract.address);

  fs.appendFileSync('.env', `\nXXX_TOKEN_ADDRESS=${contract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });