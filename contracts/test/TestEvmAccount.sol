// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../IEvmAccount.sol";

/**
 * @title EVM Account checker.
*/
contract TestEvmAccount is IEvmAccount {
    function getEvmAddress(bytes32 user) external pure override returns (address) {
        return address(uint160(uint256(user)));
    }

    function getPolkadotAddress(address user) external pure override returns (bytes32) {
        return keccak256(abi.encode(user));
    }
}