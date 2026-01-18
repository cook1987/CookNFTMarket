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


export default DeployUUPSModule;