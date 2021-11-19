import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  increase,
  restoreSnapshot,
  setBytecode,
  takeSnapshot,
} from "../helpers/rpc";
import {
  ACL,
  ExecutionTarget,
  Kernel,
  MiniMeToken,
  Voting,
} from "../typechain";
import {
  ANY_ENTITY,
  encodeCallScript,
  getEventArgument,
  installNewApp,
  newDao,
  ONE_MINUTE,
  pct16,
  toDecimals,
  ZERO_ADDRESS,
} from "./helpers";

const { utils } = ethers;

describe("Voting", function () {
  let signers: SignerWithAddress[];
  let root: SignerWithAddress;
  let voteCreator: SignerWithAddress;
  let voter: SignerWithAddress;
  let dao: Kernel;
  let acl: ACL;
  let votingBase: Voting;
  let voting: Voting;
  let token: MiniMeToken;
  let executionTarget: ExecutionTarget;
  const appId = utils.namehash("crv-voting.open.aragonpm.eth");

  // Initialization params
  const supportRequired = pct16(50);
  const minAcceptQuorum = pct16(20);
  const voteTime = 10 * ONE_MINUTE;
  const minTime = 10 * ONE_MINUTE;
  const minBalance = 1;
  const minBalanceLowerLimit = 1;
  const minBalanceUpperLimit = 10;
  const minTimeLowerLimit = 5 * ONE_MINUTE;
  const mintTimeUpperLimit = 15 * ONE_MINUTE;

  let snapshotId: string;

  const useSnapshot = async (): Promise<void> => {
    await restoreSnapshot(snapshotId);

    snapshotId = await takeSnapshot();
  };

  before("Load roles", async () => {
    const Voting = await ethers.getContractFactory("Voting");
    votingBase = (await Voting.deploy()) as Voting;
  });

  before("Set up DAO", async () => {
    signers = await ethers.getSigners();
    [root, voteCreator, voter] = signers;
    [dao, acl] = await newDao(root);
  });

  before("Install Voting", async () => {
    const votingAddress = await installNewApp(dao, appId, votingBase.address);
    voting = (await ethers.getContractAt(
      "Voting",
      votingAddress,
      root
    )) as Voting;

    const CREATE_VOTES_ROLE = await votingBase.CREATE_VOTES_ROLE();
    await acl.createPermission(
      ANY_ENTITY,
      voting.address,
      CREATE_VOTES_ROLE,
      root.address
    );
  });

  before("Initialize Voting", async () => {
    const FreeFromUpToMock = await ethers.getContractFactory(
      "FreeFromUpToMock"
    );
    const MiniMeToken = await ethers.getContractFactory("MiniMeToken");
    const tokenDecimals = 18;
    token = (await MiniMeToken.deploy(
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      0,
      "Test Token",
      tokenDecimals,
      "TT",
      true
    )) as MiniMeToken;

    await token.generateTokens(
      voteCreator.address,
      toDecimals(10, tokenDecimals)
    );
    await token.generateTokens(voter.address, toDecimals(10, tokenDecimals));

    /*
      Change Chi Gastoken contract bytecode to point to a mock version
      to avoid revert errors when calling chi.approve() during voting
      contract initialization
    */
    const chiAddress = await voting.chi();
    await setBytecode(chiAddress, FreeFromUpToMock.bytecode);

    await voting.initialize(
      token.address,
      supportRequired,
      minAcceptQuorum,
      voteTime,
      minBalance,
      minTime,
      minBalanceLowerLimit,
      minBalanceUpperLimit,
      minTimeLowerLimit,
      mintTimeUpperLimit
    );

    const ExecutionTarget = await ethers.getContractFactory("ExecutionTarget");
    executionTarget = (await ExecutionTarget.deploy()) as ExecutionTarget;

    snapshotId = await takeSnapshot();
  });

  describe("when creating a vote", () => {
    let voteCreatorVoting: Voting;

    let voteId: BigNumber;

    beforeEach("Prepare voting", async () => {
      await useSnapshot();

      voteCreatorVoting = voting.connect(voteCreator);

      const action = {
        to: executionTarget.address,
        data: executionTarget.interface.encodeFunctionData("execute"),
      };

      // Create a first vote to run following tests with a non-zero voteId
      await voteCreatorVoting["newVote(bytes,string)"](
        encodeCallScript([action]),
        ""
      );
      await increase(voteTime.toString());

      const receipt = await voteCreatorVoting["newVote(bytes,string)"](
        encodeCallScript([action]),
        ""
      );

      voteId = await getEventArgument(
        voting,
        receipt.hash,
        "StartVote",
        "voteId"
      );
    });

    describe("when casting a vote", () => {
      let voterVoting: Voting;

      let voterStake: BigNumber;

      const votePct = (pct: number | string): BigNumber =>
        BigNumber.from(pct16(pct));

      const encodeVoteData = (
        voteId: BigNumber,
        votePct: BigNumber
      ): BigNumber => voteId.shl(128).or(votePct.shl(64));

      before("Prepare vote casting", async () => {
        voterVoting = voting.connect(voter);
        voterStake = await token.balanceOf(voter.address);
      });

      it("should emit a correct CastVote event", async () => {
        const voterPct = votePct(66);
        const voteData = encodeVoteData(voteId, voterPct);

        expect(await voterVoting.vote(voteData, false, false))
          .to.emit(voterVoting, "CastVote")
          .withArgs(voteId, voter.address, voterPct, voterStake);
      });

      it("should cast the correct proportions of yea and nay", async () => {
        const voterPct = votePct(73);
        const voteData = encodeVoteData(voteId, voterPct);

        await voterVoting.vote(voteData, false, false);

        const vote = await voting.getVote(voteId);
        const voteCreatorStake = await token.balanceOf(voteCreator.address);
        const voterYeaStake = voterStake
          .mul(voterPct)
          .div(await voting.PCT_BASE());
        const voterNayStake = voterStake.sub(voterYeaStake);

        expect(
          vote.yea.sub(voteCreatorStake),
          "Incorrect yea proportion"
        ).to.be.equal(voterYeaStake);
        expect(vote.nay, "Incorrect nay proportion").to.be.equal(voterNayStake);
      });

      it("should revert when casting a 50% vote", async () => {
        const voterPct = votePct(50);
        const voteData = encodeVoteData(voteId, voterPct);

        expect(voterVoting.vote(voteData, false, false)).to.be.revertedWith(
          "VOTE_CANNOT_ABSTAIN"
        );
      });
    });
  });
});
