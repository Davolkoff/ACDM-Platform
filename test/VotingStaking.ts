import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { MerkleTree } from "merkletreejs";
import { whitelistMembers } from "../whitelist";

describe("Voting + Staking", function () {
    let XXXToken: Contract;
    let lpToken: Contract;
    let stakingContract: Contract;
    let votingContract: Contract;

    let merkleTree: MerkleTree;
    let hexProof: string[];

    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addr3: SignerWithAddress;
  

    describe("Deploying", function () {
        it("Should deploy XXX token", async function () {
            const ERC20 = await ethers.getContractFactory("XXXToken");
            XXXToken = await ERC20.deploy("XXXCoin", "XXX", 18);
            await XXXToken.deployed();

            lpToken = await ERC20.deploy("LP Uniswap", "UNI", 18);
            await XXXToken.deployed();
        });

        it("Should mint tokens on user's accounts", async function() {
            [owner, addr1, addr2, addr3] = await ethers.getSigners();
            const xxxAmount = await ethers.utils.parseEther("100000000");

            await XXXToken.mint(owner.address, xxxAmount);
            await XXXToken.mint(addr1.address, xxxAmount);
            expect(await XXXToken.balanceOf(addr1.address)).to.equal(xxxAmount);
            expect(await XXXToken.balanceOf(owner.address)).to.equal(xxxAmount);

            await lpToken.mint(owner.address, 1000000000000);
            await lpToken.mint(addr1.address, 1000000);
            await lpToken.mint(addr3.address, 1000000000000);
        });

        it("Should deploy staking contract successfully", async function() {
            const Staking = await ethers.getContractFactory("MyStaking");
            
            let whitelistMembers = [
                owner.address,
                addr1.address,
                addr2.address
            ]

            const leaves = whitelistMembers.map(addr => keccak256(addr));

            merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
            const rootHash = '0x' + merkleTree.getRoot().toString('hex');
            hexProof = merkleTree.getHexProof(keccak256(owner.address));

            stakingContract = await Staking.deploy(1200, 3, 604800, rootHash, lpToken.address, XXXToken.address);
            await stakingContract.deployed();
        });

        it("Should deploy DAO Voting contract", async function () {
            const VC = await ethers.getContractFactory("DAOVoting");
            
            votingContract = await VC.deploy(owner.address, stakingContract.address, 100, 1000);
            await votingContract.deployed();

            const info = await votingContract.settingsInfo();
            expect(info[0]).to.equal(100);
            expect(info[1]).to.equal(1000);
        });

        it("Should connect DAO to staking contract", async function () {
            await stakingContract.connectDAO(votingContract.address);
        });

        it("Should revert connecting DAO second time", async function() {
            await expect(stakingContract.connectDAO(votingContract.address)).to.be.revertedWith("DAO already connected");
        });

        it("Should revert connecting DAO not by an owner", async function() {
            await expect(stakingContract.connect(addr1).connectDAO(votingContract.address)).to.be.revertedWith("Not an owner");
        });

        it("Should successfully mint rewards tokens to staking contract", async function() {
            const rewardsAmount = "10000000000000000000000";
            await XXXToken.mint(stakingContract.address, rewardsAmount);
            expect(await XXXToken.balanceOf(stakingContract.address)).to.equal(rewardsAmount);
        });
    });


    describe("Staking functions", function() {
        it("Should stake lp tokens", async function() {
            const lpTokenAmount = 1000000000;

            await lpToken.approve(stakingContract.address, lpTokenAmount);
            await stakingContract.stake(lpTokenAmount/2, hexProof);
            await stakingContract.stake(lpTokenAmount/2, hexProof);

            expect(await lpToken.balanceOf(stakingContract.address)).to.equal(lpTokenAmount);
        });

        it("Should revert staking, if you are not in whitelist", async function () {
            await lpToken.connect(addr3).approve(stakingContract.address, 10000000);
            await expect(stakingContract.connect(addr3).stake(10000000, hexProof)).to.be.revertedWith("You are not in whitelist");
        });

        it("Should revert transaction if you try to send 0 tokens", async function() {
            await expect(stakingContract.stake(0, hexProof)).to.be.revertedWith("You can't send 0 tokens");
        });

        it("Should revert changing settings if you are not a DAO", async function() {
            await expect(stakingContract.changeFreezeTime(300)).to.be.revertedWith("Not a DAO");
        });
        
        it("Should withdraw rewards tokens", async function() {
            await network.provider.send("evm_increaseTime", [700000]);
            await network.provider.send("evm_mine");

            await stakingContract.claim();
            expect(Number(await XXXToken.balanceOf(owner.address))).to.greaterThan(0);
        });

        it("Should revert withdrawing rewards tokens, if you haven't got them on contract balance", async function () {
            await expect(stakingContract.claim()).to.be.revertedWith("You haven't got reward tokens");
        });

        it("Should withdraw user's available lp tokens", async function() {
            const unwithdrawableAmount = "20000000";
            await lpToken.approve(stakingContract.address, unwithdrawableAmount);
            await stakingContract.stake(unwithdrawableAmount, hexProof);

            await stakingContract.unstake();
            expect(await stakingContract.balanceOf(owner.address)).to.equal(unwithdrawableAmount);
        });

        it("Should revert unstaking if you haven't staked tokens", async function() {
            await network.provider.send("evm_increaseTime", [1500]);
            await network.provider.send("evm_mine");
            await stakingContract.unstake();
            await expect(stakingContract.unstake()).to.be.revertedWith("Nothing to unstake");
        });

        it("Should revert unstaking if you haven't available lp tokens", async function() {
            const unwithdrawableAmount = "20000000";
            await lpToken.approve(stakingContract.address, unwithdrawableAmount);
            await stakingContract.stake(unwithdrawableAmount, hexProof);
            await expect(stakingContract.unstake()).to.be.revertedWith("You can't unstake lp tokens right now");
        });
    });

    describe("DAO functions", function () {
        it("Should allow chairperson to add new proposal", async function () {
            var jsonAbi = [{
              "inputs": [
                {
                  "internalType": "uint256",
                  "name": "_freezeTime",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "_rewardsPercent",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "_rewardsFrequency",
                  "type": "uint256"
                }
              ],
              "name": "changeSettings",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            },
            {
                "inputs": [
                  {
                    "internalType": "uint256",
                    "name": "freezeTime_",
                    "type": "uint256"
                  }
                ],
                "name": "changeFreezeTime",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }];
      
            var description = "Changing settings in staking contract";
            // for testing situations with correct signature
            var iface = new ethers.utils.Interface(jsonAbi);
            var calldata = iface.encodeFunctionData('changeSettings', [100, 10, 10]);
      
            // I created two proposals to test different situations (here I work with external contract)
            expect(await votingContract.lastProposal()).to.equal(0);
            await votingContract.addProposal(stakingContract.address, calldata, description, false);

            expect(await votingContract.lastProposal()).to.equal(1);
            await votingContract.addProposal(stakingContract.address, calldata, description, false);

            var calldata2 = iface.encodeFunctionData('changeFreezeTime', [1000]);
            await votingContract.addOneOfTwoProposal(stakingContract.address, calldata, stakingContract.address, calldata2, "One of two (without votes)");
            await votingContract.addOneOfTwoProposal(stakingContract.address, calldata, stakingContract.address, calldata2, "One of two ()");
            // expectations
            const info = await votingContract.votingInfo(0);
            
            expect(info[0]).to.equal(false)
            expect(info[1]).to.equal(description);
            expect(info[2]).to.equal("0");
            expect(info[3]).to.equal("0");
            expect(info[4]).to.equal(false);
            await expect(
              votingContract.connect(addr1).addProposal(stakingContract.address, calldata, description, false)
              ).to.be.revertedWith("Not a chairperson");
      
            // here I work with chainging settings inside voting contract
            jsonAbi = [{
              "inputs": [
                {
                  "internalType": "uint256",
                  "name": "minimumQuorum_",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "debatingPeriodDuration_",
                  "type": "uint256"
                }
              ],
              "name": "changeSettings",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }];
            description = "Changing settings of voting contract"
            iface = new ethers.utils.Interface(jsonAbi);
            calldata = iface.encodeFunctionData('changeSettings', [20, 1200]);
            await votingContract.addProposal(votingContract.address, calldata, description, false);
        });

        it("Should allow you to vote in the voting", async function () {
            const addr1HexProof = merkleTree.getHexProof(keccak256(addr1.address));
            await lpToken.connect(addr1).approve(stakingContract.address, 200);
            await stakingContract.connect(addr1).stake(200, addr1HexProof);

            // first voting (proposal accepted by users)
            await votingContract.vote(0, 1);
            await votingContract.connect(addr1).vote(0, 0);
            var info = await votingContract.votingInfo(0);
            expect(info[2]).to.equal("20000000");
            expect(info[3]).to.equal("200");
            
          });
      
        it("Should allow you to delegate your vote", async function () {
            await votingContract.delegateVote(addr1.address, 1);
            
            //second voting (proposal rejected by users)
            await votingContract.connect(addr1).vote(1, 0);
            const info = await votingContract.votingInfo(1);
            expect(info[2]).to.equal("0");
            expect(info[3]).to.equal("20000200");
        });
        
        it("Shouldn't allow you to delegate your votes if recipient already voted", async function () {
            await expect(votingContract.connect(addr1).delegateVote(owner.address, 1)).to.be.revertedWith("This user have already voted");
        });
        
        it("Shouldn't allow you to delegate your votes if you already voted", async function () {
            await expect(votingContract.delegateVote(addr2.address, 1)).to.be.revertedWith("You have already voted");
        });

        it("Shouldn't allow you to vote if you haven't got staked tokens", async function () {
            await expect(votingContract.connect(addr2).vote(2, 1)).to.be.revertedWith("You haven't got staked tokens");
        });
        
        it("Shouldn't allow you to delegate your votes if you haven't got staked tokens", async function () {
            await expect(votingContract.connect(addr2).delegateVote(owner.address, 2)).to.be.revertedWith("You haven't got staked tokens");
        });
        
        it("Shouldn't allow you to delegate your votes to yourself", async function () {
            await expect(votingContract.connect(addr1).delegateVote(addr1.address, 2)).to.be.revertedWith("You can't delegate tokens to yourself");
        });
        
        it("Should allow you to vote just once", async function () {
            await expect(votingContract.vote(0, 0)).to.be.revertedWith("You have already voted");
        });

        it("Shouldn't allow you to vote in non - existent votings", async function () {
            await expect(votingContract.vote(99, 1)).to.be.revertedWith("Proposal doesn't exist");
        });

        it("Shouldn't allow you to finish voting if time haven't expired", async function () {
            await expect(votingContract.finishProposal(0)).to.be.revertedWith("Too early");
        });

        it("Shouldn't allow you to unstake, if you have active votings", async function () {
            await ethers.provider.send('evm_increaseTime', [10000]);
            await ethers.provider.send('evm_mine', []);
            await expect(stakingContract.unstake()).to.be.revertedWith("You have got active votings");
        });

        it("Shouldn't allow you to vote if time expired", async function () {
            await expect(votingContract.vote(0, false)).to.be.revertedWith("Too late");
        });

        it("Should allow you to finish voting", async function () {
            await votingContract.finishProposal(0);
      
            const info = await stakingContract.stakingInfo();
            expect(info[0]).to.equal(1200);
            expect(info[1]).to.equal(3);
            expect(info[2]).to.equal(604800);
        });
      
        it("Should change contract settings", async function () {
            await votingContract.finishProposal(1);
            await votingContract.finishProposal(2);
            await votingContract.finishProposal(3);
            
            const info = await votingContract.settingsInfo();
            expect(info[0]).to.equal(100);
            expect(info[1]).to.equal(1000);
        });

        it("Should revert finishing voting, if proposal doesn't exist", async function () {
            await expect(votingContract.finishProposal(15)).to.be.revertedWith("Proposal doesn't exist");
        });
      
        it("Should change settings only by DAO voting", async function () {
            await expect(votingContract.changeSettings(20,1200)).to.be.revertedWith("Function can't be called by user");
        });

        it("Should end withdrawing only be staking contract", async function () {
            await expect(votingContract.endWithdrawing(owner.address)).to.be.revertedWith("Not staking contract");
        });

        it("Should unstake your tokens if you haven't got active votings", async function () {
            await stakingContract.unstake();
        });

        it("Should change voting contract settings by DAO", async function () {
            var jsonAbi = [{
                "inputs": [
                  {
                    "internalType": "uint256",
                    "name": "minimumQuorum_",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "debatingPeriodDuration_",
                    "type": "uint256"
                  }
                ],
                "name": "changeSettings",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                  {
                    "internalType": "uint256",
                    "name": "freezeTime_",
                    "type": "uint256"
                  }
                ],
                "name": "changeFreezeTime",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }];
            var iface = new ethers.utils.Interface(jsonAbi);
            var calldata = iface.encodeFunctionData('changeSettings', [10, 1000]);
            await votingContract.addProposal(votingContract.address, calldata, "Changing settings in voting contract", false);

            var calldata = iface.encodeFunctionData('changeFreezeTime', [100]);
            await votingContract.addProposal(stakingContract.address, calldata, "Changing freezing time in staking contract", false);

            await votingContract.connect(addr1).vote(7, 1);
            await votingContract.connect(addr1).vote(8, 1);

            await network.provider.send("evm_increaseTime", [10000]);
            await network.provider.send("evm_mine", []);

            await votingContract.finishProposal(7);
            const info = await votingContract.settingsInfo();

            expect(info[0]).to.equal(10);
            expect(info[1]).to.equal(1000);
        });

        it("Should change freezing time in staking contract by DAO", async function () {
            await votingContract.finishProposal(8);
            const info = await stakingContract.stakingInfo();
            expect(info[0]).to.equal(100);
        });
        
        it("Should allow chairperson to change root hash in staking contract by voting", async function () {
            const jsonAbi = [{
                "inputs": [
                  {
                    "internalType": "bytes32",
                    "name": "whitelistMerkleRoot_",
                    "type": "bytes32"
                  }
                ],
                "name": "changeWhitelistMerkleRoot",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }];
            const iface = new ethers.utils.Interface(jsonAbi);
            const description = "Exclude owner from the whitelist";

            let whitelistMembers = [
                addr1.address,
                addr2.address
            ]

            const leaves = whitelistMembers.map(addr => keccak256(addr));

            const changedMerkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
            const rootHash = '0x' + changedMerkleTree.getRoot().toString('hex');

            const calldata = iface.encodeFunctionData('changeWhitelistMerkleRoot', [rootHash]);

            await lpToken.approve(stakingContract.address, 100);
            await stakingContract.stake(100, hexProof); // here I (owner) can stake tokens without problems

            await votingContract.addProposal(stakingContract.address, calldata, description, false);

            await votingContract.vote(9, 1);

            await ethers.provider.send('evm_increaseTime', [10000]);
            await ethers.provider.send('evm_mine', []);

            await votingContract.finishProposal(9); // here I has been excluded from whitelist
            
            // here I have a problem with staking tokens
            const changedHexProof = merkleTree.getHexProof(keccak256(owner.address));
            await lpToken.approve(stakingContract.address, 100);
            await expect(stakingContract.stake(100, changedHexProof)).to.be.revertedWith("You are not in whitelist");
        });
    });
});