import { task } from "hardhat/config";
import * as dotenv from "dotenv";
import { jsonAbi, parameters, description, recipients, callableFunctions } from "../../../proposal_params";

dotenv.config();

task("addootpr", "Adds new \"one of two\" proposal")
.setAction(async (args, hre) => {
    
    var iface = new hre.ethers.utils.Interface(jsonAbi);
    var calldata1 = iface.encodeFunctionData(callableFunctions[0], parameters[0]);
    var calldata2 = iface.encodeFunctionData(callableFunctions[1], parameters[1]);

    const daoVoting = await hre.ethers.getContractAt("DAOVoting", process.env.DAO_ADDRESS as string);
    const addProposalResponse = await daoVoting.addOneOfTwoProposal(recipients[0], calldata1, recipients[1], calldata2, description);
    const addProposalReceipt = await addProposalResponse.wait();

    console.log("Proposal successfully added");
    console.log(`Proposal ID: ${addProposalReceipt.events[0].args[0]} - ${Number(addProposalReceipt.events[0].args[0])+1}`);
});