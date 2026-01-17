// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PriceConsumerV3 is Ownable {
    mapping(address => AggregatorV3Interface) internal priceFeedMap;

    constructor() Ownable(msg.sender){
    }

    function setPriceFeed(address tokenAddress, address priceFeed) external onlyOwner {
        require(priceFeed != address(0), "Invalid priceFeed address.");
        require(isContract(priceFeed), "Not a contract.");
        AggregatorV3Interface v3Interface = AggregatorV3Interface(priceFeed);
         (
            , 
            int price,
            ,
            ,
        ) = v3Interface.latestRoundData();
        require(price > 0, "Invalid priceFeed.");
        priceFeedMap[tokenAddress] = v3Interface;
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice(address tokenAddress) public view returns (int) {
        AggregatorV3Interface v3Interface = priceFeedMap[tokenAddress];
        require(address(v3Interface) != address(0), "Current token hasn't a priceFeed.");
        (
            , 
            int price,
            ,
            ,
        ) = v3Interface.latestRoundData();
        return price;
    }

    function isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
}