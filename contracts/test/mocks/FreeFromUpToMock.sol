/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

pragma solidity 0.4.24;


contract FreeFromUpToMock {
    function approve(address spender, uint256 amount) external returns (bool) {
        return true;
    }
}
