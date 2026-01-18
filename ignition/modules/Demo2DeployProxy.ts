import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeployProxyModule = buildModule("DeployProxyModule", (m) => {
    // 1、部署 Logic 合约
    const boxV1 = m.contract("BoxV1");

    // 2、部署 proxyAdmin
    const proxyAdmin = m.contract("ProxyAdmin",[m.getAccount(0)]);

    // 3、编码 initiallize 调用数据
    const initData = m.encodeFunctionCall(boxV1, "initialize",[
        m.getAccount(0),// owner
    ]);

    // 4、部署 TransparentUpgradeableProxy
    const proxy = m.contract("TransparentUpgradeableProxy",[
        boxV1,
        proxyAdmin,
        initData,
    ]);

    return {boxV1,proxyAdmin, proxy};

});

export default DeployProxyModule