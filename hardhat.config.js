const fs = require("fs");

require("@nomiclabs/hardhat-waffle"); //hardhat-waffle used for testing and deployment

const privateKey = fs.readFileSync(".secret").toString().trim();

module.exports = {
  networks: {
    hardhat: {
      chainId: 1337,
    },
  },
  solidity: "0.8.4",
};
