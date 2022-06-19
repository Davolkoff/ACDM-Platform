import { task } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

task("vinfo", "Information about selected voting")
.addParam("pid", "Proposal ID")
.setAction(async (args, hre) => {
    
    const daoVoting = await hre.ethers.getContractAt("DAOVoting", process.env.DAO_ADDRESS as string);
    const info = await daoVoting.votingInfo(args.pid);

    let type: string;

    if(info[0]) type = "one of two";
    else type = "standard";

    console.log(`Information about voting #${args.pid}`);
    console.log(`\nType: ${type}`)
    console.log(`\nDescription: ${info[1]}`);
    console.log("\nVotes:");
    console.log(`For: ${info[2]}`);
    console.log(`Against: ${info[3]}`);
    console.log(`\nEnded: ${info[4]}`);
});