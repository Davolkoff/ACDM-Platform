//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../interfaces/Contracts/IERC20.sol";
import "../interfaces/Contracts/IDAO.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MyStaking {
    address public owner; // owner of contract

    uint public freezeTime; // the time after which the user can withdraw lp tokens
    uint public rewardsPercent; // percent of rewards, depending on the number of lp tokens
    uint public rewardsFrequency; // how often are rewards generated

    IERC20 public lpToken; // lp token
    IERC20 public rewardsToken; // rewards token
    IDAO public DAOVoting; // DAO Voting

    bytes32 public whitelistMerkleRoot; // root of merkle tree of white list

    struct User {
        uint lpBalance; // needs to count rewards
        uint availableBalance; // balance, available to withdraw
        uint lastStakeTimestamp; // timestamp, when user staked tokens last time
        uint reservedReward; // reward, creating by staking with old LP balance

        uint rewardsBalance; // balance of rewards tokens of user
        uint lastRewardsTime; // needs to recount rewardsBalance if lpBalance changes
    }

    mapping (address => User) public users; // information about users

    event StakeEv(
        address user,
        uint amount
    );

    event ClaimEv(
        address user,
        uint amount
    );

    event UnstakeEv(
        address user,
        uint amount,
        uint remains
    );

    constructor (uint _freezeTime, uint _rewardsPercent, uint _rewardsFrequency, bytes32 whitelistMerkleRoot_, address _lpToken, address _rewardsToken) {
        lpToken = IERC20(_lpToken);
        rewardsToken = IERC20(_rewardsToken);
        freezeTime = _freezeTime;
        rewardsPercent = _rewardsPercent;
        rewardsFrequency = _rewardsFrequency;
        whitelistMerkleRoot = whitelistMerkleRoot_;
        owner = msg.sender;
    }

    modifier requireDAO {
        require(msg.sender == address(DAOVoting), "Not a DAO");
        _;
    }

    modifier requireOwner {
        require(msg.sender == owner, "Not an owner");
        _;
    }

    modifier countBalances() {
        // adding reserved tokens to available balance
        if (block.timestamp - users[msg.sender].lastStakeTimestamp > freezeTime) {
            users[msg.sender].availableBalance = users[msg.sender].lpBalance;
        }
        // counting rewards tokens
        if (users[msg.sender].lastRewardsTime != 0) {
            uint rewardsPerCycle = users[msg.sender].lpBalance * rewardsPercent / 100;
            uint numberOfCycles = ((block.timestamp - users[msg.sender].lastRewardsTime) / rewardsFrequency);
            
            if (users[msg.sender].reservedReward != 0 && numberOfCycles > 0) {
                numberOfCycles -= 1;
                users[msg.sender].rewardsBalance += (rewardsPerCycle * numberOfCycles);
                users[msg.sender].rewardsBalance += users[msg.sender].reservedReward;
                users[msg.sender].reservedReward = 0;
            }
            else {
                users[msg.sender].rewardsBalance += (rewardsPerCycle * numberOfCycles);
            }
            
        }
        
        users[msg.sender].lastRewardsTime = block.timestamp;
        _;
    }

    // sends tokens to contract for staking
    function stake (uint _amount, bytes32[] calldata hexProof_) external countBalances {
        require(_amount > 0, "You can't send 0 tokens");
        require(verifyWhitelisted(hexProof_), "You are not in whitelist");

        // counting rewards for old LP balance
        uint rewardsPerCycle = users[msg.sender].lpBalance * rewardsPercent / 100;
        users[msg.sender].reservedReward += rewardsPerCycle;

        // before it user should approve tokens to contract
        lpToken.transferFrom(msg.sender, address(this), _amount);
        users[msg.sender].lpBalance += _amount;
        users[msg.sender].lastStakeTimestamp = block.timestamp;
        
        emit StakeEv(msg.sender, _amount);
    }

    // checks if the user is in the whitelist
    function verifyWhitelisted (bytes32[] calldata hexProof_) internal view returns(bool) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        return MerkleProof.verify(hexProof_, whitelistMerkleRoot, leaf);
    }
   
    // sends reward tokens to user
    function claim () external countBalances {
        require(users[msg.sender].rewardsBalance > 0, "You haven't got reward tokens");
        rewardsToken.transfer(msg.sender, users[msg.sender].rewardsBalance);

        emit ClaimEv(msg.sender, users[msg.sender].rewardsBalance);
        users[msg.sender].rewardsBalance = 0;
    }

    // withdraw lp tokens
    function unstake () external countBalances {
        require(users[msg.sender].lpBalance > 0, "Nothing to unstake");
        require(users[msg.sender].availableBalance > 0, "You can't unstake lp tokens right now");
        require(!DAOVoting.activeVotingsExists(msg.sender), "You have got active votings");

        lpToken.transfer(msg.sender, users[msg.sender].availableBalance);
        users[msg.sender].lpBalance -= users[msg.sender].availableBalance;

        emit UnstakeEv(
            msg.sender,
            users[msg.sender].availableBalance,
            users[msg.sender].lpBalance
        );

        users[msg.sender].availableBalance = 0;
        DAOVoting.endWithdrawing(msg.sender);
    }

    // changes root of merkle tree in staking contract
    function changeWhitelistMerkleRoot (bytes32 whitelistMerkleRoot_) external requireDAO {
        whitelistMerkleRoot = whitelistMerkleRoot_;
    }

    // changes freeze time (only by DAO)
    function changeFreezeTime (uint freezeTime_) external requireDAO {
        freezeTime = freezeTime_;
    }

    // info about this staking contract
    function stakingInfo () external view returns (uint, uint, uint) {
        return (freezeTime, rewardsPercent, rewardsFrequency);
    }

    // info about user
    function balanceOf (address user_) external view returns (uint) {
        return (users[user_].lpBalance);
    }

    // set DAO's address to contract
    function connectDAO (address DAO_) external requireOwner {
        require(address(DAOVoting) == address(0), "DAO already connected");
        DAOVoting = IDAO(DAO_);
    }
}