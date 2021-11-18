import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, waffle } from "hardhat";
import { restoreSnapshot, setBytecode, takeSnapshot } from '../helpers/rpc'
import { ACL, Kernel, MiniMeToken, Voting } from "../typechain";
import { ANY_ENTITY, installNewApp, newDao, ONE_MINUTE, pct16, toDecimals, ZERO_ADDRESS } from './helpers'

const { utils } = ethers

describe("Voting", function () {
  let root: SignerWithAddress
  let dao: Kernel
  let acl: ACL
  let votingBase: Voting
  let voting: Voting 
  let CREATE_VOTES_ROLES: string

  const appId = utils.namehash("crv-voting.open.aragonpm.eth")
  // Initialization params
  const supportRequired = pct16(50)
  const minAcceptQuorum = pct16(20)
  const voteTime = 10 * ONE_MINUTE
  const minTime = 10 * ONE_MINUTE
  const minBalance = 1
  const minBalanceLowerLimit = 1
  const minBalanceUpperLimit = 10
  const minTimeLowerLimit = 5 * ONE_MINUTE
  const mintTimeUpperLimit = 15 * ONE_MINUTE

  let snapshotId: string

  const useSnapshot = async (): Promise<void> => {
    await restoreSnapshot(snapshotId);
    snapshotId = await takeSnapshot();
  };

  before("Load roles", async () => {
    const Voting = await ethers.getContractFactory("Voting")
    votingBase = (await Voting.deploy()) as Voting
    CREATE_VOTES_ROLES = await votingBase.CREATE_VOTES_ROLE()
  })

  before("Set up DAO", async () => {
    [root] = await ethers.getSigners();
    [dao, acl] = await newDao(root)
  });

  before("Install Voting", async () => {
    const votingAddress = await installNewApp(dao, appId, votingBase.address)

    voting = (await ethers.getContractAt("Voting", votingAddress, root)) as Voting

    await acl.createPermission(ANY_ENTITY, voting.address, CREATE_VOTES_ROLES, root.address)
  })

  before("Initialize Voting", async () => {
    const FreeFromUpToMock = await ethers.getContractFactory("FreeFromUpToMock")
    const MiniMeToken = await ethers.getContractFactory("MiniMeToken")
    const miniMeToken = (await MiniMeToken.deploy(ZERO_ADDRESS, ZERO_ADDRESS, 0, 'Test Token', 18, 'TT', true)) as MiniMeToken

    /* 
      Change Chi Gastoken contract bytecode to point to a mock version
      to avoid revert errors when calling chi.approve() during voting
      contract initialization
    */
    const chiAddress = await voting.chi()
    await setBytecode(chiAddress, FreeFromUpToMock.bytecode)

    await voting.initialize(
      miniMeToken.address,
      supportRequired,
      minAcceptQuorum,
      voteTime,
      minBalance,
      minTime,
      minBalanceLowerLimit,
      minBalanceUpperLimit,
      minTimeLowerLimit,
      mintTimeUpperLimit
    )

    snapshotId = await takeSnapshot()
  })
});
