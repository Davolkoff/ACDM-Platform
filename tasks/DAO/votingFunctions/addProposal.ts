import { task } from "hardhat/config";
import * as dotenv from "dotenv";
import { jsonAbi, parameters, description, recipients, callableFunctions } from "../../../proposal_params";

dotenv.config();

task("addpr", "Adds new proposal")
.setAction(async (args, hre) => {
    
    var iface = new hre.ethers.utils.Interface(jsonAbi);
    var calldata = iface.encodeFunctionData(callableFunctions[0], parameters[0]);

    const daoVoting = await hre.ethers.getContractAt("DAOVoting", process.env.DAO_ADDRESS as string);

    const addProposalResponse = await daoVoting.addProposal(recipients[0], calldata, description, false);
    const addProposalReceipt = await addProposalResponse.wait();

    console.log("Proposal successfully added");
    console.log(`Proposal ID: ${addProposalReceipt.events[0].args[0]}`);
});