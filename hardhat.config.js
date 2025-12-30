require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require('dotenv').config();

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            allowUnlimitedContractSize: false,
        },
        base: {
            url: process.env.BASE_RPC_URL !== undefined ? process.env.BASE_RPC_URL : "https://base.llamarpc.com",
            chainId: 8453,
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        },
        baseSepolia: {
            url: process.env.BASE_SEPOLIA_RPC_URL !== undefined ? process.env.BASE_SEPOLIA_RPC_URL : "https://base-sepolia.drpc.org",
            chainId: 84532,
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        }
    },

    etherscan: {
        apiKey: {
            base: process.env.BASE_API_KEY,
            baseSepolia: process.env.BASE_API_KEY
        }
    },

    solidity: {
        compilers: [
            {
                version: "0.8.28",
                settings: {
                    viaIR: true,
                    evmVersion: "cancun",
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
        ],
    },

    gasReporter: {
        enabled: false,
    },

    contractSizer: {
        alphaSort: false,
        disambiguatePaths: false,
        runOnCompile: false,
        strict: false,
        only: [],
    }
}