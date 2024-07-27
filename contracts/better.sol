// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "hardhat/console.sol";

contract Owner {
    address private owner;
    struct bet {
        uint256 amount;
        uint256 averageRatio;
    }

    mapping(address => bet) a_bets;
    mapping(address => bet) b_bets;
    address[] public a_bettors;
    address[] public b_bettors;

    uint256 public currentARatio = 5; //5 => 0.5, cannot be bigger than 10
    uint256 public currentBRatio = 5; //5 => 0.5, cannot be bigger than 10

    uint256 public currentTotalAAmount = 0;
    uint256 public currentTotalBAmount = 0;

    // modifier to check if caller is owner
    modifier isOwner() {
        // If the first argument of 'require' evaluates to 'false', execution terminates and all
        // changes to the state and to Ether balances are reverted.
        // This used to consume all gas in old EVM versions, but not anymore.
        // It is often a good idea to use 'require' to check if functions are called correctly.
        // As a second argument, you can also provide an explanation about what went wrong.
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    /**
     * @dev Set contract deployer as owner
     */
    constructor() {
        console.log("Owner contract deployed by:", msg.sender);
        owner = msg.sender; // 'msg.sender' is sender of current call, contract deployer for a constructor
    }

    function betA() external payable {
        require(msg.value > 0, "You must send some Ether");
        uint256 amount = msg.value * 10;
        bet memory currentBet = a_bets[msg.sender];
        // Check if the bet exists by checking if the amount is non-zero
        if (currentBet.amount == 0) {
            // Bet does not exist, handle accordingly
            // Initialize the bet for the first time
            a_bettors.push(msg.sender);
            currentBet.amount = amount;
            currentBet.averageRatio = currentARatio; // Or some other logic
        } else {
            // Bet exists, update accordingly
            currentBet.averageRatio =
                (currentBet.averageRatio *
                    currentBet.amount +
                    currentARatio *
                    amount) /
                (currentBet.amount + amount); // Example logic
            currentBet.amount += amount;
        }
        currentTotalAAmount += amount;
        currentARatio =
            currentTotalAAmount /
            (currentTotalAAmount + currentTotalBAmount);
    }

    function betB() external payable {
        require(msg.value > 0, "You must send some Ether");
        uint256 amount = msg.value * 10;
        bet memory currentBet = b_bets[msg.sender];
        // Check if the bet exists by checking if the amount is non-zero
        if (currentBet.amount == 0) {
            // Bet does not exist, handle accordingly
            // Initialize the bet for the first time
            b_bettors.push(msg.sender);
            currentBet.amount = amount;
            currentBet.averageRatio = currentBRatio; // Or some other logic
        } else {
            // Bet exists, update accordingly
            currentBet.averageRatio =
                (currentBet.averageRatio *
                    currentBet.amount +
                    currentBRatio *
                    amount) /
                (currentBet.amount + amount); // Example logic
            currentBet.amount += amount;
        }
        currentTotalBAmount += amount;
        currentBRatio =
            currentTotalBAmount /
            (currentTotalAAmount + currentTotalBAmount);
    }

    function settleForA() external isOwner {
        require(
            currentTotalAAmount + currentTotalBAmount > 0,
            "No funds to distribute"
        );
        uint256 totalAmount = (currentTotalAAmount + currentTotalBAmount);
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < a_bettors.length; i++) {
            address bettor = a_bettors[i];
            bet memory b = a_bets[bettor];
            totalWeight += (b.amount * 1) / b.averageRatio;
        }
        for (uint256 i = 0; i < a_bettors.length; i++) {
            address bettor = a_bettors[i];
            bet memory b = a_bets[bettor];
            uint256 betterWeight = (b.amount * 1) / b.averageRatio;
            payable(bettor).transfer(
                totalAmount * (betterWeight / totalWeight)
            );
        }
    }

    function settleForB() external isOwner {
        require(
            currentTotalAAmount + currentTotalBAmount > 0,
            "No funds to distribute"
        );
        uint256 totalAmount = (currentTotalAAmount + currentTotalBAmount);
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < b_bettors.length; i++) {
            address bettor = b_bettors[i];
            bet memory b = b_bets[bettor];
            totalWeight += (b.amount * 1) / b.averageRatio;
        }
        for (uint256 i = 0; i < b_bettors.length; i++) {
            address bettor = b_bettors[i];
            bet memory b = b_bets[bettor];
            uint256 betterWeight = (b.amount * 1) / b.averageRatio;
            payable(bettor).transfer(
                totalAmount * (betterWeight / totalWeight)
            );
        }
    }
}
