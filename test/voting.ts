import { ethers } from "hardhat";
import { waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Voting } from "../typechain";

const { deployContract } = waffle;

describe("Voting", function () {
  let signers: SignerWithAddress[];

  before(async () => {
    signers = await ethers.getSigners();
  });

  beforeEach(async () => {});

  it("", async () => {});
});
