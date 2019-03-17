pragma solidity ^0.5.0;

contract Dice{

    uint256 public totalBets;
    uint256 public counter;
    address payable[] public players;
    uint public nonce;

	struct Bet{
		uint256  currentBet;
		bool  isBetSet; //default value is false
		uint8  destiny;
		uint256  amountBet;
	}

	mapping(address => Bet) public bets;

    event NewBetIsSet(address bidder , uint256 currentBet);

	function getNewbet(uint256 bet) payable public returns(uint256){

		bets[msg.sender].amountBet = bet;
		bets[msg.sender].currentBet = random();
		totalBets = totalBets + bet;
		players.push(msg.sender);
        emit NewBetIsSet(msg.sender,bets[msg.sender].currentBet);
		return (bets[msg.sender].currentBet);
	}


	function distributeWinnings() public {
	    msg.sender.transfer(totalBets);
        totalBets = 0;
    }

    function distributeTie() public {
        uint256 winnings = totalBets / 2;
        msg.sender.transfer(winnings);
        counter++;
        if (counter == 2) {
            totalBets = 0;
            counter = 0;
        }
    }


    function random() public returns (uint256) {
        uint256 randomnumber = uint(keccak256(abi.encodePacked(now, msg.sender, nonce))) % 7;
        if (randomnumber < 1){
            randomnumber = 1;
        }
        nonce++;
        return randomnumber;
    }
}
