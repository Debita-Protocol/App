## Smart Contract Overview
link to whitepaper rough draft 
https://github.com/Debita-Protocol/docs/blob/main/rough_whitepaper.pdf

## Primary Contracts for Tulu
- the main contracts for Tulu are in the folder protocol, bonds, and vault.

### controller.sol
- top-level contract for market cycle => initiateMarket, resolveMarket, denyMarket.
- entry point for utilizers: add proposal
- entry point for validators: approve/deny ZCB market.
- delegates calls to marketManager + Vault + TrustedMarketFactoryV3 for domain-specific logic
#### Mumbai Deployment address: 0x4391d7acba8303740918308b119AAb956d7e6473

### marketmanager.sol
- entry point for market traders: buy/sell long/short ZCB
- manages ZCB market phases + restrictions.
- updates reputation score on market resolution.
##### Mumbai Deployment address: 0x5A6a4CC20047088A2ec5bd4E1F9D09eCD6dd1CC3

### Instrument.sol 
- Instrument contracts that are connect to the vault. Each instrument represents a source of yield from either stretegy or a creditline. All instrument contracts should be inherited from the abstract instrument contract, to allow the vault contract be its owner and deposit/withdraw from it. 

### vault.sol
- entry point for VT LPs
handles trusting/distrusting instruments on market approval/denial.
##### Mumbai Deployment address: 0x3C95067507C0346e40439E46dD9FFce3eF4F264E

### reputationtoken.sol
- records reputation score
##### Mumbai Reputation address: 0x25917226cC1f16F055e20D36e0146905903b7F2F

### TrustedMarketFactoryV3.sol
- legacy code, updates market information to frontend
##### Mumbai Reputation address: 0x0559B2a21d6479b9a03ea835D83895f5aEE47C5f

### bonds/*
- bonding curve contracts => created on market initiation.

## Instrument Cycle Flow Logic 
0. Vault Minting/Verification
- Liquidity Providers should first mint Vault tokens(VT) for the underlying they hold (We only support USDC for now). 
- Vaults follow a ERC4626 standard
- Managers have to verify their address and mint a repuation NFT to prevent sybil attacks and collusion with utilizers. 

1. Proposal
- utilizer calls the  `controller.initiateMarket` function with the parameters from the struct `Vault.InstrumentData`, that includes relevant information such as principal, expected yield/interest, duration, or description for the underlying instrument.
  - This will generate two tokens from the `CurveTypeBondingCurveFactory` contract, one for a longZCB and the other being shortZCB. Each of these tokens are a ERC20 with a bonding curve logic and math for minting/burning. (Minting will direct VT from the trader to the ZCB contract, burning will direct VT from the contract to the trader)
  - Initial Parameters for the bonding curve function are set

2. Assessment 
- Using the MarketManger as an entry point, `marketmanager.buy`,only managers can buy longZCB. Any VT holders call `marketmanager.shortSell` function to speculate/hedge against the instrument. Restrictions for trading are handled via the `marketmanager.canBuy` function. 
  - VT that is used to buy will be directed to the address of the ZCB contracts
 
3. Approval/Denial
- called via `controller.approveMarket` function by the validators when  `marketmanager.marketCondition` returns true, which makes the vault deposit the principal to the underlying instrument. 
- the bonding curve's upper bound and lower bound for circulating supply is set, to gaurantee minimum amount of first loss capital and minimum amount of profit for the vault. 

4. Maturity Handling 
- called via the `controller.resolveMarket`, which burns all existing VT held by the underlying ZCBs. 
- redemption price calculated using the realized yield in the marketmanager
- New VT is minted for redemption. If the realized return for the instrument is positive then minting amount> burning amount and vice versa


