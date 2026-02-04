import {network} from "hardhat";
// 方式1: 直接导入整个 JSON 文件
import erc1967ProxyArtifact from '@openzeppelin/contracts/build/contracts/ERC1967Proxy.json';
// 连接网络
const {ethers, networkHelpers} = await network.connect();

/**
 * 手动部署 UUPS 代理（因为 hre.upgrades 在 Hardhat 3 中不可用）
 */
async function deployUUPSProxy(
  ContractFactory: any,
  initArgs: any[],
  signer: any,
  ethers: any
) {
    console.log("开始部署 UUPS 代理...")
    try{
        // 1. 部署实现合约
        console.log("部署实现合约...")
        const implementation = await ContractFactory.connect(signer).deploy();
        await implementation.waitForDeployment();
        const implementationAddress = await implementation.getAddress();
        console.log("✅ 实现合约部署到:", implementationAddress);
        
        // 2. 获取初始化数据
        console.log("准备初始化数据...")
        const initData = ContractFactory.interface.encodeFunctionData("initialize", initArgs);

          // 3. 从 OpenZeppelin 的 artifact 读取 ERC1967Proxy
        const ERC1967ProxyFactory = new ethers.ContractFactory(
            erc1967ProxyArtifact.abi,
            erc1967ProxyArtifact.bytecode,
            signer
        );
        
        // 4. 部署代理
        const proxy = await ERC1967ProxyFactory.deploy(implementationAddress, initData);
        await proxy.waitForDeployment();
        const proxyAddress = await proxy.getAddress();
        console.log("✅ 代理合约部署到:", proxyAddress);

          // 5. 返回代理合约实例
        return await ethers.getContractAt(ContractFactory.interface, proxyAddress);
    }catch (error) {
        console.error("❌ 部署失败:", error);
        throw error;
  }
}

// 调用函数的主要逻辑
async function main() {
  console.log("🚀 开始 UUPS 代理部署流程");
  
  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  console.log(`网络: ${network.name} (Chain ID: ${network.chainId})`);
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`部署账户: ${deployer.address}`);
  
  try {
    // 编译并获取合约工厂
    console.log("\n📦 编译合约...");
    const MyContract = await ethers.getContractFactory("MyContract");
    console.log("合约编译完成");
    
    // 准备初始化参数 - 根据你的合约构造函数调整
    const initArgs = [
      "My UUPS Token",           // name
      "MUT",                    // symbol
      ethers.parseUnits("1000000", 18), // initialSupply
      deployer.address          // owner
    ];
    console.log("初始化参数:", initArgs);
    
    // 调用部署函数
    console.log("\n🔧 开始部署代理...");
    const deployedContract = await deployUUPSProxy(
      MyContract,    // ContractFactory
      initArgs,      // initArgs  
      deployer,      // signer
      ethers         // ethers 库
    );
    
    // 验证部署结果
    console.log("\n✨ 验证部署结果...");
    const name = await deployedContract.name();
    const symbol = await deployedContract.symbol();
    console.log(`合约名称: ${name}`);
    console.log(`合约符号: ${symbol}`);
    
    console.log("\n🎉 部署成功完成!");
    console.log("代理地址:", await deployedContract.getAddress());
    console.log("实现地址:", /* 需要记录实现地址的逻辑 */);
    
    return deployedContract;
    
  } catch (error) {
    console.error("\n💥 部署过程中发生错误:");
    console.error(error);
    throw error;
  }
}

// 执行部署
// if (require.main === module) {
//   main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//       console.error(error);
//       process.exit(1);
//     });
// }

export default deployUUPSProxy;