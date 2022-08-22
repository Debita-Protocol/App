## Smart Contract Overview

### controller.sol
entry point for utilizers: add proposal
entry point for validators: approve/deny ZCB market.
top-level contract for market cycle => initiateMarket, resolveMarket, denyMarket.
delegates calls to marketManager + Vault + TrustedMarketFactoryV3 for domain-specific logic

### marketmanager.sol
entry point for market traders: buy/sell long/short ZCB
manages ZCB market phases + restrictions.
updates reputation score on market resolution.

### vault.sol
entry point for VT LPs
handles trusting/distrusting instruments on market approval/denial.

### reputationtoken.sol
records reputation score

### TrustedMarketFactoryV3.sol
legacy code, updates market information to frontend

### bonds/*
bonding curve contracts => created on market initiation.