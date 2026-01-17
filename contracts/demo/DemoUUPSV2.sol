// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract DemoUUPSV2 is Initializable, OwnableUpgradeable, UUPSUpgradeable{
    uint256 public value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        value = 0;
    }

    function setValue(uint256 newValue) external onlyOwner {
        value = newValue + 10;
    }

    function getValue() external view returns (uint256) {
        return value;
    }

    // 核心：必须实现，并添加权限控制
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

}