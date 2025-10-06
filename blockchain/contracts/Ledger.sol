// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Ledger {
    event TxRecorded(bytes32 indexed id, address indexed user, int256 amount, string currency, uint256 timestamp);

    mapping(bytes32 => bool) public seen;

    function record(bytes32 id, int256 amount, string calldata currency) external {
        require(!seen[id], "duplicate");
        seen[id] = true;
        emit TxRecorded(id, msg.sender, amount, currency, block.timestamp);
    }
}
