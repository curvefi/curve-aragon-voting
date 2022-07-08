import "dotenv/config";
import { HardhatUserConfig } from "hardhat/types";

import "@1hive/hardhat-aragon";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-deploy";

import { node_url, accounts } from "./utils/network";

// While waiting for hardhat PR: https://github.com/nomiclabs/hardhat/pull/1542
if (process.env.HARDHAT_FORK) {
  process.env["HARDHAT_DEPLOY_FORK"] = process.env.HARDHAT_FORK;
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.4.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
    ],
  },
  aragon: {
    appEnsName: "crv-voting.open.aragonpm.eth",
    appContractName: "Voting",
    appRoles: [
      {
        name: "Create new votes",
        id: "CREATE_VOTES_ROLE",
        params: [],
      },
      {
        name: "Modify support",
        id: "MODIFY_SUPPORT_ROLE",
        params: ["New support", "Current support"],
      },
      {
        name: "Modify quorum",
        id: "MODIFY_QUORUM_ROLE",
        params: ["New quorum", "Current quorum"],
      },
      {
        name: "Set the minimum required balance",
        id: "SET_MIN_BALANCE_ROLE",
        params: [],
      },
      {
        name: "Set the minimum required time between one user creating new votes",
        id: "SET_MIN_TIME_ROLE",
        params: [],
      },
      {
        name: "Enable vote creation",
        id: "ENABLE_VOTE_CREATION",
        params: [],
      },
      {
        name: "Disable vote creation",
        id: "DISABLE_VOTE_CREATION",
        params: [],
      },
    ],
  },
  networks: {
    hardhat: {
      // process.env.HARDHAT_FORK will specify the network that the fork is made from.
      // this line ensure the use of the corresponding accounts
      accounts: accounts(process.env.HARDHAT_FORK),
      forking: process.env.HARDHAT_FORK
        ? {
            url: node_url(process.env.HARDHAT_FORK),
            blockNumber: process.env.HARDHAT_FORK_NUMBER
              ? parseInt(process.env.HARDHAT_FORK_NUMBER)
              : undefined,
          }
        : undefined,
    },
    localhost: {
      url: node_url("localhost"),
      accounts: accounts(),
      ensRegistry: "0x4E065c622d584Fbe5D9078C3081840155FA69581",
    },
    mainnet: {
      url: node_url("mainnet"),
      accounts: accounts("mainnet"),
      ensRegistry: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"
    },
    rinkeby: {
      url: node_url("rinkeby"),
      accounts: accounts("rinkeby"),
      ensRegistry: "0x98Df287B6C145399Aaa709692c8D308357bC085D",
    },
    xdai: {
      url: node_url("xdai"),
      accounts: accounts("xdai"),
      ensRegistry: "0xaafca6b0c89521752e559650206d7c925fd0e530",
    },
    polygon: {
      url: node_url("polygon"),
      accounts: accounts("polygon"),
      ensRegistry: "0x7EdE100965B1E870d726cD480dD41F2af1Ca0130",
    },
    mumbai: {
      url: node_url("mumbai"),
      accounts: accounts("mumbai"),
      ensRegistry: "0xB1576a9bE5EC445368740161174f3Dd1034fF8be",
    },
    arbitrum: {
      url: node_url("arbitrum"),
      accounts: accounts("arbitrum"),
      ensRegistry: "0xB1576a9bE5EC445368740161174f3Dd1034fF8be",
    },
    arbtest: {
      url: node_url("arbtest"),
      accounts: accounts("arbtest"),
      ensRegistry: "0x73ddD4B38982aB515daCf43289B41706f9A39199",
    },
    frame: {
      url: "http://localhost:1248",
      httpHeaders: { origin: "hardhat" },
      timeout: 0,
      gas: 0,
    },
  },
  ipfs: {
    pinata: {
      key: process.env.PINATA_KEY || "",
      secret: process.env.PINATA_SECRET_KEY || "",
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  mocha: {
    timeout: 0,
  },
  external: process.env.HARDHAT_FORK
    ? {
        deployments: {
          // process.env.HARDHAT_FORK will specify the network that the fork is made from.
          // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
          hardhat: ["deployments/" + process.env.HARDHAT_FORK],
          localhost: ["deployments/" + process.env.HARDHAT_FORK],
        },
      }
    : undefined,
};

export default config;
