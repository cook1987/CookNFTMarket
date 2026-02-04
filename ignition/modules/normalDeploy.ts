import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CounterModule", (m) => {
  const owner = m.getAccount(0);
  const priceConsumerV3 = m.contract("PriceConsumerV3");
  const cookNFT = m.contract("CookNFT");
  const cookNFTMarketplace = m.contract("CookNFTMarketplace", [owner, priceConsumerV3]);
  const mockCookTokenV3Aggregator = m.contract("MockCookTokenV3Aggregator", [8n,"Cook Token's USD price",1n]);
  const cookToken = m.contract("CookToken", [10000n]);

  m.call(priceConsumerV3, "setPriceFeed",[cookToken, mockCookTokenV3Aggregator]);

  return { cookNFTMarketplace, cookNFT, priceConsumerV3, cookToken, mockCookTokenV3Aggregator };
});
