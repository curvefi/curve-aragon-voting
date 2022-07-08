// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC721} from "@openzeppelin/contracts/interfaces/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";

interface IVotingEscrow is IERC721 {
  function token() external view returns (address);

  function decimals() external view returns (uint8);

  function balanceOfNFT(uint256) external view returns (uint256);

  function totalSupplyWithoutDecay() external view returns (uint256);

  function isApprovedOrOwner(address, uint256) external view returns (bool);

  function attach(uint256 tokenId) external;

  function detach(uint256 tokenId) external;

  function voting(uint256 tokenId) external;

  function abstain(uint256 tokenId) external;

  function totalSupply() external view returns (uint256);

  function totalSupplyAt(uint256 _block) external view returns (uint256);
  
  function votingPowerOf(address _owner)
    external
    view
    returns (uint256 _power);

  function votingPowerOfAtTs(address _owner, uint256 timestamp)
    external
    view
    returns (uint256 _power);

  function votingPowerOfAtBlk(address _owner, uint256 blk)
    external
    view
    returns (uint256 _power);

  enum DepositType {
    DEPOSIT_FOR_TYPE,
    CREATE_LOCK_TYPE,
    INCREASE_LOCK_AMOUNT,
    INCREASE_UNLOCK_TIME,
    MERGE_TYPE
  }

  struct Point {
    int128 bias;
    int128 slope; // # -dweight / dt
    uint256 ts;
    uint256 blk; // block
  }

  /* We cannot really do block numbers per se b/c slope is per time, not per block
   * and per block could be fairly bad b/c Ethereum changes blocktimes.
   * What we can do is to extrapolate ***At functions */

  struct LockedBalance {
    int128 amount;
    uint256 end;
    uint256 start;
  }

  event Deposit(
    address indexed provider,
    uint256 tokenId,
    uint256 value,
    uint256 indexed locktime,
    DepositType deposit_type,
    uint256 ts
  );

  event Withdraw(
    address indexed provider,
    uint256 tokenId,
    uint256 value,
    uint256 ts
  );

  event Supply(uint256 prevSupply, uint256 supply);
}