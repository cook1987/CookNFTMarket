import { expect } from "chai";
import { ZeroAddress } from "ethers";
import {network} from "hardhat";

// 连接网络
const {ethers, networkHelpers} = await network.connect();

// 定义 Fixture 函数
async function deployCounterFixture() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const priceConsumer = await ethers.deployContract("PriceConsumerV3");
  const erc20Token = await ethers.deployContract("CookToken",[10000n]);
  const erc20TokenPriceFeedMock = await ethers.deployContract("MockCookTokenV3Aggregator", [8n,"Cook Token's USD price",4n]);
  
  return {priceConsumer, erc20Token, erc20TokenPriceFeedMock, owner, addr1, addr2};
}

// 测试套件
describe("PriceConsumerV3", function(){
  // 子套件：部署测试
  describe("Deployment", function(){
    // 测试用例：合约地址验证
    it("Should have valid address", async function () {
      const {priceConsumer} = await networkHelpers.loadFixture(deployCounterFixture);
      const address = await priceConsumer.getAddress();

      // expect(address).to.be.a("string");
      console.log("address:", address);
      expect(address).to.be.a("string");
      expect(address).to.have.length(42);
      expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  // 子套件：设置功能测试
  describe("setPriceFeed", function(){
    // 测试用例：基本设置
    it("SetPriceFeed success", async function () {
      const {priceConsumer, erc20Token, erc20TokenPriceFeedMock} = await networkHelpers.loadFixture(deployCounterFixture);

      await priceConsumer.setPriceFeed(erc20Token, erc20TokenPriceFeedMock);
      expect(await priceConsumer.getLatestPrice(erc20Token)).to.above(0n);
    });

    // 测试用例：错误处理
    it("Should revert when priceFeed address is zero", async function () {
      const {priceConsumer} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(priceConsumer.setPriceFeed(ZeroAddress, ZeroAddress))
      .to.be.revertedWith("Invalid priceFeed address.");
    });

    it("Should revert when priceFeed address is not a contract", async function () {
      const {priceConsumer,owner} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(priceConsumer.setPriceFeed(ZeroAddress, owner))
      .to.be.revertedWith("Not a contract.");
    });

    it("Should revert when priceFeed return 0", async function () {
      const {priceConsumer, erc20Token, erc20TokenPriceFeedMock} = await networkHelpers.loadFixture(deployCounterFixture);
      await erc20TokenPriceFeedMock.updateAnswer(0n);
      await expect(priceConsumer.setPriceFeed(erc20Token, erc20TokenPriceFeedMock))
      .to.be.revertedWith("Invalid priceFeed.");
    });
  });

  // 子套件：设置功能测试
  describe("getLatestPrice", function(){
    // 测试用例：错误处理
    it("Should revert when the given token has not a pricefeed", async function () {
      const {priceConsumer,owner} = await networkHelpers.loadFixture(deployCounterFixture);

      await expect(priceConsumer.getLatestPrice(owner))
      .to.be.revertedWith("Current token hasn't a priceFeed.");
    });
  });

});
