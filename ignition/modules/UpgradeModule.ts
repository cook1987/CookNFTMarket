import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import demoModule from "./ProxyModule.js";

const upgradeModule = buildModule("UpgradeModule", (m) => {
    const proxyAdminOwner = m.getAccount(0);

    const {proxyAdmin, proxy} = m.useModule(demoModule);

    const demoV2 = m.contract("DemoV2");

    const encodeFunctionCall = m.encodeFunctionCall(demoV2, "setName", ["Example Name cook"]);

    m.call(proxyAdmin, "upgradeAndCall", [proxy, demoV2, encodeFunctionCall],{
        from: proxyAdminOwner,
    });

    return {proxyAdmin, proxy};

});

const demoV2Module = buildModule("DemoV2Module", (m) => {
    const {proxyAdmin, proxy} = m.useModule(upgradeModule);

    const demo = m.contractAt("DemoV2", proxy);

    //  console.log("第er次部署：demo：", demo.address);
    //  console.log("第er次部署：proxy：",  proxy);
    //  console.log("第er次部署：proxyAdmin：",  proxyAdmin.address);

    return {proxyAdmin, proxy, demo};

});

export default demoV2Module;