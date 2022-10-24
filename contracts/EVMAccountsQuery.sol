// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;
pragma experimental ABIEncoderV2;

import "@acala-network/contracts/evm-accounts/IEVMAccounts.sol";
import "@acala-network/contracts/utils/Address.sol";

contract EVMAccountsQuery is ADDRESS {
    function getAccountId(address evmAddress) public view returns (bytes32) {
        IEVMAccounts evmAccounts = IEVMAccounts(ADDRESS.EVMAccounts);
        return evmAccounts.getAccountId(evmAddress);
    }
}