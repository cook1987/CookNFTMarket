import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeployUUPSModule = buildModule("DeployUUPSModule", (m) => {
    const deployer = m.getAccount(0);

  // Deploy the implementation contract
  const implementation = m.contract("DemoUUPS");

  // Encode the initialize function call for the contract.
  const initialize = m.encodeFunctionCall(implementation, "initialize", [deployer]);

  // Deploy the ERC1967 Proxy, pointing to the implementation
  const proxy = m.contract("UUPSProxy", [implementation, initialize]);

    return { proxy, implementation };
});

export const UpgradeableERC20Module = buildModule("UpgradeableERC20Module", (builder) => {
  // Get the proxy from the previous module.
  const { proxy ,implementation} = builder.useModule(DeployUUPSModule);

  // Create a contract instance using the deployed proxy's address.
  const instance = builder.contractAt("DemoUUPSV2", proxy);

  return { instance, proxy,implementation };
});

export default UpgradeableERC20Module;