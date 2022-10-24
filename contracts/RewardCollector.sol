// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/**
 * @dev Collector of rewards for merkle distributor.
 */
contract RewardCollector is Initializable, AccessControlUpgradeable, PausableUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UNPAUSER_ROLE = keccak256("UNPAUSER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    using SafeERC20Upgradeable for IERC20Upgradeable;

    event OperatorUpdated(address _user, bool _allowed);

    address public target;
    mapping(address => bool) public operators;

    function initialize(
        address admin,
        address _target
    ) public initializer {
        __AccessControl_init();
        __Pausable_init_unchained();

        require(_target != address(0x0), "target not set");
        target = _target;
        _setupRole(DEFAULT_ADMIN_ROLE, admin); // The admin can edit all role permissions
    }

    /// @notice Admins can approve new root updaters or admins
    function _onlyAdmin() internal view {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "onlyAdmin");
    }

    function _onlyPauser() internal view {
        require(hasRole(PAUSER_ROLE, msg.sender), "onlyPauser");
    }

    function _onlyUnpauser() internal view {
        require(hasRole(UNPAUSER_ROLE, msg.sender), "onlyUnpauser");
    }

    function _onlyDistributor() internal view {
        require(hasRole(DISTRIBUTOR_ROLE, msg.sender), "onlyDistributor");
    }

    function updateOperator(address _user, bool _allowed) public {
        _onlyAdmin();
        operators[_user] = _allowed;
        emit OperatorUpdated(_user, _allowed);
    }

    function distribute(address[] memory _tokens, uint256[] memory _amounts) public {
        _onlyDistributor();
        require(_tokens.length == _amounts.length, "mismatch");

        address _target = target;
        for (uint256 i = 0; i < _tokens.length; i++) {
            IERC20Upgradeable(_tokens[i]).safeTransfer(_target, _amounts[i]);
        }
    }

    function withdraw(address _token, uint256 _amount) public {
        _onlyAdmin();
        IERC20Upgradeable(_token).safeTransfer(msg.sender, _amount);
    }

    /// @notice Pause publishing of new roots
    function pause() external {
        _onlyPauser();
        _pause();
    }

    /// @notice Unpause publishing of new roots
    function unpause() external {
        _onlyUnpauser();
        _unpause();
    }
}