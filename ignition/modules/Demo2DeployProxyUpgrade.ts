import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import DeployProxyModule from "./Demo2DeployProxy.js";

const DeployProxyModuleUpgrade = buildModule("DeployProxyModuleUpgrade", (m) => {
    const {proxyAdmin, proxy} = m.useModule(DeployProxyModule);

    const boxV2 = m.contract("BoxV2");

        // 3、编码 initiallize 调用数据
    const initData = m.encodeFunctionCall(boxV2, "initialize",[
        m.getAccount(0),// owner
    ]);

    m.call(proxyAdmin, "upgradeAndCall", [proxy, boxV2, initData],{
        from: m.getAccount(0),
    });
    return {proxyAdmin, proxy, boxV2};

});

// const boxV2Module = buildModule("boxV2Module", (m) => {
//     const {boxV1,proxyAdmin, proxy} = m.useModule(DeployProxyModuleUpgrade);

//     const boxV2 = m.contractAt("BoxV2", proxy);

//     return {proxyAdmin, proxy, boxV2, boxV1};

// });

export default DeployProxyModuleUpgrade;