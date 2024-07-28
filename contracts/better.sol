// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "hardhat/console.sol";

contract Owner {
    uint8 FLOAT_BUFFER = 100;
    address private owner;

    struct Bet {
        uint256 amount;
        uint256 averageRatio;
    }

    struct UserBetResponse {
        uint256 amount;
        uint256 averageRatio;
        uint256 betId;
    }

    struct BetData {
        uint256 currentARatio;
        uint256 currentBRatio;
        uint256 currentTotalAAmount;
        uint256 currentTotalBAmount;
        mapping(address => Bet) aBets;
        mapping(address => Bet) bBets;
        address[] aBettors;
        address[] bBettors;
        bool closed;
        bool aWon;
        string imageHash;
        string title;
        string description;
        string optionATitle;
        string optionBTitle;
    }

    mapping(uint256 => BetData) public bets;
    uint256 public betCount = 0;

    modifier isOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    constructor() {
        console.log("Owner contract deployed by:", msg.sender);
        owner = msg.sender;
    }

    function addBet(
        string calldata _title,
        string calldata _optionATitle,
        string calldata _optionBTitle,
        string calldata imageHash,
        string calldata description
    ) external {
        betCount++;
        BetData storage newBet = bets[betCount];
        newBet.currentARatio = 5;
        newBet.currentBRatio = 5;
        newBet.closed = false;
        newBet.title = _title;
        newBet.description = description;
        newBet.imageHash = imageHash;
        newBet.optionATitle = _optionATitle;
        newBet.optionBTitle = _optionBTitle;
    }

    function bet(uint256 betId, bool onA) external payable {
        require(msg.value > 0, "You must send some Ether");
        require(betId > 0 && betId <= betCount, "Invalid bet ID");
        require(!bets[betId].closed, "Bet is closed");

        BetData storage betData = bets[betId];
        uint256 amount = msg.value * FLOAT_BUFFER;

        if (onA) {
            _betHelper(
                betData.aBets,
                betData.aBettors,
                amount,
                betData.currentARatio
            );
            betData.currentTotalAAmount += amount;
        } else {
            _betHelper(
                betData.bBets,
                betData.bBettors,
                amount,
                betData.currentBRatio
            );
            betData.currentTotalBAmount += amount;
        }
        betData.currentARatio = ((FLOAT_BUFFER * betData.currentTotalAAmount) /
            (betData.currentTotalAAmount + betData.currentTotalBAmount));
        betData.currentBRatio = ((FLOAT_BUFFER * betData.currentTotalBAmount) /
            (betData.currentTotalAAmount + betData.currentTotalBAmount));
    }

    function _betHelper(
        mapping(address => Bet) storage selectedSideBets,
        address[] storage bettors,
        uint256 amount,
        uint256 currentRatio
    ) private {
        Bet storage currentBet = selectedSideBets[msg.sender];
        if (currentBet.amount == 0) {
            bettors.push(msg.sender);
            currentBet.amount = amount;
            currentBet.averageRatio = currentRatio;
        } else {
            currentBet.averageRatio =
                (currentBet.averageRatio *
                    currentBet.amount +
                    currentRatio *
                    amount) /
                (currentBet.amount + amount);
            currentBet.amount += amount;
        }
    }

    function getUserBets(bool sideA)
        external
        view
        returns (UserBetResponse[] memory)
    {
        uint256 count = 0;

        for (uint256 i = 1; i <= betCount; i++) {
            // Changed betCount + 1 to betCount
            BetData storage betData = bets[i];
            Bet storage userBet;

            if (sideA) {
                userBet = betData.aBets[msg.sender];
            } else {
                userBet = betData.bBets[msg.sender];
            }

            if (userBet.amount > 0) {
                count++;
            }
        }
        console.log("Found %d bets for adress 0x%s", count, msg.sender);
        UserBetResponse[] memory retval = new UserBetResponse[](count);
        uint256 indx = 0;
        for (uint256 i = 1; i <= betCount; i++) {
            // Changed betCount + 1 to betCount
            BetData storage betData = bets[i];
            Bet storage userBet;

            if (sideA) {
                userBet = betData.aBets[msg.sender];
            } else {
                userBet = betData.bBets[msg.sender];
            }
            if (userBet.amount > 0) {
                retval[indx] = UserBetResponse({
                    amount: userBet.amount,
                    averageRatio: userBet.averageRatio,
                    betId: i
                });
                indx++;
            }
        }
        return retval;
    }

    function getBetsA(address adress, uint256 betId)
        external
        view
        returns (Bet memory)
    {
        BetData storage betData = bets[betId];
        return betData.aBets[adress];
    }

    function getBetsB(address adress, uint256 betId)
        external
        view
        returns (Bet memory)
    {
        BetData storage betData = bets[betId];
        return betData.bBets[adress];
    }

    function settle(uint256 betId, bool aWon) external {
        require(betId > 0 && betId <= betCount, "Invalid bet ID");
        require(!bets[betId].closed, "Bet is already settled");

        BetData storage betData = bets[betId];
        uint256 totalAmount = betData.currentTotalAAmount +
            betData.currentTotalBAmount;
        require(totalAmount > 0, "No funds to distribute");

        if (aWon) {
            _settleHelper(betData.aBettors, betData.aBets, totalAmount);
        } else {
            _settleHelper(betData.bBettors, betData.bBets, totalAmount);
        }

        betData.closed = true;
        betData.aWon = aWon;
    }

    function _settleHelper(
        address[] storage bettors,
        mapping(address => Bet) storage selectedSideBets,
        uint256 totalAmount
    ) private {
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < bettors.length; i++) {
            address bettor = bettors[i];
            Bet memory b = selectedSideBets[bettor];
            totalWeight += (b.amount * 1) / b.averageRatio;
        }
        for (uint256 i = 0; i < bettors.length; i++) {
            address bettor = bettors[i];
            Bet memory b = selectedSideBets[bettor];
            uint256 bettorWeight = (b.amount * 1) / b.averageRatio;
            payable(bettor).transfer(
                (totalAmount * bettorWeight) / totalWeight / FLOAT_BUFFER
            );
        }
    }
}
