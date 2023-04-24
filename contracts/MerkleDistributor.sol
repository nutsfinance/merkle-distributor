// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@acala-network/contracts/evm-accounts/IEVMAccounts.sol";
import "@acala-network/contracts/utils/Address.sol";
import "./IMerkleDistributor.sol";

//Custom Errors
error OnlyAdmin();
error OnlyRootProposer();
error OnlyRootValidator();
error OnlyPauser();
error OnlyUnpauser();
error InvalidCycle(uint256 cycle, uint256 providedCycle);
error InvalidProof();
error FailedClaim(bytes32 user);
error IncorrectRoot(bytes32 root, bytes32 pendingMerkleRoot);
error IncorrectContentHash(bytes32 contentHash, bytes32 pendingMerkleContentHash);
error IncorrectCycleStartBlock(uint256 startBlock, uint256 lastProposeStartBlock);
error IncorrectCycleEndBlock(uint256 endBlock, uint256 lastProposeEndBlock);

/**
 * @title Merkle Distributor
 *
 * Modified from https://github.com/Badger-Finance/badger-system/blob/master/contracts/badger-geyser/BadgerTreeV2.sol
 */
contract MerkleDistributor is ADDRESS, Initializable, AccessControlUpgradeable, PausableUpgradeable, IMerkleDistributor {

    struct MerkleData {
        bytes32 root;
        bytes32 contentHash;
        uint256 timestamp;
        uint256 publishBlock;
        uint256 startBlock;
        uint256 endBlock;
    }

    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant ROOT_PROPOSER_ROLE = keccak256("ROOT_PROPOSER_ROLE");
    bytes32 public constant ROOT_VALIDATOR_ROLE = keccak256("ROOT_VALIDATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UNPAUSER_ROLE = keccak256("UNPAUSER_ROLE");

    bytes32 public merkleRoot;
    bytes32 public pendingMerkleRoot;
    bytes32 public merkleContentHash;
    bytes32 public pendingMerkleContentHash;
    uint256 public currentCycle;
    uint256 public pendingCycle;
    uint256 public lastPublishTimestamp;
    uint256 public lastPublishBlockNumber;
    uint256 public lastProposeTimestamp;
    uint256 public lastProposeBlockNumber;

    // Reward targets are Polkadot address, so it's represented as bytes32
    // Polkadot address => (token address => amount)
    mapping(bytes32 => mapping(address => uint256)) public claimed;
    // Token address => total amount claimed
    mapping(address => uint256) public totalClaimed;

    uint256 public lastPublishStartBlock;
    uint256 public lastPublishEndBlock;

    uint256 public lastProposeStartBlock;
    uint256 public lastProposeEndBlock;

    mapping(uint256 => MerkleData) public merkles;

    function initialize(
        address admin,
        address initialProposer,
        address initialValidator
    ) public initializer {
        __AccessControl_init();
        __Pausable_init_unchained();

        _setupRole(DEFAULT_ADMIN_ROLE, admin); // The admin can edit all role permissions
        _setupRole(ROOT_PROPOSER_ROLE, initialProposer); // The admin can edit all role permissions
        _setupRole(ROOT_VALIDATOR_ROLE, initialValidator); // The admin can edit all role permissions
    }

    /// ===== Modifiers =====

    modifier _onlyAdmin() {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender))
            revert OnlyAdmin();
        _;
    }
    /// @notice Root updaters can update the root
    modifier _onlyRootProposer() {
        if (!hasRole(ROOT_PROPOSER_ROLE, msg.sender))
            revert OnlyRootProposer();
        _;
    }

    modifier _onlyRootValidator() {
        if (!hasRole(ROOT_VALIDATOR_ROLE, msg.sender))
            revert OnlyRootValidator();
        _;
    }

    modifier _onlyPauser() {
        if (!hasRole(PAUSER_ROLE, msg.sender))
            revert OnlyPauser();
        _;
    }

    modifier _onlyUnpauser() {
        if (!hasRole(UNPAUSER_ROLE, msg.sender))
            revert OnlyUnpauser();
        _;
    }

    function getCurrentMerkleData() external view returns (MerkleData memory data) {
        data = MerkleData(merkleRoot, merkleContentHash, lastPublishTimestamp, lastPublishBlockNumber, lastPublishStartBlock, lastPublishEndBlock);
    }

    function getPendingMerkleData() external view returns (MerkleData memory data) {
        data = MerkleData(
            pendingMerkleRoot,
            pendingMerkleContentHash,
            lastProposeTimestamp,
            lastProposeBlockNumber,
            lastProposeStartBlock,
            lastProposeEndBlock
        );
    }


    function hasPendingRoot() external view returns (bool result) {
        result = pendingCycle == currentCycle + 1;
    }


    /// @dev Return true if account has outstanding claims in any token from the given input data
    function isClaimAvailableFor(
        bytes32 user,
        address[] calldata tokens,
        uint256[] calldata cumulativeAmounts
    ) public view returns (bool) {
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 userClaimable = cumulativeAmounts[i] - claimed[user][tokens[i]];
            if (userClaimable > 0) {
                return true;
            }
        }
        return false;
    }

    /// @dev Get the number of tokens claimable for an account, given a list of tokens and latest cumulativeAmounts data
    function getClaimableFor(
        bytes32 user,
        address[] calldata tokens,
        uint256[] calldata cumulativeAmounts
    ) public view returns (address[] memory outTokens, uint256[] memory outUserClaimable) {
        outUserClaimable = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            outUserClaimable[i] = cumulativeAmounts[i] - claimed[user][tokens[i]];
        }
        outTokens = tokens;
    }


    function getClaimedFor(bytes32 user, address[] calldata tokens) public view returns (address[] memory outTokens, uint256[] memory outUserClaimed) {
        outUserClaimed = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            outUserClaimed[i] = claimed[user][tokens[i]];
        }
        outTokens = tokens;
    }


    function encodeClaim(
        address[] calldata tokens,
        uint256[] calldata cumulativeAmounts,
        bytes32 account,
        uint256 index,
        uint256 cycle
    ) public pure returns (bytes memory encoded, bytes32 hash) {
        encoded = abi.encode(index, account, cycle, tokens, cumulativeAmounts);
        hash = keccak256(encoded);
    }

    /// @notice Claim accumulated rewards for a set of tokens at a given cycle number
    function claim(
        bytes32 user,
        address[] calldata tokens,
        uint256[] calldata cumulativeAmounts,
        uint256 index,
        uint256 cycle,
        bytes32[] calldata merkleProof
    ) public whenNotPaused returns (uint256[] memory outClaimed) {
        (,uint256[] memory claimable) = getClaimableFor(user, tokens, cumulativeAmounts);

        outClaimed = claim(user, tokens, cumulativeAmounts, index, cycle, merkleProof, claimable);
    }


    /// @notice Claim accumulated rewards for a set of tokens at a given cycle number
    function claim(
        bytes32 user,
        address[] memory tokens,
        uint256[] memory cumulativeAmounts,
        uint256 index,
        uint256 cycle,
        bytes32[] memory merkleProof,
        uint256[] memory amountsToClaim
    ) public whenNotPaused returns (uint256[] memory outAmountsClaimed) {
        if (cycle != currentCycle) 
            revert InvalidCycle(cycle, currentCycle);

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encode(index, user, cycle, tokens, cumulativeAmounts));
        if (!MerkleProofUpgradeable.verify(merkleProof, merkleRoot, node))
            revert InvalidProof();

        IEVMAccounts evmAccounts = IEVMAccounts(ADDRESS.EVMAccounts);
        address userAddress = evmAccounts.getEvmAddress(user);
        if (userAddress == address(0x0)) {
            if (!evmAccounts.claimDefaultEvmAddress(user))
                revert FailedClaim(user);
            userAddress = evmAccounts.getEvmAddress(user);
        }

        outAmountsClaimed = new uint256[](tokens.length);
        // Claim each token
        for (uint256 i = 0; i < tokens.length; i++) {
            outAmountsClaimed[i] = _tryClaim(cycle, user, userAddress, tokens[i], cumulativeAmounts[i], amountsToClaim[i]);
        }
    }


    function _tryClaim(uint256 cycle, bytes32 user, address userAddress, address token, uint256 cumulative, uint256 amountToClaim) internal returns (uint256) {
        // If none claimable for token, skip
        if (cumulative == 0) {
            return 0;
        }

        uint256 claimable = cumulative - claimed[user][token];
        // If all claimed, skip
        if (claimable == 0) {
            return 0;
        }
        // If claim more than claimable, claim max
        uint256 amount = amountToClaim;
        if (amountToClaim > claimable) {
            amount = claimable;
        }

        // Update first for re-entrancy protection
        claimed[user][token] += amount;
        totalClaimed[token] += amount;

        try IERC20Upgradeable(token).transfer(userAddress, amount) {
            emit Claimed(user, userAddress, token, amount, cycle, block.timestamp, block.number, msg.sender);
        } catch Error(string memory revertReason) {
            // Revert
            claimed[user][token] -= amount;
            totalClaimed[token] -= amount;
            emit ClaimFailed(user, userAddress, token, amount, cycle, block.timestamp, block.number, msg.sender, revertReason, '');

            return 0;
        } catch (bytes memory returnData) {
            // Revert
            claimed[user][token] -= amount;
            totalClaimed[token] -= amount;
            emit ClaimFailed(user, userAddress, token, amount, cycle, block.timestamp, block.number, msg.sender, '', returnData);

            return 0;
        }

        return amount;
    }

    // ===== Root Updater Restricted =====

    /// @notice Propose a new root and content hash, which will be stored as pending until approved
    function proposeRoot(
        bytes32 root,
        bytes32 contentHash,
        uint256 cycle,
        uint256 startBlock,
        uint256 endBlock
    ) external whenNotPaused _onlyRootProposer {
        if (cycle != currentCycle + 1) 
            revert InvalidCycle(cycle, currentCycle);

        pendingCycle = cycle;
        pendingMerkleRoot = root;
        pendingMerkleContentHash = contentHash;
        lastProposeStartBlock = startBlock;
        lastProposeEndBlock = endBlock;

        lastProposeTimestamp = block.timestamp;
        lastProposeBlockNumber = block.number;

        emit RootProposed(cycle, pendingMerkleRoot, pendingMerkleContentHash, startBlock, endBlock, block.timestamp, block.number);
    }

    /// ===== Guardian Restricted =====

    /// @notice Approve the current pending root and content hash
    function approveRoot(
        bytes32 root,
        bytes32 contentHash,
        uint256 cycle,
        uint256 startBlock,
        uint256 endBlock
    ) external whenNotPaused _onlyRootValidator {
        if (root != pendingMerkleRoot) 
            revert IncorrectRoot(root, pendingMerkleRoot);

        if (contentHash != pendingMerkleContentHash) 
            revert IncorrectContentHash(contentHash, pendingMerkleContentHash);

        if (cycle != pendingCycle) 
            revert InvalidCycle(cycle, pendingCycle);

        if (startBlock != lastProposeStartBlock) 
            revert IncorrectCycleStartBlock(startBlock, lastProposeStartBlock);

        if (endBlock != lastProposeEndBlock) 
            revert IncorrectCycleEndBlock(endBlock, lastProposeEndBlock);

        currentCycle = cycle;
        merkleRoot = root;
        merkleContentHash = contentHash;
        lastPublishStartBlock = startBlock;
        lastPublishEndBlock = endBlock;

        lastPublishTimestamp = block.timestamp;
        lastPublishBlockNumber = block.number;

        merkles[cycle] = MerkleData({
            root: root,
            contentHash: contentHash,
            timestamp: block.timestamp,
            publishBlock: block.number,
            startBlock: startBlock,
            endBlock: endBlock
        });

        emit RootUpdated(currentCycle, root, contentHash, startBlock, endBlock, block.timestamp, block.number);
    }

    function withdraw(address _token, uint256 _amount) _onlyAdmin public {
        IERC20Upgradeable(_token).safeTransfer(msg.sender, _amount);
    }

    /// @notice Pause publishing of new roots
    function pause() _onlyPauser external {
        _pause();
    }

    /// @notice Unpause publishing of new roots
    function unpause() _onlyUnpauser external {
        _unpause();
    }
}