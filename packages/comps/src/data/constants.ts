import abi from "./TrustedMarketFactoryV3.json"

export const TrustedMarketFactoryV3ABI = abi.abi; 
export const TrustedMarketFactoryV3Address = "0xD6D42E84C4127E71eD55eEecdfcBCF24e1c059E4"; 
export const settlementAddress = "0xFD84b7AC1E646580db8c77f1f05F47977fAda692";

export const dsAddress = "0xb21ae1581F747C7913B9d8e3026A949f0cB0221b"
export const lendingPooladdress = "0xC2fcC51189466E37C2127e1A7dac86A14083164f"
export const usdc =  "0x5799bFe361BEea69f808328FF4884DF92f1f66f0";
export const collateral_address = "0x5799bFe361BEea69f808328FF4884DF92f1f66f0";
export const ammFactoryAddress = "0x7fc5F526A8be47f9D6460b26D59532C35bd54931";
export const indexCDSAddress = "0x2c0abcBfB23ffa8994bf603a766a037228ca6C27";
export const deployer_pk = "5505f9ddf81b3aa83661c849fe8d56ea7a02dd3ede636f47296d85a7fc4e3bd6";
export const zeke_test_account = "0x2C7Cb3cB22Ba9B322af60747017acb06deB10933";
export const chefAddress = "0x42a0549a4063378cb96cac64ffb434da1e2817bd";

export const PRICE_PRECISION = 6;

export const Vault_address = "0x3C95067507C0346e40439E46dD9FFce3eF4F264E";

export const RepNFT_address = "0x25917226cC1f16F055e20D36e0146905903b7F2F";
export const sample_instument_address = "0x3667a4FFAbd519960d8E3e4C1d781E3A9Af40e2F"; 
export const marketFactoryAddress = "0x0559B2a21d6479b9a03ea835D83895f5aEE47C5f";

/**
 * used for data fetcher
 */
export const controller_address = "0xf84e3a0E436B92bd043Ca8D70312ff377d814526";
export const market_manager_address = "0xeEa8FD71B0247fC0F1593c262f292f47355E5582";
export const vault_factory_address = "0x6bc797B8332c3F9230174Fd358c114bD6B5431f7";
export const creditLine_address = "0x4be7805A2b35ce177F802D88A01Fecfc686fFB38"; 
export const pool_factory_address = "0x945AA05972C0B62e0f2db13351b269A76B3fe955"; 
export const usdc_address = "0xd6A5640De726a89A54ca724ac12BCc5E89600720"; 
export const weth_address = "0x6219CC8a3E880053ea0A1398f86E226C37603239";
export const reputation_manager_address = "0xd0975E26262337A38cbBEa74CF325bB909320e3a";
export const fetcher_address =  "0x7fC6a69AE37E429EEd606EdDe63E4667f88bBAD5";
export const leverageModule_address = "0xf9c6A04026c30dFC56FdB72A4B8cd00fB922823b";
export const variable_interest_rate_address = "0x541D09035CA76AE5CEA1C6ECDf098A48a8F2FDEe";
export const validator_manager_address = "0xEEDAa78A8d439E151310A13c67A5E5B1766282c4";

export const ORACLE_MAPPING = { // X/USD
    "MATIC" : "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
    "ETH": "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    "DAI": "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046",
    "BTC": "0x007A22900a3B98143368Bd5906f8E17e9867581b",
    "USDC": "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0",
}

// newest
// deploying "LinearCurve" (tx: 0x49c4e25d19cf7f255cc306a577a5cbff426e402fcc2c19d71e5396d07874aa4d)...: deployed at 0xe0C8844e319B89d4Eb207bbe6982CdBb35944397 with 641478 gas
// deploying "Controller" (tx: 0xc9776e982411d7c594241325758b7c4cb93a6215b1bceca5b519bde7fc1d46a9)...: deployed at 0xf84e3a0E436B92bd043Ca8D70312ff377d814526 with 5077771 gas
// deploying "MarketManager" (tx: 0xe056c2c22344680cf19f1a2ecd8651291e4cc7f5d1c6d073b32207af7197f3a1)...: deployed at 0xeEa8FD71B0247fC0F1593c262f292f47355E5582 with 5442271 gas
// deploying "VaultFactory" (tx: 0x7489c6e9f593f48936d1d94428dce98024e27c0325a5822ded882dfd48501ed6)...: deployed at 0x6bc797B8332c3F9230174Fd358c114bD6B5431f7 with 5306859 gas
// reusing "LinearCurve" at 0xe0C8844e319B89d4Eb207bbe6982CdBb35944397
// deploying "Fetcher" (tx: 0xd21e33586fcec82f91c9ea83add27f6a4dd90f184d5ec74063c262b025d844ca)...: deployed at 0x7c0e6fA862482B811F6034d08316b125Ed0Af02B with 3441759 gas
// deploying "ZCBFactory" (tx: 0xf147e6a0d36439efad4e4f13ee0a670237f4d9f399cf457a724cb92189eaa3aa)...: deployed at 0x57298046364259c7D1f1Fbe64b512617474B5801 with 1076564 gas
// deploying "SyntheticZCBPoolFactory" (tx: 0x41cbd1d9e21d95964d36278f2f117f9645c886c4a6cb833add585300650d7f8d)...: deployed at 0x945AA05972C0B62e0f2db13351b269A76B3fe955 with 5302676 gas
// deploying "ReputationManager" (tx: 0x43ae1598c8e560d4e3ad1c32484534f20f783b5012d74c7981ac1c64f270ddf9)...: deployed at 0xd0975E26262337A38cbBEa74CF325bB909320e3a with 1653961 gas
// deploying "ValidatorManager" (tx: 0xb0a9c53013e5477294326d855cbe487c9fc8fcd1071afcf766192abe37cad1c6)...: deployed at 0xEEDAa78A8d439E151310A13c67A5E5B1766282c4 with 2263431 gas