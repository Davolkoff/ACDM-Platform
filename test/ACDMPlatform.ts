import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, network } from "hardhat";
import { IUniswapV2Factory, IUniswapV2Pair, IUniswapV2Router02 } from "../typechain";

describe("ACDM Platform", function () {
  let XXXToken: Contract;
  let ACDMToken: Contract;
  let lpToken: Contract;
  let stakingContract: Contract;
  let votingContract: Contract;
  let acdmContract: Contract;

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress; // first referrer
  let addr2: SignerWithAddress; // second referrer

  describe("Deploying", function () {
    it("Should deploy XXX token", async function () {
      const ERC20 = await ethers.getContractFactory("XXXToken");
      XXXToken = await ERC20.deploy("XXXCoin", "XXX", 18);
      await XXXToken.deployed();
    });

    it("Should deploy ACDM token", async function () {
      const ERC20 = await ethers.getContractFactory("ACDMToken");
      ACDMToken = await ERC20.deploy("ACADEM Coin", "ACDM", 6);
      await ACDMToken.deployed();
    });

    it("Should mint tokens on user's account for creating pair", async function() {
      [owner, addr1, addr2] = await ethers.getSigners();
      const xxxAmount = await ethers.utils.parseEther("100000000");

      await XXXToken.mint(owner.address, xxxAmount);
      expect(await XXXToken.balanceOf(owner.address)).to.equal(xxxAmount);
    });

    it("Should create uniswap pair XXX/ETH", async function () {
      const factory = <IUniswapV2Factory>(await ethers.getContractAt("IUniswapV2Factory", process.env.FACTORY_ADDRESS as string));
      const router = <IUniswapV2Router02>(await ethers.getContractAt("IUniswapV2Router02", process.env.ROUTER_ADDRESS as string));

      const xxxAmount = await ethers.utils.parseEther("10000000");
      const wethAmount = await ethers.utils.parseEther("100");

      await XXXToken.approve(router.address, xxxAmount);
      expect(await XXXToken.allowance(owner.address, router.address)).to.equal(xxxAmount);
      await router.addLiquidityETH(
        XXXToken.address, // address of token
        xxxAmount, // amount desired
        xxxAmount, // amount min
        wethAmount, // WETH amount min
        owner.address, // address, receiving lp tokens
        Date.now() + 31536000, // deadline
        {value:wethAmount}
      );

      const wethAddress = await router.WETH();
      const lpTokenAddress = await factory.getPair(XXXToken.address, wethAddress);
      
      
      const pair = <IUniswapV2Pair>(await ethers.getContractAt("IUniswapV2Pair", lpTokenAddress));
      const reserves = await pair.getReserves();

      expect(Math.round(Number(reserves[0])/Number(reserves[1])*100000)/100000).to.equal(0.00001);
      
      lpToken = await ethers.getContractAt("IERC20", lpTokenAddress);
      expect(Number(await lpToken.balanceOf(owner.address))).to.greaterThan(0);
    });

    it("Should deploy staking contract successfully", async function() {
      const Staking = await ethers.getContractFactory("MyStaking");

      stakingContract = await Staking.deploy(1200, 3, 604800, lpToken.address, XXXToken.address);
      await stakingContract.deployed();
    });

    it("Should stake tokens to staking contract", async function () {
      await lpToken.approve(stakingContract.address, 1000)
      await stakingContract.stake(1000);
      expect(await stakingContract.balanceOf(owner.address)).to.equal(1000);
    });

    it("Should deploy DAO Voting contract", async function () {
      const VC = await ethers.getContractFactory("DAOVoting");
      
      votingContract = await VC.deploy(owner.address, stakingContract.address, 1, 1000);
      await votingContract.deployed();

      const info = await votingContract.settingsInfo();
      expect(info[0]).to.equal(1);
      expect(info[1]).to.equal(1000);
    });

    it("Should connect DAO to staking contract", async function () {
      await stakingContract.connectDAO(votingContract.address);
    });

    it("Should successfully mint rewards tokens to staking contract", async function() {
      const rewardsAmount = "10000000000000000000000";
      await XXXToken.mint(stakingContract.address, rewardsAmount);
      expect(await XXXToken.balanceOf(stakingContract.address)).to.equal(rewardsAmount);
    });

    it("Should deploy ACDM Platform contract successfully", async function () {
      const ACDM = await ethers.getContractFactory("ACDMPlatform");

      acdmContract = await ACDM.deploy(
        process.env.ROUTER_ADDRESS, 
        ACDMToken.address, 
        votingContract.address, 
        XXXToken.address,
        await ethers.utils.parseEther("0.00000000001"), // start price
        await ethers.utils.parseEther("1"), // start amount
        30, 20, 25, 25 // comissions (3.0, 2.0, 2.5, 2.5)
      )
    });

    it("Should connect ACDM platform to ACDM and XXX tokens", async function () {
      await ACDMToken.connectPlatform(acdmContract.address);
      await XXXToken.connectPlatform(acdmContract.address);
    });
  });

  describe("Platform functions", function () {
    it("Should allow you to register on platform", async function () {
      await acdmContract.connect(addr1).register(addr2.address); //addr2 - refferer1
      await acdmContract.register(addr1.address); //addr 1 - refferer1, addr2 - refferer2
    });

    it("Should revert buying ACDM tokens if you send not enough ETH", async function () {
      await expect(acdmContract.buyACDM({value: ethers.utils.parseEther("0.000000000000000001")})).to.be.revertedWith("Not enough ETH");
    });

    it("Should allow you to start sale round", async function () {
      await acdmContract.startSaleRound();
      var info = await acdmContract.currentState();
      expect(info[0]).to.equal(true);
    });

    it("Should revert the second start of sale round", async function () {
      await expect(acdmContract.startSaleRound()).to.be.revertedWith("Sale round already started");
    });

    it("Should allow you to buy tokens for ETH on sale round", async function () {
      await acdmContract.buyACDM({value: ethers.utils.parseEther("0.8")});
      await acdmContract.connect(addr2).buyACDM({value: ethers.utils.parseEther("0.1")});
      await acdmContract.connect(addr1).buyACDM({value: ethers.utils.parseEther("0.1")});
      expect(await ACDMToken.balanceOf(owner.address)).to.equal(80000*(10**6)); // * 10^6, because it has 6 decimals 
      expect(await ACDMToken.balanceOf(addr2.address)).to.equal(10000*(10**6));
      expect(await ACDMToken.balanceOf(addr1.address)).to.equal(10000*(10**6));
    });

    it("Should revert all trade round functions if it's sale round now", async function () {
      await expect(acdmContract.addOrder(100000,1000)).to.be.revertedWith("Available only on trade round");
      await expect(acdmContract.removeOrder(1)).to.be.revertedWith("Available only on trade round");
      await expect(acdmContract.redeemOrder(addr1.address, 1)).to.be.revertedWith("Available only on trade round");
    });

    it("Should allow you to start trade round earler, than in 3 days, if sale round pool is empty", async function () {
      await acdmContract.startTradeRound();
      const info = await acdmContract.currentState();
      expect(info[0]).to.equal(false);
    });

    it("Should revert the second start of trade round", async function () {
      await expect(acdmContract.startTradeRound()).to.be.revertedWith("Trade round already started");
    });

    it("Should revert buying ACDM tokens from the system in trade round", async function () {
      await expect(acdmContract.buyACDM({value: ethers.utils.parseEther("1")})).to.be.revertedWith("Available only on sale round");
    });

    it("Should allow you to add new order", async function () {
      await ACDMToken.approve(acdmContract.address, 10000*(10**6));
      expect(await ACDMToken.allowance(owner.address, acdmContract.address)).to.equal(10000*(10**6));

      await acdmContract.addOrder(10000*(10**6), await ethers.utils.parseEther("0.1"));
      const info = await acdmContract.orderInfo(owner.address, 0);
      expect(info[0]).to.equal(Number(await ethers.utils.parseEther("0.1")) / Number(10000*(10**6)));
      expect(info[1]).to.equal(10000*(10**6));
      expect(await ACDMToken.balanceOf(acdmContract.address)).to.equal(10000*(10**6));
    });
    
    it("Should revert adding order, if you hasn't got enough tokens", async function () {
      await expect(acdmContract.addOrder(1000000*(10**6), await ethers.utils.parseEther("0.1"))).to.be.revertedWith("Not enough balance");
    });

    it("Should revert adding order, if one of parameters equals 0", async function () {
      await expect(acdmContract.addOrder(0, await ethers.utils.parseEther("0.1"))).to.be.revertedWith("Incorrect amount");
    });

    it("Should revert adding order, if amount higher than price", async function () {
      await expect(acdmContract.addOrder(1000000000, 100000)).to.be.revertedWith("Make your price higher");
    });

    it("Should revert redeem order, if you try to send less ETH, than price of 1 token", async function () {
      await expect(acdmContract.redeemOrder(owner.address, 0, {value: 1})).to.be.revertedWith("Not enough ETH");
    });

    it("Should revert redeem order, if you try to send more ETH, than can be processed by order", async function () {
      await expect(acdmContract.redeemOrder(owner.address, 0, {value: await ethers.utils.parseEther("1000")})).to.be.revertedWith("Not enough tokens in order");
    });

    it("Should allow you to remove order", async function () {
      await acdmContract.removeOrder(0);
      await expect(acdmContract.orderInfo(owner.address, 0)).to.be.reverted;
    });

    it("Should allow you to redeem order", async function () {
      await ACDMToken.approve(acdmContract.address, 10000*(10**6));
      expect(await ACDMToken.allowance(owner.address, acdmContract.address)).to.equal(10000*(10**6));

      await acdmContract.addOrder(10000*(10**6), await ethers.utils.parseEther("0.1"));

      await ACDMToken.connect(addr1).approve(acdmContract.address, 10000*(10**6));
      await acdmContract.connect(addr1).addOrder(10000*(10**6), await ethers.utils.parseEther("0.1"));

      await ACDMToken.connect(addr2).approve(acdmContract.address, 10000*(10**6));
      await acdmContract.connect(addr2).addOrder(10000*(10**6), await ethers.utils.parseEther("0.1"));

      await acdmContract.connect(addr2).redeemOrder(owner.address, 0, {value: await ethers.utils.parseEther("0.05")}); // 2 referrers
      await acdmContract.connect(addr1).redeemOrder(addr1.address, 0, {value: await ethers.utils.parseEther("0.06")}); // 1 referrer
      await acdmContract.connect(addr1).redeemOrder(addr2.address, 0, {value: await ethers.utils.parseEther("0.07")}); // 0 referrers
      await acdmContract.redeemOrder(addr2.address, 0, {value: await ethers.utils.parseEther("0.03")}); // full purchase

      expect(await ACDMToken.balanceOf(addr2.address)).to.equal(5000*(10**6));
      expect(await ACDMToken.balanceOf(addr1.address)).to.equal(13000*(10**6));
    });
    
    it("Should revert starting sale round if 3 days didn't left", async function () {
      await expect(acdmContract.startSaleRound()).to.be.revertedWith("Not time yet");
    });

    it("Should allow you to start sale round", async function () {
      await ethers.provider.send('evm_increaseTime', [260000]);
      await ethers.provider.send('evm_mine', []);

      await acdmContract.startSaleRound();

      const info = await acdmContract.currentState();
      expect(info[0]).to.equal(true);

      const srInfo = await acdmContract.saleRoundInfo();
      expect(Math.floor(srInfo[0] / 10**6)).to.equal(2097);
      expect(srInfo[1]).to.equal(14300000);
    });

    it("Should revert starting trade round if 3 days didn't left", async function () {
      await expect(acdmContract.startTradeRound()).to.be.revertedWith("Not time yet");

      await ethers.provider.send('evm_increaseTime', [260000]);
      await ethers.provider.send('evm_mine', []);
      await acdmContract.startTradeRound();
    });

    describe("\"RequireDAO\" functions", function () {
      it("Should set comissions by DAO", async function () {

        var jsonAbi = [{
          "inputs": [
            {
              "internalType": "uint256",
              "name": "ref1SaleComission_",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "ref2SaleComission_",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "ref1TradeComission_",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "ref2TradeComission_",
              "type": "uint256"
            }
          ],
          "name": "setComissions",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }];
        
        var iface = new ethers.utils.Interface(jsonAbi);
        var calldata = iface.encodeFunctionData('setComissions', [200, 300, 400, 500]);
        await votingContract.addProposal(acdmContract.address, calldata, "Changing comissions", false);
        await votingContract.vote(0, true);

        await ethers.provider.send('evm_increaseTime', [2000]);
        await ethers.provider.send('evm_mine', []);
        await votingContract.finishProposal(0);

        const info = await acdmContract.comissions();
        expect(info[0]).to.equal(200);
        expect(info[1]).to.equal(300);
        expect(info[2]).to.equal(400);
        expect(info[3]).to.equal(500);
      });

      it("Should revert calling DAO functions by users", async function () {
        await expect(acdmContract.setComissions(200, 300, 400, 500)).to.be.revertedWith("Not a DAO");
        await expect(acdmContract.buyXXXTokens()).to.be.revertedWith("Not a DAO");
        await expect(acdmContract.withdrawETH(owner.address)).to.be.revertedWith("Not a DAO");
      });

      it("Should allow users to decide: send comission to owner or buy XXX Tokens (buy XXX case)", async function () {
        var jsonAbi = [{
          "inputs": [],
          "name": "buyXXXTokens",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "recipient_",
              "type": "address"
            }
          ],
          "name": "withdrawETH",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }];

        var iface = new ethers.utils.Interface(jsonAbi);
        var calldata1 = iface.encodeFunctionData('buyXXXTokens', []);
        var calldata2 = iface.encodeFunctionData('withdrawETH', [owner.address]);
        await votingContract.addOneOfTwoProposal(acdmContract.address, calldata1, acdmContract.address, calldata2, "One of two");
        await votingContract.vote(1, true); // you can use proposal Id 1 or 2, effect will be the same
        
        await expect(votingContract.vote(2, true)).to.be.revertedWith("You have already voted"); // second simple proposal inside "one of two"
        
        await ethers.provider.send('evm_increaseTime', [2000]);
        await ethers.provider.send('evm_mine', []);

        const pair = <IUniswapV2Pair>(await ethers.getContractAt("IUniswapV2Pair", lpToken.address));
        const initReserves = await pair.getReserves();

        await votingContract.finishProposal(2);

        const endReserves = await pair.getReserves();

        expect(Number(endReserves[0]) - Number(initReserves[0])).to.be.greaterThan(0);
        expect(Number(initReserves[1]) - Number(endReserves[1])).to.be.greaterThan(0);
        expect(await XXXToken.balanceOf(acdmContract.address)).to.equal(0);
      });

      it("Should allow users to decide: send comission to owner or buy XXX Tokens (withdraw case)", async function () {
        var jsonAbi = [{
          "inputs": [],
          "name": "buyXXXTokens",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "recipient_",
              "type": "address"
            }
          ],
          "name": "withdrawETH",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }];

        var iface = new ethers.utils.Interface(jsonAbi);
        var calldata1 = iface.encodeFunctionData('buyXXXTokens', []);
        var calldata2 = iface.encodeFunctionData('withdrawETH', [addr2.address]);
        await votingContract.addOneOfTwoProposal(acdmContract.address, calldata1, acdmContract.address, calldata2, "One of two");
        await votingContract.vote(3, false);
        
        await network.provider.send("hardhat_setBalance", [
          votingContract.address,
          "0x1000000",
        ]);
          
        const amount = await ethers.provider.getBalance(acdmContract.address);
        await ethers.provider.send('evm_increaseTime', [2000]);
        await ethers.provider.send('evm_mine', []);
        const initBalance = Number(await ethers.provider.getBalance(addr2.address));
        await votingContract.finishProposal(3);
        const endBalance = Number(await ethers.provider.getBalance(addr2.address));
        
        expect(Math.round((endBalance - initBalance)/10000000)).to.equal(Math.round(Number(amount)/10000000));
      });
    });
  });
});
