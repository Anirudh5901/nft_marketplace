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
  },
  solidity: "0.8.4",
};
