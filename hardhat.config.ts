import * as dotenv from "dotenv";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";
import "./tasks";
import "hardhat-gas-reporter";

dotenv.config();

export default {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  defaultNetwork: "rinkeby",
  networks: {
    rinkeby:{
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    hardhat: {
      forking: {
        url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
        blockNumber: 10700000
      }
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  }
  //plugins: ["solidity-coverage", "dotenv", "hardhat-etherscan"]
};