import DeployProxyModule from "../ignition/modules/Demo2DeployProxy.js";
import boxV2Module from "../ignition/modules/Demo2DeployProxyUpgrade.js";
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

     const {boxV1,proxyAdmin, proxy} = await ignition.deploy(DeployProxyModule);

     const box = await ethers.getContractAt(
        "BoxV1",
        await proxy.getAddress(),
      );

      await box.setValue(100);
      console.log(await box.getValue());
    
    });
  });

   describe("Upgrading", function(){
    // 测试用例：合约地址验证
    it("Should have upgraded the proxy to BoxV2", async function () {
     const [owner, addr1, addr2] = await ethers.getSigners();

     const {boxV1,boxV2, proxyAdmin, proxy} = await ignition.deploy(boxV2Module);

     const box = await ethers.getContractAt(
        "BoxV2",
        await proxy.getAddress(),
      );

      await box.setValue(100);
      await box.increment();

      console.log(await box.getValue());
    });

  
    
  });


});