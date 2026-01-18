import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import DeployUUPSModule from "./UUPSDeploy.js";

export const UpgradeableERC20Module = buildModule("UpgradeableERC20Module", (builder) => {
  // Get the proxy from the previous module.
  const { proxy ,implementation} = builder.useModule(DeployUUPSModule);

  // Create a contract instance using the deployed proxy's address.
  const instance = builder.contractAt("DemoUUPSV2", proxy);

  return { instance, proxy,implementation };
});

export default UpgradeableERC20Module;