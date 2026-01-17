import { expect } from "chai";
import {network} from "hardhat";

// 连接网络
const {ethers, networkHelpers} = await network.connect();

const uri = "https://baike.baidu.com/tashuo/browse/content?id=7d03a8b895a000beecd7a8d3";

// 定义 Fixture 函数
async function deployCounterFixture() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const nftToken = await ethers.deployContract("CookNFT");
  
  return {nftToken, owner, addr1, addr2};
}

// 测试套件
describe("CookNFT", function(){
  // 子套件：部署测试
  describe("Deployment", function(){
    // 测试用例：合约地址验证
    it("Should have valid address", async function () {
      const {nftToken} = await networkHelpers.loadFixture(deployCounterFixture);
      const address = await nftToken.getAddress();

      // expect(address).to.be.a("string");
      console.log("address:", address);
      expect(address).to.be.a("string");
      expect(address).to.have.length(42);
      expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  // 子套件：设置功能测试
  describe("mint test", function(){
    // 测试用例：基本设置
    it("mint success", async function () {
      const {nftToken, owner, addr1 } = await networkHelpers.loadFixture(deployCounterFixture);
      
      const requiredPayment = ethers.parseEther("0.0001");

      const tx = await nftToken.mint(uri, { value: requiredPayment});

      await expect(tx).to.emit(nftToken, "NFTMinted").withArgs(owner, 1n, uri);
      expect(await nftToken.balanceOf(owner)).to.equal(1n);
    });
    // 测试用例：错误处理
    it("Should revert when pay value less than required", async function () {
      const {nftToken, owner, addr1 } = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.00001");

      await expect( nftToken.mint(uri, { value: requiredPayment})).to.be.revertedWith("Insufficient payment");
    });

    it("Should revert when _tokenIdCounter >= MAX_SUPPLY", async function () {
      const {nftToken, owner, addr1 } = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");
      const maxsupply = await nftToken.MAX_SUPPLY();
       // 将超时时间设置为 5 分钟 (300,000 毫秒)
      this.timeout(300000); 
      for (let i = 1n; i <= maxsupply; i++) {
        await nftToken.mint(uri, { value: requiredPayment});
      }

      await expect( nftToken.mint(uri, { value: requiredPayment})).to.be.revertedWith("Max supply reached");
    });
  });

  // // 子套件：设置功能测试
  describe("tokenURI test", function(){
    // 测试用例：
    it("tokenURI success", async function () {
      const {nftToken, owner, addr1 } = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");

      const tx = await nftToken.mint(uri, { value: requiredPayment});
      await tx.wait();
      const tokenId = await nftToken.totalSupply();
      expect(await nftToken.tokenURI(tokenId)).to.be.equal(uri);
    });
    // 测试异常情况
    it("Should revert when check an unexists tokenId", async function () {
      const {nftToken, owner, addr1 } = await networkHelpers.loadFixture(deployCounterFixture);
      await expect(nftToken.tokenURI(100n)).to.be.revertedWithCustomError(nftToken, "ERC721NonexistentToken");
    });
  });

   // // 子套件：设置功能测试
  describe("totalSupply test", function(){
    // 测试用例：
    it("totalSupply success", async function () {
      const {nftToken, owner, addr1 } = await networkHelpers.loadFixture(deployCounterFixture);
      const requiredPayment = ethers.parseEther("0.0001");

      const tokenId = await nftToken.totalSupply();
      expect(tokenId).to.be.equal(0n);

      const tx = await nftToken.mint(uri, { value: requiredPayment});
      await tx.wait();
      const tokenId2 = await nftToken.totalSupply();
      expect(tokenId2).to.be.equal(1n);
    });
    
  });

  // // 子套件：设置功能测试
  describe("withdraw test", function(){
    // 测试用例
    it("withdraw success", async function () {
      const {nftToken, owner, addr1 } = await networkHelpers.loadFixture(deployCounterFixture);
      const payment = "0.0001";
      const requiredPayment = ethers.parseEther(payment);
      const address = await nftToken.getAddress();

      await expect(await nftToken.mint(uri, { value: requiredPayment})).to.changeEtherBalances(ethers,
        [address],
        [ethers.parseEther(payment)],
        { includeFee: true }
      );

      await expect(await nftToken.withdraw()).to.changeEtherBalances(ethers,
        [address],
        [ethers.parseEther("-0.0001")],
        { includeFee: true }
      );
    });
    // 测试异常情况
    it("Should revert when owner balance is zero", async function () {
      const {nftToken } = await networkHelpers.loadFixture(deployCounterFixture);
      await expect(nftToken.withdraw()).to.be.revertedWith("No balance to withdraw");
    });
  });

  describe("setMintPrice test", function(){
    // 测试用例：
    it("setMintPrice success", async function () {
      const {nftToken, owner, addr1 } = await networkHelpers.loadFixture(deployCounterFixture);

      const tx = await nftToken.setMintPrice(ethers.parseEther("0.01"));
      await tx.wait();
      const mintPrice = await nftToken.mintPrice();
      expect(mintPrice).to.be.equal(ethers.parseEther("0.01"));
    });
  });

});
