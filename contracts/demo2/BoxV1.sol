// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BoxV1 is Initializable, OwnableUpgradeable {
    uint256 _value;

    function initialize(address owner_) public initializer {
        __Ownable_init(owner_);
    }

    function setValue(uint256 newValue) external onlyOwner {
        _value = newValue;
    }

    function getValue() external view returns (uint256) {
        return _value;
    }
}