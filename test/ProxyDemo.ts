import demoModule from "../ignition/modules/ProxyModule.js";
import demoV2Module from "../ignition/modules/UpgradeModule.js";
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

     const {demo, proxy, proxyAdmin} = await ignition.deploy(demoModule);

     const res = await demo.getFunction("version").call(demo);

     console.log("第一次部署：demo：", await demo.getAddress());
     console.log("第一次部署：proxy：", await  proxy.getAddress());
     console.log("第一次部署：proxyAdmin：", await  proxyAdmin.getAddress());

     console.log(res);

     expect(res).to.be.equal("1.0.0");
    
    });
  });

   describe("Upgrading", function(){
    // 测试用例：合约地址验证
    it("Should have upgraded the proxy to DemoV2", async function () {
     const [owner, addr1, addr2] = await ethers.getSigners();

     const {proxyAdmin, proxy, demo} = await ignition.deploy(demoV2Module);

     console.log("第er次部署：demo：", await  demo.getAddress());
     console.log("第er次部署：proxy：",  await proxy.getAddress());
     console.log("第er次部署：proxyAdmin：",  await proxyAdmin.getAddress());

     const res = await demo.getFunction("version").call(demo);

     console.log(res);

     expect(res).to.be.equal("2.0.0");
    
    });

    it("Should have set the name during upgrade", async function () {
      const { demo } = await ignition.deploy(demoV2Module);

      const res = await demo.getFunction("name").call(demo);

      console.log(res);

      expect(res).to.be.equal("Example Name cook");
    });
    
  });


});