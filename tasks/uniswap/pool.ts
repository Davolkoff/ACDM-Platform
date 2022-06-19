import { task } from "hardhat/config";
import { IUniswapV2Factory, IUniswapV2Pair, IUniswapV2Router02 } from "../../typechain";
import * as dotenv from "dotenv";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import * as fs from 'fs';

dotenv.config();

task("pool", "Adds liquidity to XXX token and ETH (0.3 ETH and 30000 xxxTokens)")
.setAction(async (args, hre) => {
    let owner: SignerWithAddress;
    [owner] = await hre.ethers.getSigners();

    const factory = <IUniswapV2Factory>(await hre.ethers.getContractAt("IUniswapV2Factory", process.env.FACTORY_ADDRESS as string));
    const router = <IUniswapV2Router02>(await hre.ethers.getContractAt("IUniswapV2Router02", process.env.ROUTER_ADDRESS as string));

    const xxxAmount = await hre.ethers.utils.parseEther("30000");
    const wethAmount = await hre.ethers.utils.parseEther("0.3");

    const xxxToken = await hre.ethers.getContractAt("XXXToken", process.env.XXX_TOKEN_ADDRESS as string)
    await xxxToken.approve(router.address, xxxAmount);
    
    await router.addLiquidityETH(
        xxxToken.address, // address of token
        xxxAmount, // amount desired
        xxxAmount, // amount min
        wethAmount, // WETH amount min
        owner.address, // address, receiving lp tokens
        Date.now() + 31536000, // deadline
        {value:wethAmount}
    );

    const wethAddress = await router.WETH();
    const lpTokenAddress = await factory.getPair(xxxToken.address, wethAddress);
      
    const pair = <IUniswapV2Pair>(await hre.ethers.getContractAt("IUniswapV2Pair", lpTokenAddress));
    const reserves = await pair.getReserves();
    console.log("Tokens successfully paired");

    console.log(`LP Token address: ${lpTokenAddress}`);
    fs.appendFileSync('.env', `\nLP_TOKEN_ADDRESS=${lpTokenAddress}`);
    
    console.log(`Сurrent price (ETH/XXX): ${Math.round(Number(reserves[0]) / Number(reserves[1]) * 1000000) / 1000000}`);
});