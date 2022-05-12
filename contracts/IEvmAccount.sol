// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

/**
 * @title Evm address checker.
*/
interface IEvmAccount {
    function getEvmAddress(bytes32 user) external returns (address);

    function getPolkadotAddress(address user) external returns (bytes32);
}