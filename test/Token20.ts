import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("ERC20 unused functions", function () {
    let owner: SignerWithAddress;
    let platform: SignerWithAddress;
    let addr1: SignerWithAddress;
    let xxxToken: Contract;
    let acdmToken: Contract;

    describe("Deploying", function () {
        it("Should deploy ERC20 contract and mint them on your balance", async function () {
            [owner, platform, addr1] = await ethers.getSigners();
            const token1 = await ethers.getContractFactory("ACDMToken");
            const token2 = await ethers.getContractFactory("XXXToken");
            
            acdmToken = await token1.deploy("ACADEM Coin", "ACDM", 6)
            xxxToken = await token2.deploy("XXX Coin", "XXX", 18);

            await acdmToken.deployed();
            await xxxToken.deployed();
        });

        it("Should connect tokens to platform", async function () {
            await acdmToken.connectPlatform(platform.address);
            await xxxToken.connectPlatform(platform.address);
        });
        it("Should revert connecting tokens to platform not by an owner", async function () {
            await expect(acdmToken.connect(addr1).connectPlatform(platform.address)).to.be.revertedWith("Not an owner");
            await expect(xxxToken.connect(addr1).connectPlatform(platform.address)).to.be.revertedWith("Not an owner");
        });
        it("Should revert second connecting tokens to platform", async function () {
            await expect(acdmToken.connectPlatform(platform.address)).to.be.revertedWith("Already connected");
            await expect(xxxToken.connectPlatform(platform.address)).to.be.revertedWith("Already connected");
        });
    });

    describe("Token functions", function () {
        it("Should return total supply of tokens", async function () {
            expect(await acdmToken.totalSupply()).to.equal(0);
            expect(await xxxToken.totalSupply()).to.equal(0);
        });

        it("Should revert transfer if you try to send more than allowed", async function () {
            await expect(acdmToken.transferFrom(addr1.address, owner.address, 1000)).to.be.revertedWith("You try to transfer more than allowed");
            await expect(xxxToken.transferFrom(addr1.address, owner.address, 1000)).to.be.revertedWith("You try to transfer more than allowed");
        });

        it("Should revert transfer if you have not enough tokens", async function () {
            await expect(acdmToken.transfer(addr1.address, 1000)).to.be.revertedWith("Not enough tokens");
            await expect(xxxToken.transfer(addr1.address, 1000)).to.be.revertedWith("Not enough tokens");

            await acdmToken.connect(addr1).approve(owner.address, 10000000000);
            await expect(acdmToken.transferFrom(addr1.address, owner.address, 1000000)).to.be.revertedWith("Not enough tokens");

            await xxxToken.connect(addr1).approve(owner.address, 10000000000);
            await expect(xxxToken.transferFrom(addr1.address, owner.address, 1000000)).to.be.revertedWith("Not enough tokens");
        });

        it("Should revert burning if you are not a platform", async function () {
            await expect(acdmToken.burn(addr1.address, 1000)).to.be.revertedWith("Not a platform");
            await expect(xxxToken.burn(addr1.address, 1000)).to.be.revertedWith("Not a platform");
        });

        it("Should revert all calls with address(0)", async function () {
            await acdmToken.connect(platform).mint(owner.address, 10000);
            await xxxToken.mint(owner.address, 10000);

            await acdmToken.connect(platform).mint(addr1.address, 10000);
            await xxxToken.mint(addr1.address, 10000);
            const addr = "0x0000000000000000000000000000000000000000";

            await acdmToken.connect(addr1).approve(owner.address, 100000000);
            await expect(acdmToken.transfer(addr, 1000)).to.be.revertedWith("Enter correct address");
            await expect(acdmToken.transferFrom(addr1.address, addr, 1000)).to.be.revertedWith("Enter correct address");
            await expect(acdmToken.approve(addr, 1000)).to.be.revertedWith("Enter correct address");

            await xxxToken.connect(addr1).approve(owner.address, 100000000);
            await expect(xxxToken.transfer(addr, 1000)).to.be.revertedWith("Enter correct address");
            await expect(xxxToken.transferFrom(addr1.address, addr, 1000)).to.be.revertedWith("Enter correct address");
            await expect(xxxToken.approve(addr, 1000)).to.be.revertedWith("Enter correct address");
        });

        it("Should revert burning if account has not enough tokens", async function () {
            await expect(acdmToken.connect(platform).burn(addr1.address, 10000000000)).to.be.revertedWith("Not enough tokens");
            await expect(xxxToken.connect(platform).burn(addr1.address, 10000000000)).to.be.revertedWith("Not enough tokens");
        });
    });
});