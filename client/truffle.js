//truffle configuration - setup wallet and link to Infura to access blockchain
var HDWalletProvider = require("truffle-hdwallet-provider");

var infura_apikey = "https://ropsten.infura.io/v3/bc3f54d03f2a4534ae1cd4a092bd46cc";
var mnemonic = "anger bus stamp orient lava jelly diamond knife crumble news nothing plug";

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 9545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: new HDWalletProvider(mnemonic, infura_apikey),
      network_id: 3
    }
  }
};
