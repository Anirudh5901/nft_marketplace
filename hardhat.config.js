const fs = require("fs");

require("@nomiclabs/hardhat-waffle"); //hardhat-waffle used for testing and deployment

const privateKey = fs.readFileSync(".secret").toString().trim();

module.exports = {
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337, // Explicitly set to match Hardhat node
      accounts: [privateKey], // Optional: Use for deployment
    },
    amoy: {
      url: "https://virtual.polygon-amoy.rpc.tenderly.co/bb75e8d9-b9c8-4de8-8032-18917de2b92b",
      accounts: [privateKey],
    },
  },
  solidity: "0.8.4",
};
