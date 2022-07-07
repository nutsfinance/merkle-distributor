// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

/**
 * @title Merkle distributor
 */
interface IMerkleDistributor {
    event RootProposed(
        uint256 indexed cycle,
        bytes32 indexed root,
        bytes32 indexed contentHash,
        uint256 startBlock,
        uint256 endBlock,
        uint256 timestamp,
        uint256 blockNumber
    );
    event RootUpdated(
        uint256 indexed cycle,
        bytes32 indexed root,
        bytes32 indexed contentHash,
        uint256 startBlock,
        uint256 endBlock,
        uint256 timestamp,
        uint256 blockNumber
    );
    event Claimed(
        bytes32 indexed user,
        address indexed token,
        uint256 indexed cycle,
        address userAddress,
        uint256 amountToClaim,
        uint256 amountClaimed,
        uint256 timestamp,
        uint256 blockNumber
    );
    event ClaimFailed(
        bytes32 indexed user,
        address indexed token,
        uint256 indexed cycle,
        address userAddress,
        uint256 amountToClaim,
        string errorReason,
        bytes errorData
    );
}
