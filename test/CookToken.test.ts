import { expect } from "chai";
import { ZeroAddress } from "ethers";
import {network} from "hardhat";

// 连接网络
const {ethers, networkHelpers} = await network.connect();

// 定义 Fixture 函数
async function deployCounterFixture() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const erc20Token = await ethers.deployContract("CookToken",[10000n]);
  
  return {erc20Token, owner, addr1, addr2};
}

// 测试套件
describe("CookToken", function(){
  // 子套件：部署测试
  describe("Deployment", function(){
    // 测试用例：合约地址验证
    it("Should have valid address", async function () {
      const {erc20Token} = await networkHelpers.loadFixture(deployCounterFixture);
      const address = await erc20Token.getAddress();

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
      const {erc20Token, owner, addr1 } = await networkHelpers.loadFixture(deployCounterFixture);

      await erc20Token.mint(addr1, 99n);
      expect(await erc20Token.balanceOf(addr1)).to.equal(99n);
    });
    // 测试用例：错误处理
    it("Should revert when mint amount is zero", async function () {
      const {erc20Token, owner, addr1 } = await networkHelpers.loadFixture(deployCounterFixture);

      expect(await erc20Token.mint(addr1, 0n)).to.revert;
    });

    it("Should revert when mint amount is uint256 max value", async function () {
      const {erc20Token,owner,addr1} = await networkHelpers.loadFixture(deployCounterFixture);
      const maxvalue = 2n**256n - 1n;
      await expect(erc20Token.mint(addr1, maxvalue)).to.be.revertedWithPanic(0x11);
    });
  });

  // // 子套件：设置功能测试
  describe("burn test", function(){
    // 测试用例：错误处理
    it("burn success", async function () {
      const {erc20Token,owner,addr1} = await networkHelpers.loadFixture(deployCounterFixture);

      await erc20Token.mint(addr1, 99n);
      await erc20Token.connect(addr1).burn(49n);
      expect(await erc20Token.balanceOf(addr1)).to.equal(50n);
    });

    it("Should revert when burn amount over balance", async function () {
      const {erc20Token,owner,addr1} = await networkHelpers.loadFixture(deployCounterFixture);

      await erc20Token.mint(addr1, 99n);
      await expect(erc20Token.connect(addr1).burn(109n)).to.be.revertedWithCustomError(erc20Token,"ERC20InsufficientBalance");
    });
  });

});
