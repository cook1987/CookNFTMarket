import { expect } from "chai";
import { ZeroAddress } from "ethers";
import {network } from "hardhat";
// 连接网络
const {ethers, networkHelpers} = await network.connect();

const uri = "https://baike.baidu.com/tashuo/browse/content?id=7d03a8b895a000beecd7a8d3";

// 定义 Fixture 函数
async function deployCounterFixture() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const priceConsumer = await ethers.deployContract("PriceConsumerV3");
  const priceConsumerAddress = await priceConsumer.getAddress();
  const nftToken = await ethers.deployContract("CookNFT");
  const nftMarket = await ethers.deployContract("CookNFTMarketplace", [owner.address, priceConsumerAddress]);
  
  return {nftMarket, priceConsumer, nftToken, owner, addr1, addr2};
}

// 测试套件
describe("CookNFTMarketplace", function(){
  // 子套件：部署测试
  describe("Deployment", function(){
    // 测试用例：合约地址验证
    it("Should have valid address", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);
      const address = await nftMarket.getAddress();

      console.log("address:", address);
      expect(address).to.be.a("string");
      expect(address).to.have.length(42);
      expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  // 子套件：设置功能测试
  describe("listNFT", function(){
    // 测试用例：基本设置
    it("listNFT success", async function () {
      const {nftMarket,nftToken, owner} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      const tx = await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      expect(await nftMarket.listNFT(nftToken, 1n, 1n)).
      to.emit(nftMarket, "NFTListed").
      withArgs(1n, owner,nftToken,1n,1n );
    });

    // 测试用例：错误处理
    it("Should revert when price is zero", async function () {
      const {nftMarket,nftToken} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.listNFT(nftToken, 1n, 0n))
      .to.be.revertedWith("Price must be greater than 0");
    });

    it("Should revert when nftContract address is zeroaddress", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.listNFT(ZeroAddress, 1n, 1n))
      .to.be.revertedWith("Invalid NFT contract");
    });

    it("Should revert when nfttoken owner is not msg.sender", async function () {
       const {nftMarket,nftToken, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      const tx = await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await expect(nftMarket.connect(addr1).listNFT(nftToken, 1n, 1n))
      .to.be.revertedWith("Not the owner");
    });

    it("Should revert when nfttokenId not exists", async function () {
      const {nftMarket,nftToken, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.listNFT(nftToken, 99n, 1n))
      .to.be.revertedWithCustomError(nftToken, "ERC721NonexistentToken");
    });

    it("Should revert when nfttoken not approve to nftMarket", async function () {
      const {nftMarket,nftToken, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      const tx = await nftToken.mint(uri, { value: requiredPayment});

      await expect(nftMarket.listNFT(nftToken, 1n, 1n))
      .to.be.revertedWith("Marketplace not approved");
    });
  });

    // 子套件：设置功能测试
  describe("delistNFT", function(){
    // 测试用例：基本设置
    it("delistNFT success", async function () {
      const {nftMarket,nftToken, owner} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);
      await nftMarket.listNFT(nftToken, 1n, 1n);

      expect(await nftMarket.delistNFT(1n)).
      to.emit(nftMarket, "NFTDelisted").
      withArgs(1n);
    });

    // 测试用例：错误处理
    it("Should revert when listNFT not exists", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.delistNFT(1n))
      .to.be.revertedWith("Listing not active");
    });

    it("Should revert when listNFT owner is not msg.sender", async function () {
      const {nftMarket,nftToken, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);
      await nftMarket.listNFT(nftToken, 1n, 1n);

      await expect(nftMarket.connect(addr1).delistNFT(1n))
      .to.be.revertedWith("Not the seller");
    });
  });

    // 子套件：设置功能测试
  describe("updatePrice", function(){
    // 测试用例：基本设置
    it("updatePrice success", async function () {
      const {nftMarket,nftToken, owner} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);
      await nftMarket.listNFT(nftToken, 1n, 1n);

      expect(await nftMarket.updatePrice(1n, 99n)).
      to.emit(nftMarket, "PriceUpdated").
      withArgs(1n, 99n);
    });

    // 测试用例：错误处理
    it("Should revert when newPrice is 0", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.updatePrice(1n,0n))
      .to.be.revertedWith("Price must be greater than 0");
    });
    it("Should revert when listNFT not exists", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.updatePrice(1n,1n))
      .to.be.revertedWith("Listing not active");
    });
    it("Should revert when listNFT owner is not msg.sender", async function () {
      const {nftMarket,nftToken, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);
      await nftMarket.listNFT(nftToken, 1n, 1n);

      await expect(nftMarket.connect(addr1).updatePrice(1n, 2n))
      .to.be.revertedWith("Not the seller");
    });
  });

     // 子套件：设置功能测试
  describe("buyNFT", function(){
    // 测试用例：基本设置
    it("buyNFT success with ethers", async function () {
      const {nftMarket,nftToken, priceConsumer, owner,addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);
      await nftMarket.listNFT(nftToken, 1n, 1n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      await priceConsumer.setPriceFeed(ZeroAddress, ethersAggregator);

      const tx = await nftMarket.connect(addr1).buyNFT(1n, ZeroAddress, 0n, { value: ethers.parseUnits("1","ether")});
      await expect(tx).to.emit(nftMarket, "NFTSold").
      withArgs(1n, addr1, owner, ZeroAddress, 1n);
    });

    it("buyNFT success with erc20Token", async function () {
      const {nftMarket,nftToken, priceConsumer, owner,addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);
      await nftMarket.listNFT(nftToken, 1n, 1n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      const erc20Token = await ethers.deployContract("CookToken",[10000n]);
      await priceConsumer.setPriceFeed(erc20Token, ethersAggregator);
      await erc20Token.mint(addr1, 10n);
      await erc20Token.connect(addr1).approve(nftMarket, 5n);

      await expect(await nftMarket.connect(addr1).buyNFT(1n, erc20Token, 1n)).
      to.emit(nftMarket, "NFTSold").
      withArgs(1n, addr1, owner, erc20Token, 1n);
    });

    // 测试用例：错误处理
    it("Should revert when ListNFT is not active", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.buyNFT(1n, ZeroAddress, 0n))
      .to.be.revertedWith("Listing not active");
    });
    it("Should revert when listNFT seller equals buyer", async function () {
      const {nftMarket,nftToken, priceConsumer, owner,addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);
      await nftMarket.listNFT(nftToken, 1n, 1n);

      await expect(nftMarket.buyNFT(1n, ZeroAddress, 0n))
      .to.be.revertedWith("Cannot buy your own NFT");
    });
    it("Should revert when nftmarketpalce has not enough erc20Token", async function () {
      const {nftMarket,nftToken, priceConsumer, owner,addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);
      await nftMarket.listNFT(nftToken, 1n, 10n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      const erc20Token = await ethers.deployContract("CookToken",[10000n]);
      await priceConsumer.setPriceFeed(erc20Token, ethersAggregator);
      await erc20Token.mint(addr1, 10n);
      await erc20Token.connect(addr1).approve(nftMarket, 1n);

      await expect(nftMarket.connect(addr1).buyNFT(1n, erc20Token, 10n)).
      to.be.revertedWith("Insufficient token");
    });
    it("Should revert when erc20Token amount is Insufficient", async function () {
      const {nftMarket,nftToken, priceConsumer, owner,addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);
      await nftMarket.listNFT(nftToken, 1n, 10n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      const erc20Token = await ethers.deployContract("CookToken",[10000n]);
      await priceConsumer.setPriceFeed(erc20Token, ethersAggregator);
      await erc20Token.mint(addr1, 10n);
      await erc20Token.connect(addr1).approve(nftMarket, 5n);

      await expect(nftMarket.connect(addr1).buyNFT(1n, erc20Token, 1n)).
      to.be.revertedWith("Insufficient payment");
    });
    it("Should revert when msg.value's price is zero", async function () {
      const {nftMarket,nftToken, priceConsumer, owner,addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);
      await nftMarket.listNFT(nftToken, 1n, 10n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      await priceConsumer.setPriceFeed(ZeroAddress, ethersAggregator);
      await ethersAggregator.updateAnswer(0n);

      await expect(nftMarket.connect(addr1).buyNFT(1n, ZeroAddress, 0n, { value: ethers.parseEther("1")})).
      to.be.revertedWith("Chainlink: price <= 0");
    });

    it("Should revert when msg.value is Insufficient", async function () {
      const {nftMarket,nftToken, priceConsumer, owner,addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);
      await nftMarket.listNFT(nftToken, 1n, 10n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      await priceConsumer.setPriceFeed(ZeroAddress, ethersAggregator);

      await expect(nftMarket.connect(addr1).buyNFT(1n, ZeroAddress, 0n, { value: ethers.parseEther("0.000000000000000001")})).
      to.be.revertedWith("Insufficient payment");
    });
  });

   // 子套件：设置功能测试
  describe("createAuction", function(){
    // 测试用例：基本设置
    it("createAuction success", async function () {
      const {nftMarket,nftToken, owner} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await expect(nftMarket.createAuction(nftToken, 1n, 1n,1n)).
      to.emit(nftMarket, "AuctionCreated");
    });

    // // 测试用例：错误处理
    it("Should revert when startPrice is zero", async function () {
      const {nftMarket,nftToken} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.createAuction(nftToken, 1n, 0n,1n))
      .to.be.revertedWith("Start price must be greater than 0");
    });

    it("Should revert when durationHours is 0", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.createAuction(ZeroAddress, 1n, 1n,0n))
      .to.be.revertedWith("Duration must be at least 1 hour");
    });

    it("Should revert when nfttoken address is zeroAddress", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.createAuction(ZeroAddress, 1n, 1n,1n))
      .to.be.revertedWith("Invalid NFT contract");
    });
    it("Should revert when nfttoken owner is not msg.sender", async function () {
       const {nftMarket,nftToken, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      const tx = await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await expect(nftMarket.connect(addr1).createAuction(nftToken, 1n, 1n, 1n))
      .to.be.revertedWith("Not the owner");
    });

    it("Should revert when nfttokenId not exists", async function () {
      const {nftMarket,nftToken, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.createAuction(nftToken, 99n, 1n, 1n))
      .to.be.revertedWithCustomError(nftToken, "ERC721NonexistentToken");
    });

    it("Should revert when nfttoken not approve to nftMarket", async function () {
      const {nftMarket,nftToken, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      const tx = await nftToken.mint(uri, { value: requiredPayment});

      await expect(nftMarket.createAuction(nftToken, 1n, 1n, 1n))
      .to.be.revertedWith("Marketplace not approved");
    });
  });

     // 子套件：设置功能测试
  describe("placeBid", function(){
    // 测试用例：基本设置
    it("placeBid success with ethers", async function () {
      const {nftMarket,nftToken, priceConsumer, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await nftMarket.createAuction(nftToken, 1n, 1n,1n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      await priceConsumer.setPriceFeed(ZeroAddress, ethersAggregator);

      const tx = await nftMarket.connect(addr1).placeBid(1n, ZeroAddress, 0n, { value: ethers.parseUnits("1")});
      await expect(tx).to.emit(nftMarket, "BidPlaced");
    });

    it("buyNFT success with erc20Token", async function () {
      const {nftMarket,nftToken, priceConsumer, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await nftMarket.createAuction(nftToken, 1n, 1n,1n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      const erc20Token = await ethers.deployContract("CookToken",[10000n]);
      await priceConsumer.setPriceFeed(erc20Token, ethersAggregator);
      await erc20Token.mint(addr1, 10n);
      await erc20Token.connect(addr1).approve(nftMarket, 5n);

      await expect(nftMarket.connect(addr1).placeBid(1n, erc20Token, 1n)).
      to.emit(nftMarket, "BidPlaced");
    });

    // 测试用例：错误处理
    it("Should revert when auction is not active", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.placeBid(1n, ZeroAddress, 0n))
      .to.be.revertedWith("Auction not active");
    });
    it("Should revert when auction is timeout", async function () {
      const {nftMarket,nftToken, priceConsumer, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await nftMarket.createAuction(nftToken, 1n, 1n,1n);
      await networkHelpers.time.increase(3601);

      await expect(nftMarket.placeBid(1n, ZeroAddress, 0n))
      .to.be.revertedWith("Auction ended");
    });
    it("Should revert when auction seller equal buyer", async function () {
      const {nftMarket,nftToken, priceConsumer, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await nftMarket.createAuction(nftToken, 1n, 1n,1n);

      await expect(nftMarket.placeBid(1n, ZeroAddress, 0n))
      .to.be.revertedWith("Seller cannot bid");
    });
    it("Should revert when msg.value is not enough", async function () {
      const {nftMarket,nftToken, priceConsumer, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await nftMarket.createAuction(nftToken, 1n, 10n,1n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      await priceConsumer.setPriceFeed(ZeroAddress, ethersAggregator);

      await expect(nftMarket.connect(addr1).placeBid(1n, ZeroAddress, 0n, { value: ethers.parseUnits("1", "wei")})).to.be.revertedWith("Bid too low");
    });

    it("Should revert when erc20Token amount is not enough", async function () {
      const {nftMarket,nftToken, priceConsumer, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await nftMarket.createAuction(nftToken, 1n, 10n, 1n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      const erc20Token = await ethers.deployContract("CookToken",[10000n]);
      await priceConsumer.setPriceFeed(erc20Token, ethersAggregator);
      await erc20Token.mint(addr1, 10n);
      await erc20Token.connect(addr1).approve(nftMarket, 5n);

      await expect(nftMarket.connect(addr1).placeBid(1n, erc20Token, 1n)).to.be.revertedWith("Bid too low");
    });
  });

  // 子套件：设置功能测试
  describe("withdrawBid", function(){
    // 测试用例：基本设置
    it("withdrawBid success with ethers", async function () {
      const {nftMarket,nftToken, priceConsumer, owner, addr1, addr2} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await nftMarket.createAuction(nftToken, 1n, 1n,1n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      await priceConsumer.setPriceFeed(ZeroAddress, ethersAggregator);

      const tx = await nftMarket.connect(addr1).placeBid(1n, ZeroAddress, 0n, { value: ethers.parseUnits("1","wei")});
      // 此时回退金额为 0
      expect(await nftMarket.pendingReturns(1n, addr1)).to.be.equal(0n);

      const ethersAggregator2 = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      const erc20Token = await ethers.deployContract("CookToken",[10000n]);
      await priceConsumer.setPriceFeed(erc20Token, ethersAggregator2);
      await erc20Token.mint(addr2, 10n);
      await erc20Token.connect(addr2).approve(nftMarket, 5n);
      
      await nftMarket.connect(addr2).placeBid(1n, erc20Token, 4n);
      // 此时回退金额 大于 0
      expect(await nftMarket.pendingReturns(1n, addr1)).to.be.above(0n);
      await nftMarket.connect(addr1).withdrawBid(1n, ZeroAddress);
      expect(await nftMarket.pendingReturns(1n, addr1)).to.be.equal(0n);
    });

    it("withdrawBid success with erc20Token", async function () {
      const {nftMarket,nftToken, priceConsumer, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await nftMarket.createAuction(nftToken, 1n, 1n,1n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      const erc20Token = await ethers.deployContract("CookToken",[10000n]);
      await priceConsumer.setPriceFeed(erc20Token, ethersAggregator);
      await erc20Token.mint(addr1, 10n);
      await erc20Token.connect(addr1).approve(nftMarket, 5n);
      await nftMarket.connect(addr1).placeBid(1n, erc20Token, 1n);
      expect(await nftMarket.pendingTokenReturns(1n, addr1, erc20Token)).to.be.equal(0n);

      const ethersAggregator2 = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      await priceConsumer.setPriceFeed(ZeroAddress, ethersAggregator2);

      const tx = await nftMarket.connect(addr1).placeBid(1n, ZeroAddress, 0n, { value: ethers.parseUnits("10","wei")});
      expect(await nftMarket.pendingTokenReturns(1n, addr1, erc20Token)).to.be.above(0n);

      await nftMarket.connect(addr1).withdrawBid(1n, erc20Token);
      expect(await nftMarket.pendingTokenReturns(1n, addr1, erc20Token)).to.be.equal(0n);
    });

    // // 测试用例：错误处理
    it("Should revert when No value return", async function () {
      const {nftMarket,addr1} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.connect(addr1).withdrawBid(1n, ZeroAddress))
      .to.be.revertedWith("No pending return");
    });
    it("Should revert when No token return", async function () {
      const {nftMarket,addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const erc20Token = await ethers.deployContract("CookToken",[10000n]);
      await expect(nftMarket.connect(addr1).withdrawBid(1n, erc20Token))
      .to.be.revertedWith("No pending return");
    });
  });

  // 子套件：设置功能测试
  describe("endAuction", function(){
    // 测试用例：基本设置
    it("endAuction success when no one bid", async function () {
      const {nftMarket,nftToken, priceConsumer, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await nftMarket.createAuction(nftToken, 1n, 1n,1n);
      await networkHelpers.time.increase(3601n);

      const tx = await nftMarket.endAuction(1n);
      await expect(tx).to.emit(nftMarket, "AuctionEnded").withArgs(1n, ZeroAddress, ZeroAddress, 0n);
    });

        // 测试用例：基本设置
    it("endAuction success with ethers", async function () {
      const {nftMarket,nftToken, priceConsumer, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await nftMarket.createAuction(nftToken, 1n, 1n,1n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      await priceConsumer.setPriceFeed(ZeroAddress, ethersAggregator);

      await nftMarket.connect(addr1).placeBid(1n, ZeroAddress, 0n, { value: ethers.parseUnits("1")});
      await networkHelpers.time.increase(3601n);

      const tx = await nftMarket.endAuction(1n);
      await expect(tx).to.emit(nftMarket, "AuctionEnded");
    });

    it("endAuction success with erc20Token", async function () {
      const {nftMarket,nftToken, priceConsumer, owner, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await nftMarket.createAuction(nftToken, 1n, 1n,1n);

      const ethersAggregator = await ethers.deployContract("MockCookTokenV3Aggregator",[8n,"Cook Token's USD price",1n]);
      const erc20Token = await ethers.deployContract("CookToken",[10000n]);
      await priceConsumer.setPriceFeed(erc20Token, ethersAggregator);
      await erc20Token.mint(addr1, 10n);
      await erc20Token.connect(addr1).approve(nftMarket, 5n);

      await nftMarket.connect(addr1).placeBid(1n, erc20Token, 1n);

      await networkHelpers.time.increase(3601n);

      const tx = await nftMarket.endAuction(1n);
      await expect(tx).to.emit(nftMarket, "AuctionEnded");
    });

    // // 测试用例：错误处理
    it("Should revert when auction is not active", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(nftMarket.endAuction(1n))
      .to.be.revertedWith("Auction not active");
    });
    it("Should revert when auction is not timeout", async function () {
      const {nftMarket,nftToken } = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      await nftToken.mint(uri, { value: requiredPayment});
      await nftToken.approve(nftMarket, 1n);

      await nftMarket.createAuction(nftToken, 1n, 1n,1n);

      await expect(nftMarket.endAuction(1n))
      .to.be.revertedWith("Auction not ended");
    });
  });

// 子套件：设置功能测试
  describe("setPlatformFee", function(){
    // 测试用例：基本设置
    it("setPlatformFee success", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);
      await nftMarket.setPlatformFee(300n);
      expect(await nftMarket.platformFee()).
      to.be.equal(300n);
    });

    // 测试用例：错误处理
    it("Should revert when msg.sender != feeRecipient", async function () {
      const {nftMarket, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      await expect(nftMarket.connect(addr1).setPlatformFee(100n))
      .to.be.revertedWith("Not fee recipient");
    });
    it("Should revert when newFee > 1000", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);
      await expect(nftMarket.setPlatformFee(1001n))
      .to.be.revertedWith("Fee too high");
    });
  });
  
// 子套件：设置功能测试
  describe("updateFeeRecipient", function(){
    // 测试用例：基本设置
    it("updateFeeRecipient success", async function () {
      const {nftMarket, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      await nftMarket.updateFeeRecipient(addr1);
      expect(await nftMarket.feeRecipient()).
      to.be.equal(addr1);
    });

    // 测试用例：错误处理
    it("Should revert when msg.sender != feeRecipient", async function () {
      const {nftMarket, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      await expect(nftMarket.connect(addr1).updateFeeRecipient(addr1))
      .to.be.revertedWith("Not fee recipient");
    });
    it("Should revert when newRecipient is ZeroAddress", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);
      await expect(nftMarket.updateFeeRecipient(ZeroAddress))
      .to.be.revertedWith("Invalid address");
    });
  });

  // 子套件：设置功能测试
  describe("updatePriceConsumer", function(){
    // 测试用例：基本设置
    it("updatePriceConsumer success", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);

      const priceConsumer2 = await ethers.deployContract("PriceConsumerV3");
      const priceConsumerAddress2 = await priceConsumer2.getAddress();

      await nftMarket.updatePriceConsumer(priceConsumerAddress2);
      expect(await nftMarket.priceConsumer()).
      to.be.equal(priceConsumerAddress2);
    });

    // 测试用例：错误处理
    it("Should revert when msg.sender != feeRecipient", async function () {
      const {nftMarket, addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const priceConsumer2 = await ethers.deployContract("PriceConsumerV3");
      const priceConsumerAddress2 = await priceConsumer2.getAddress();

      await expect(nftMarket.connect(addr1).updatePriceConsumer(priceConsumerAddress2))
      .to.be.revertedWith("Not fee recipient");
    });
    it("Should revert when newRecipient is ZeroAddress", async function () {
      const {nftMarket} = await networkHelpers.loadFixture(deployCounterFixture);
      await expect(nftMarket.updatePriceConsumer(ZeroAddress))
      .to.be.revertedWith("Invalid address");
    });
  });

});
