// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./pricefeed/PriceConsumerV3.sol";

/**
 * @title IERC2981
 * @dev ERC2981版税标准接口
 */
interface IERC2981 is IERC165 {
    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view returns (
        address receiver,
        uint256 royaltyAmount
    );
}

/**
 * @title CookNFTMarketplaceTransparentV1
 * @dev 完整的NFT交易市场合约，支持上架、购买、版税和拍卖功能
 * @notice 使用ReentrancyGuard防止重入攻击
 */
contract CookNFTMarketplaceTransparentV1 is ReentrancyGuard,Initializable, UUPSUpgradeable, OwnableUpgradeable {
    using Math for uint256;

    PriceConsumerV3 public priceConsumer;
    
    /**
     * @dev 拍卖结构体
     */
    struct Auction {
        address seller;           // 卖家地址
        address nftContract;      // NFT合约地址
        uint256 tokenId;          // Token ID
        uint256 startPrice;       // 起拍价（美元）
        uint256 highestBid;       // 当前最高出价（美元）
        address highestBidder;    // 当前最高出价者
        address token;            // 当前最高出价者代币地址
        uint256 tokenAmount;      // 当前最高出价者代币数量
        uint256 endTime;          // 拍卖结束时间
        bool active;              // 是否激活
    }
    
    // 拍卖映射
    mapping(uint256 => Auction) public auctions;
    uint256 public auctionCounter;
    
    // 待退款映射 ETH（用于拍卖）
    mapping(uint256 => mapping(address => uint256)) public pendingReturns;
    // 待退款映射 ERC20代币（用于拍卖）
    mapping(uint256 => mapping(address => mapping(address => uint256))) public pendingTokenReturns;
    
    // 平台手续费（基点，10000 = 100%）
    uint256 public platformFee = 250; // 2.5%
    
    // 手续费接收地址
    address public feeRecipient;
    
    /**
     * @dev 拍卖创建事件
     */
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endTime
    );
    
    /**
     * @dev 出价事件
     * erc20Token 代币地址，为0 时 表示ETH
     */
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        address erc20Token,
        uint256 amount
    );
    
    /**
     * @dev 拍卖结束事件
     */
    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        address erc20Token,
        uint256 finalPrice
    );
    

    constructor() {
        _disableInitializers();
    }

    /**
     * @dev 初始化函数，代替构造函数
     * @param _feeRecipient 手续费接收地址
     * @param _priceConsumer 手续费接收地址
     */
    function initialize(address _feeRecipient, address _priceConsumer) public initializer {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_priceConsumer != address(0), "Invalid priceConsumer");
        feeRecipient = _feeRecipient;
        priceConsumer = PriceConsumerV3(_priceConsumer);
    }

        // 必须实现的升级权限控制
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
    
    
    function getTokenPrice(ERC20 token, uint256 amount)internal view returns(uint256) {
         // 使用代币
        require(token.allowance(msg.sender, address(this)) >= amount, "Insufficient token");
        uint price = uint(priceConsumer.getLatestPrice(address(token)));
        // 检查数据是否存在且有效
        require(price > 0, "Chainlink: price <= 0");
        return price;
    }
    /**
     * @dev 创建拍卖
     * @param nftContract NFT合约地址
     * @param tokenId Token ID
     * @param startPrice 起拍价（wei 美元）
     * @param durationHours 拍卖时长（小时）
     * @return auctionId 拍卖ID
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 durationHours
    ) external returns (uint256) {
        require(startPrice > 0, "Start price must be greater than 0");
        require(durationHours >= 1, "Duration must be at least 1 hour");
        require(nftContract != address(0), "Invalid NFT contract");
        
        IERC721 nft = IERC721(nftContract);
        
        // 验证所有权
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        
        // 验证授权
        require(
            nft.getApproved(tokenId) == address(this) ||
            nft.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );
        
        // 创建拍卖
        auctionCounter++;
        auctions[auctionCounter] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startPrice: startPrice,
            highestBid: 0,
            highestBidder: address(0),
            token: address(0),
            tokenAmount: 0,
            endTime: block.timestamp + (durationHours * 1 hours),
            active: true
        });
        
        emit AuctionCreated(
            auctionCounter,
            msg.sender,
            nftContract,
            tokenId,
            startPrice,
            auctions[auctionCounter].endTime
        );
        
        return auctionCounter;
    }
    
    /**
     * @dev 出价
     * @param auctionId 拍卖ID
     * @param erc20Token 如果使用代币购买，需要输入代币合约的地址
     * @param amount 如果使用代币购买，需要输入代币数量
     * @notice 需要支付足够的ETH，出价必须高于当前最高出价的5%
     */
    function placeBid(uint256 auctionId, address erc20Token, uint256 amount) external payable {
        Auction storage auction = auctions[auctionId];
        
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != auction.seller, "Seller cannot bid");
        
        // 计算最低出价
        uint256 minBid;
        if (auction.highestBid == 0) {
            minBid = auction.startPrice;
        } else {
            minBid = auction.highestBid + (auction.highestBid * 5 / 100); // 5% increment
        }
        uint bidPrice = 0;
        if(erc20Token != address(0) && amount > 0){
            // 使用代币
            ERC20 token = ERC20(erc20Token);
            uint price = getTokenPrice(token, amount);
            // 检查数据是否存在且有效
            bidPrice = price * amount;
        }else{
            // 使用 ETH
            uint price = uint(priceConsumer.getLatestPrice(address(0)));
             // 检查数据是否存在且有效
            require(price > 0, "Chainlink: price <= 0");
            bidPrice = price * msg.value;
        }

        require(bidPrice >= minBid, "Bid too low");
        
        // 如果有之前的出价者，记录他们的待退款金额
        if (auction.highestBidder != address(0)) {
            if(auction.token != address(0)){
                pendingTokenReturns[auctionId][auction.highestBidder][auction.token] += auction.tokenAmount;
            }else{
                pendingReturns[auctionId][auction.highestBidder] += auction.tokenAmount;
            }
        }
        
        // 更新最高出价
        auction.highestBid = bidPrice;
        auction.highestBidder = msg.sender;
        if(erc20Token != address(0) && amount > 0){
            auction.token = erc20Token;
            auction.tokenAmount = amount;
            ERC20 token = ERC20(erc20Token);
            token.transferFrom(msg.sender, address(this), amount);
        }else{
            auction.token = address(0);
            auction.tokenAmount = msg.value;
        }
        emit BidPlaced(auctionId, msg.sender, erc20Token, bidPrice);
    }
    
    /**
     * @dev 提取出价退款
     * @param auctionId 拍卖ID
     * @param erc20Token 如果使用代币购买，需要输入代币合约的地址
     * @notice 被超越的出价者可以提取他们的资金
     */
    function withdrawBid(uint256 auctionId, address erc20Token) external {
        if(erc20Token == address(0)){
            uint256 amount = pendingReturns[auctionId][msg.sender];
            require(amount > 0, "No pending return");
            
            pendingReturns[auctionId][msg.sender] = 0;
            
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "Transfer failed");
        }else{
            uint256 amount = pendingTokenReturns[auctionId][msg.sender][erc20Token];
            require(amount > 0, "No pending return");
            
            pendingTokenReturns[auctionId][msg.sender][erc20Token] = 0;
            ERC20 token = ERC20(erc20Token);
            bool success = token.transfer(msg.sender, amount);
            require(success, "Transfer failed");
        }
    }
    
    /**
     * @dev 结束拍卖
     * @param auctionId 拍卖ID
     * @notice 任何人都可以在拍卖结束后调用此函数进行结算
     */
    function endAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        
        auction.active = false;
        
        if (auction.highestBidder != address(0)) {
            // 有人出价，进行结算
            if(auction.token != address(0)){
                // 使用代币
                ERC20 token = ERC20(auction.token);
                uint256 price = uint256(priceConsumer.getLatestPrice(auction.token));

                  // 计算手续费
                uint256 fee = ((auction.highestBid * platformFee) / 10000).ceilDiv(price);
                
                // 获取版税信息
                (address royaltyReceiver, uint256 royaltyAmount) = _getRoyaltyInfo(
                    auction.nftContract,
                    auction.tokenId,
                    auction.highestBid
                );
                royaltyAmount = royaltyAmount.ceilDiv(price);
                // 计算卖家收益
                uint256 sellerAmount = auction.tokenAmount - fee - royaltyAmount;
                
                // 转移NFT
                IERC721(auction.nftContract).safeTransferFrom(
                    auction.seller,
                    auction.highestBidder,
                    auction.tokenId
                );
                
                // 资金分配：版税 -> 平台手续费 -> 卖家收益
                if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
                    token.transfer(royaltyReceiver, royaltyAmount);
                }
                token.transfer(auction.seller, sellerAmount);
                token.transfer(feeRecipient, fee);
            }else{
                  // 使用 ETH
                uint price = uint(priceConsumer.getLatestPrice(address(0)));
                uint256 fee = ((auction.highestBid * platformFee) / 10000).ceilDiv(price);
                
                (address royaltyReceiver, uint256 royaltyAmount) = _getRoyaltyInfo(
                    auction.nftContract,
                    auction.tokenId,
                    auction.highestBid
                );
                royaltyAmount = royaltyAmount.ceilDiv(price);
                uint256 sellerAmount = auction.tokenAmount - fee - royaltyAmount;
                
                // 转移NFT
                IERC721(auction.nftContract).safeTransferFrom(
                    auction.seller,
                    auction.highestBidder,
                    auction.tokenId
                );
                
                // 资金分配
                if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
                    (bool successRoyalty, ) = royaltyReceiver.call{value: royaltyAmount}("");
                    require(successRoyalty, "Royalty transfer failed");
                }
                
                (bool successSeller, ) = auction.seller.call{value: sellerAmount}("");
                require(successSeller, "Transfer to seller failed");
                
                (bool successFee, ) = feeRecipient.call{value: fee}("");
                require(successFee, "Transfer fee failed");
            }
            
            emit AuctionEnded(
                auctionId,
                auction.highestBidder,
                auction.token,
                auction.highestBid
            );
        } else {
            // 没有人出价，拍卖流拍
            emit AuctionEnded(auctionId, address(0), address(0), 0);
        }
    }
    
    /**
     * @dev 获取版税信息
     * @param nftContract NFT合约地址
     * @param tokenId Token ID
     * @param salePrice 售价
     * @return receiver 版税接收地址
     * @return royaltyAmount 版税金额
     * @notice 内部函数，检查NFT合约是否支持ERC2981标准
     */
    function _getRoyaltyInfo(
        address nftContract,
        uint256 tokenId,
        uint256 salePrice
    ) internal view returns (address receiver, uint256 royaltyAmount) {
        // 检查NFT合约是否支持ERC2981
        if (IERC165(nftContract).supportsInterface(type(IERC2981).interfaceId)) {
            (receiver, royaltyAmount) = IERC2981(nftContract).royaltyInfo(
                tokenId,
                salePrice
            );
        } else {
            // 不支持版税，返回零地址和零金额
            receiver = address(0);
            royaltyAmount = 0;
        }
    }
    
    /**
     * @dev 查询拍卖信息
     * @param auctionId 拍卖ID
     * @return seller 卖家地址
     * @return nftContract NFT合约地址
     * @return tokenId Token ID
     * @return startPrice 起拍价
     * @return highestBid 当前最高出价
     * @return highestBidder 当前最高出价者
     * @return endTime 结束时间
     * @return active 是否激活
     */
    function getAuction(uint256 auctionId) external view returns (
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 highestBid,
        address highestBidder,
        uint256 endTime,
        bool active
    ) {
        Auction memory auction = auctions[auctionId];
        return (
            auction.seller,
            auction.nftContract,
            auction.tokenId,
            auction.startPrice,
            auction.highestBid,
            auction.highestBidder,
            auction.endTime,
            auction.active
        );
    }
    
    /**
     * @dev 设置平台手续费
     * @param newFee 新的手续费（基点）
     * @notice 只有手续费接收地址可以调用
     */
    function setPlatformFee(uint256 newFee) external {
        require(msg.sender == feeRecipient, "Not fee recipient");
        require(newFee <= 1000, "Fee too high"); // 最大10%
        platformFee = newFee;
    }
    
    /**
     * @dev 更新手续费接收地址
     * @param newRecipient 新的接收地址
     * @notice 只有当前手续费接收地址可以调用
     */
    function updateFeeRecipient(address newRecipient) external {
        require(msg.sender == feeRecipient, "Not fee recipient");
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }

        /**
     * @dev 更新手续费接收地址
     * @param _priceConsumer 新的接收地址
     * @notice 只有当前手续费接收地址可以调用
     */
    function updatePriceConsumer(address _priceConsumer) external {
        require(msg.sender == feeRecipient, "Not fee recipient");
        require(_priceConsumer != address(0), "Invalid address");
        priceConsumer = PriceConsumerV3(_priceConsumer);
    }
}