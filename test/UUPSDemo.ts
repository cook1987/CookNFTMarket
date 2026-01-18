import DeployUUPSModule from "../ignition/modules/UUPSDeploy.js";
import UpgradeableERC20Module from "../ignition/modules/UUPSUpgrade.js";
import { expect } from "chai";
import {network} from "hardhat";
// 连接网络
const {ethers, networkHelpers, ignition} = await network.connect();

// 测试套件
describe("Demo proxy", function(){
  // 子套件：部署测试
  describe("proxy interaction", function(){
    // 测试用例：合约地址验证
    it("should be usable via proxy", async function () {
     const [owner, addr1, addr2] = await ethers.getSigners();

     const {proxy, implementation} = await ignition.deploy(DeployUUPSModule);

     const res = await implementation.getFunction("getValue").call(implementation);

     console.log(res);

     expect(res).to.be.equal(0n);
    
    });
  });

   describe("Upgrading", function(){
    // 测试用例：合约地址验证
    it("Should have upgraded the proxy to DemoV2", async function () {
     const [owner, addr1, addr2] = await ethers.getSigners();

     const {instance, proxy,implementation} = await ignition.deploy(UpgradeableERC20Module);

     const res = await implementation.getFunction("getValue").call(implementation);

     console.log(res);

     expect(res).to.be.equal(0n);
    
    });
    
  });


});