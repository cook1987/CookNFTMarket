# 本项目是使用 Hardhat 框架开发一个 NFT 拍卖市场。
## 目录结构
-contracts  # 合约目录
 -ntf   # NFT 合约目录
  -CookNTF.sol  # 使用 ERC721 标准实现一个 NFT 合约，支持 NFT 的铸造和转移。
 -pricefeed # 预言机目录
  -MockCookTokenV3Aggregator.sol    # 基于 Chainlink 实现的自定义预言机，用以返回 自定义 ERC20代币的价格。
  -PriceConsumerV3.sol  # feedData 预言机集合，可以注册多个代币的预言机。
 -token # ERC20代币目录
  -CookToken.sol    # 基于 ERC20代币 实现的代币
 -CookNFTMarketplace.sol    # NFT 拍卖市场，使用基于 openzeppelin 的透明代理模式实现合约升级。
-ignition   # 使用 ignition 部署脚本
-test   # 测试脚本

## 手动测试方法
第一步：使用账号：0x5B38Da6a701c568545dCfcB03FcB875f56beddC4，部署合约 CookToken，参数：1000，返回合约地址：0xf2B1114C644cBb3fF63Bf1dD284c8Cd716e95BE9

第二部：部署合约 MockCookTokenV3Aggregator，参数：8,"Cook Token's USD price’ ",4，返回合约地址：0xB9e2A2008d3A58adD8CC1cE9c15BF6D4bB9C6d72

第三部：部署合约 PriceConsumerV3，返回合约地址：0x56a2777e796eF23399e9E1d791E1A0410a75E31b

第四部：调用合约 PriceConsumerV3 方法 setPriceFeed("CTK",  MockCookTokenV3Aggregator 合约地址 )

第五步：部署合约 CookNFT，返回合约地址：0x8059B0AE35c113137694Ba15b2C3585aE77Bb8E9

第六步：部署合约 CookNFTMarketplace 参数 0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C，PriceConsumerV3 合约地址，返回合约地址：0x86cA07C6D491Ad7A535c26c5e35442f3e26e8497

第七部：调用合约 CookNFT 方法三次 mint( uri) 记录 返回值
https://baike.baidu.com/tashuo/browse/content?id=7d03a8b895a000beecd7a8d3   		1
https://www.thepaper.cn/newsDetail_forward_32367399			2
https://baijiahao.baidu.com/s?id=1853906347519060568&wfr=spider&for=pc       3

第7.1步：调用合约 CookNFT 方法 approve(CookNFTMarketplace 合约地址，1)

第八步：调用合约 CookNFTMarketplace 方法 createAuction(
        address nftContract,   //  CookNFT合约地址
        uint256 tokenId,    // 第七步返回值
        uint256 startPrice,     // 2
        uint256 durationHours  // 1
    )，记录返回值

第9步：使用账号：0x5B38Da6a701c568545dCfcB03FcB875f56beddC4，调用合约 CookToken，方法：transfer(0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2, 10)
             使用账号：0x5B38Da6a701c568545dCfcB03FcB875f56beddC4，调用合约 CookToken，方法：transfer(0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db, 20)
	     使用账号：0x5B38Da6a701c568545dCfcB03FcB875f56beddC4，调用合约 CookToken，方法：transfer(0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB, 30)


第10步：使用账号：0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2，调用合约 CookToken，方法：approve(CookNFTMarketplace 合约地址, 5)
		使用账号：0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db，调用合约 CookToken，方法：approve(CookNFTMarketplace 合约地址, 15)
		使用账号：0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB，调用合约 CookToken，方法：approve(CookNFTMarketplace 合约地址, 25)

第11步：使用账号：0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2，调用合约 CookNFTMarketplace，方法：placeBid(第八步返回值,  CookToken合约地址，4)
		使用账号：0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db，调用合约 CookNFTMarketplace，方法：placeBid(第八步返回值,  CookToken合约地址，14)
		使用账号：0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB，调用合约 CookNFTMarketplace，方法：placeBid(第八步返回值,  CookToken合约地址,  24)

第12步：使用账号：0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2，调用合约 CookNFTMarketplace，方法：withdrawBid(第八步返回值,  CookToken合约地址)
		使用账号：0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db，调用合约 CookNFTMarketplace，方法：withdrawBid(第八步返回值,  CookToken合约地址)
		使用账号：0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB，调用合约 CookNFTMarketplace，方法：withdrawBid(第八步返回值,  CookToken合约地址)

第13步：使用账号：0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2，调用合约 CookNFTMarketplace，方法：endAuction(第八步返回值)

第14步：使用账号：0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2，调用合约 CookNFT，方法：balanceOf(0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2), 验证：返回0
		使用账号：0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db，调用合约 CookNFT，方法：balanceOf(0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2), 验证：返回0
		使用账号：0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB，调用合约 CookNFT，方法：balanceOf(0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2), 验证：返回1


