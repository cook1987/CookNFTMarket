// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract MockCookTokenV3Aggregator is AggregatorV3Interface{

    uint8 public decimalsVar; 
    int256 public latestAnswer; 
    uint256 public latestTimestamp; 
    uint256 public latestRound; 
    mapping(uint256 => int256) public getAnswer; 
    mapping(uint256 => uint256) public getTimestamp; 
    mapping(uint256 => uint256) private getStartedAt; 
    string private descriptionVar;

    constructor(uint8 _decimals, string memory _description, int256 _initialAnswer) {
        decimalsVar = _decimals;
        descriptionVar = _description;
        updateAnswer(_initialAnswer);
    }

    function updateAnswer(int256 _answer) public {
        latestAnswer = _answer;
        latestTimestamp = block.timestamp;
        latestRound++;
        getAnswer[latestRound] = _answer;
        getTimestamp[latestRound] = block.timestamp;
        getStartedAt[latestRound] = block.timestamp;
    }

    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            _roundId,
            getAnswer[_roundId],
            getStartedAt[_roundId],
            getTimestamp[_roundId],
            _roundId
        );
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            uint80(latestRound),
            latestAnswer,
            getStartedAt[latestRound],
            latestTimestamp,
            uint80(latestRound)
        );
    }

    function decimals() external view override returns (uint8) {
        return decimalsVar;
    }

    function description() external view override returns (string memory) {
        return descriptionVar;
    }

    function version() external pure override returns (uint256) {
        return 4;
    }


}