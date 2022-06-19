import { run, ethers } from "hardhat";
import * as fs from 'fs';

async function main() {
  await run("compile");

  const ERC20 = await ethers.getContractFactory("ACDMToken");
  const contract = await ERC20.deploy("ACADEM Coin", "ACDM", 6);

  await contract.deployed();

  console.log("ACDM token address: ", contract.address);

  fs.appendFileSync('.env', `\nACDM_TOKEN_ADDRESS=${contract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });