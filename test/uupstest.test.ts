import deployUUPSProxy from "../scripts/uups_op_tx.js";
import { expect } from "chai";
import {network} from "hardhat";

// 连接网络
const {ethers, networkHelpers} = await network.connect();

describe("UUPS Proxy Deployment", function () {
  
  it("Should deploy UUPS proxy successfully", async function () {
    const [deployer, addr1, addr2] = await ethers.getSigners();
    const myContractFactory = await ethers.getContractFactory("DemoUUPSV2");

    const initArgs = [deployer.address];
    
    // 调用部署函数
    const deployedContract = await deployUUPSProxy(
      myContractFactory,
      initArgs,
      deployer,
      ethers
    );
    console.log("测试脚本中，合约地址：", await deployedContract.getAddress())
    // 验证部署
    expect(await deployedContract.getValue()).to.equal(0n);
    await deployedContract.setValue(99n)
    expect(await deployedContract.getValue()).to.equal(109n);
  });
});
