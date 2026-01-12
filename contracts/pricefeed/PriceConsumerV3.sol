// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PriceConsumerV3 is Ownable {
    mapping(string => AggregatorV3Interface) internal priceFeedMap;

    constructor() Ownable(msg.sender){
    }

    function setPriceFeed(string memory tokenSymbol, address priceFeed) external onlyOwner {
        priceFeedMap[tokenSymbol] = AggregatorV3Interface(priceFeed);
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice(string memory tokenSymbol) public view returns (int) {
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeedMap[tokenSymbol].latestRoundData();
        return price;
    }
}