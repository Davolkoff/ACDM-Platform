//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.0;

import "../interfaces/Uniswap/IUniswapV2Router02.sol";
import "../interfaces/Contracts/IERC20.sol";

contract ACDMPlatform {
    address private DAOAddress;
    IUniswapV2Router02 private router; // used for buying XXX tokens
    IERC20 private XXXToken; // used for burning XXX tokens
    IERC20 private ACDMToken;

    struct Order {
        uint256 tokenPrice; // price for one token
        uint256 amount; // aamount of tokens in order
    }

    struct User {
        address referrer; // referrer of this user
        Order [] orders; // orders of this user
    }

    // universal variables (for both rounds)
    uint256 private lastRoundBeginningTime;
    bool private contractState; // 0 - Trade Round, 1 - Sale round
    uint256 private roundDuration; // duration of every round (doesn't change)

    // sale round variables
    uint256 private saleRoundAmount;
    uint256 private tokenPrice; // ETH/ACDM 

    // trade round variables
    uint256 private tradingVolume;

    // mappings
    mapping(address => User) private users;
    
    // comissions
    uint256 private ref1SaleComission; // sale comission for first level referrer
    uint256 private ref2SaleComission; // sale comission for second level referrer
    
    uint256 private ref1TradeComission; // trade comission for first level referrer
    uint256 private ref2TradeComission; // trade comission for first level referrer

    // events
    event NewRound(bool state, uint256 tokenPrice, uint256 amount);
    event NewOrder(address seller, uint256 orderId, uint256 price, uint256 amount);
    event OrderClosed(address seller, uint256 orderId);
    event OrderIdChanged(address seller, uint256 oldId, uint256 newId);

    modifier requireDAO {
        require(msg.sender == DAOAddress, "Not a DAO");
        _;
    }

    modifier requireSaleRound {
        require(contractState, "Available only on sale round");
        _;
    }

    modifier requireTradeRound {
        require(!contractState, "Available only on trade round");
        _;
    }

    // *values of comissions enter with one digit after dot without a dot (Example: 2.5 => 25)
    constructor
    (
        address routerAddress_, 
        address acdmAddress_,
        address DAOAddress_,
        address XXXTokenAddress_,
        
        uint256 startTokenPrice_,
        uint256 startTradingVolume_,
        uint256 roundDuration_,
        
        uint256 ref1SaleComission_,
        uint256 ref2SaleComission_,
        
        uint256 ref1TradeComission_,
        uint256 ref2TradeComission_
    )
    {
        DAOAddress = DAOAddress_;

        router = IUniswapV2Router02(routerAddress_);
        ACDMToken = IERC20(acdmAddress_);
        XXXToken = IERC20(XXXTokenAddress_);
        
        tokenPrice = startTokenPrice_;
        tradingVolume = startTradingVolume_;
        roundDuration = roundDuration_;

        ref1SaleComission = ref1SaleComission_;
        ref2SaleComission = ref2SaleComission_;

        ref1TradeComission = ref1TradeComission_;
        ref2TradeComission = ref2TradeComission_;
    }

    // adding new user
    function register(address referrer_) external {
        // I thought, that adding require "already registered", but I decided to give users the opportunity to change the referral 
        users[msg.sender].referrer = referrer_;
    }

    // starts sale round
    function startSaleRound() external requireTradeRound {
        require(block.timestamp - lastRoundBeginningTime > roundDuration, "Not time yet");

        saleRoundAmount = tradingVolume/tokenPrice;

        ACDMToken.mint(address(this), saleRoundAmount);

        lastRoundBeginningTime = block.timestamp;
        contractState = true;
        emit NewRound(contractState, tokenPrice, saleRoundAmount);
    }

    // buy ACDM tokens for ETH
    function buyACDM() external payable requireSaleRound {
        require(msg.value > tokenPrice, "Not enough ETH");

        uint256 amount = msg.value / tokenPrice;

        saleRoundAmount -= amount;
        ACDMToken.transfer(msg.sender, amount);
        
        // sending comissions to referrers
        address referrer1 = users[msg.sender].referrer;
        payable(msg.sender).transfer(msg.value - (amount * tokenPrice)); // unused eth

        if (referrer1 != address(0)) {
            payable(referrer1).transfer(msg.value * ref1SaleComission / 1000);
            address referrer2 = users[referrer1].referrer;

            if(referrer2 != address(0)) {
                payable(referrer2).transfer(msg.value * ref2SaleComission / 1000);
            }
        }
    }

    // starts trade round
    function startTradeRound() external requireSaleRound {
        if (saleRoundAmount != 0) {
            require(block.timestamp - lastRoundBeginningTime > roundDuration, "Not time yet");
        }

        tradingVolume = 0;

        ACDMToken.burn(address(this), saleRoundAmount);
        
        tokenPrice = tokenPrice * 103 / 100 + (4 * (10**6));

        lastRoundBeginningTime = block.timestamp;
        contractState = false;
        emit NewRound(contractState, 0, 0);
    }

    // adds new order (you should place price for all tokens in order to the "price_" variable)
    function addOrder(uint256 amount_, uint256 price_) external requireTradeRound {
        require(ACDMToken.balanceOf(msg.sender) >= amount_, "Not enough balance");
        require(amount_ > 0, "Incorrect amount");
        require(price_ > amount_, "Make your price higher");

        ACDMToken.transferFrom(msg.sender, address(this), amount_);

        uint256 tokenPrice_ = price_ / amount_;

        users[msg.sender].orders.push(Order(tokenPrice_, amount_));
        emit NewOrder(msg.sender, users[msg.sender].orders.length-1, tokenPrice_, amount_);
    }

    // removes your order (after using this function your last order will be placed on this order ID)
    function removeOrder(uint256 orderId_) external requireTradeRound {
        ACDMToken.transfer(msg.sender, users[msg.sender].orders[orderId_].amount);

        users[msg.sender].orders[orderId_] = users[msg.sender].orders[users[msg.sender].orders.length - 1];
        users[msg.sender].orders.pop();
        emit OrderClosed(msg.sender, orderId_);
    }

    // buys tokens from selected order
    function redeemOrder(address seller_, uint256 orderId_) external payable requireTradeRound {
        require(msg.value >= users[seller_].orders[orderId_].tokenPrice, "Not enough ETH");
        require(msg.value <= users[seller_].orders[orderId_].tokenPrice * users[seller_].orders[orderId_].amount, "Not enough tokens in order");
        
        uint256 amount = msg.value / users[seller_].orders[orderId_].tokenPrice;
        payable(msg.sender).transfer(msg.value - (amount * users[seller_].orders[orderId_].tokenPrice)); // unused eth

        users[seller_].orders[orderId_].amount -= amount;
        tradingVolume = msg.value;

        ACDMToken.transfer(msg.sender, amount);
        payable(seller_).transfer(msg.value * (1000 - ref1TradeComission - ref2TradeComission) / 1000);

        // sending comission to refferers
        address referrer1 = users[seller_].referrer;
        
        if (referrer1 != address(0)) {
            payable(referrer1).transfer(msg.value * ref1SaleComission / 1000);
            address referrer2 = users[referrer1].referrer;

            if(referrer2 != address(0)) {
                payable(referrer2).transfer(msg.value * ref2SaleComission / 1000);
            }
        }  

        // clearing an array of unnecessary elements
        if(users[seller_].orders[orderId_].amount == 0) {
            users[seller_].orders[orderId_] = users[seller_].orders[users[seller_].orders.length - 1];
            users[seller_].orders.pop();
            emit OrderClosed(seller_, orderId_);
            emit OrderIdChanged(seller_, users[seller_].orders.length, orderId_);
        }
    }

    // buys XXX Tokens on uniswap and burns them (only by DAO)
    function buyXXXTokens() external requireDAO {
        address wethAddress = router.WETH();
        address [] memory tokens = new address[](2);

        tokens[0] = wethAddress;
        tokens[1] = address(XXXToken);
        
        router.swapExactETHForTokens {value: address(this).balance} (0, tokens, address(this), block.timestamp + 31536000);
        XXXToken.burn(address(this), XXXToken.balanceOf(address(this)));
    }

    // withdraws comission ETH on selected account (only by DAO)
    function withdrawETH(address recipient_) external requireDAO {
        payable(recipient_).transfer(address(this).balance);
    }

    // sets comissions (only by DAO) 
    function setComissions (uint256 ref1SaleComission_, uint256 ref2SaleComission_, uint256 ref1TradeComission_, uint256 ref2TradeComission_) external requireDAO {
        ref1SaleComission = ref1SaleComission_;
        ref2SaleComission = ref2SaleComission_;
    
        ref1TradeComission = ref1TradeComission_; 
        ref2TradeComission = ref2TradeComission_;
    }

    // returns info about current round
    function currentState() external view returns (bool, uint256) {
        return (contractState, lastRoundBeginningTime); 
    }

    // returns info about selected order of selected user
    function orderInfo(address user_, uint256 orderId_) external view returns (uint256, uint256) {
        return (users[user_].orders[orderId_].tokenPrice, users[user_].orders[orderId_].amount);
    }

    // returns main variables of sale round
    function saleRoundInfo() external view returns (uint256, uint256) {
        return (saleRoundAmount, tokenPrice);
    }

    // returns comissions
    function comissions() external view returns (uint256, uint256, uint256, uint256) {
        return (ref1SaleComission, ref2SaleComission, ref1TradeComission, ref2TradeComission);
    }
}