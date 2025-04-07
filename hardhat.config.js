const fs = require("fs");

require("@nomiclabs/hardhat-waffle"); //hardhat-waffle used for testing and deployment

const privateKey = fs.readFileSync(".secret").toString().trim();

module.exports = {
  networks: {
    amoy: {
      url: "https://virtual.polygon-amoy.rpc.tenderly.co/bb75e8d9-b9c8-4de8-8032-18917de2b92b",
      accounts: [privateKey],
    },
  },
  solidity: "0.8.4",
};
