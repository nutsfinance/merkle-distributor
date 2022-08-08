// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @dev Collector of rewards for merkle distributor.
 */
contract RewardCollector is Ownable {
    using SafeERC20 for IERC20;

    event OperatorUpdated(address _user, bool _allowed);

    address public target;
    mapping(address => bool) public operators;

    constructor(address _target) {
        require(_target != address(0x0), "target not set");
    }

    function updateOperator(address _user, bool _allowed) public onlyOwner {
        operators[_user] = _allowed;
        emit OperatorUpdated(_user, _allowed);
    }

    function distribute(address[] memory _tokens, uint256[] memory _amounts) public {
        require(msg.sender == owner() || operators[msg.sender], "not allowed");
        require(_tokens.length == _amounts.length, "mismatch");

        address _target = target;
        for (uint256 i = 0; i < _tokens.length; i++) {
            IERC20(_tokens[i]).safeTransfer(_target, _amounts[i]);
        }
    }

    function withdraw(address _token, uint256 _amount) public onlyOwner {
        IERC20(_token).safeTransfer(msg.sender, _amount);
    }
}