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
export const controller_address = "0x8d94D9b628A7232Df1cD9F81c4ADaE72e6832185";
export const market_manager_address = "0x57DC32F90f722c58bdf4203bc848Ace6A26D2aF0";
export const vault_factory_address = "0xB35dfDa623929718839A8D3d89f5454aF1Da39C3";
export const creditLine_address = "0x4be7805A2b35ce177F802D88A01Fecfc686fFB38"; 
export const pool_factory_address = "0xAB5b7A6122a97B25658e4Da7Ab805ED190fC6284"; 
export const usdc_address = "0xd6A5640De726a89A54ca724ac12BCc5E89600720"; 
export const weth_address = "0x6219CC8a3E880053ea0A1398f86E226C37603239";
export const reputation_manager_address = "0x7b77eBEF87dce72D8c0dC8cff25a5c207D1414B5";
export const fetcher_address =  "0x7fC6a69AE37E429EEd606EdDe63E4667f88bBAD5";
export const leverageModule_address = "0xf9c6A04026c30dFC56FdB72A4B8cd00fB922823b";
export const variable_interest_rate_address = "0x541D09035CA76AE5CEA1C6ECDf098A48a8F2FDEe";
export const validator_manager_address = "0x4DD84762180d8AC6A7AaB3Af53e475e135CCCaC2";

export const ORACLE_MAPPING = { // X/USD
    "MATIC" : "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
    "ETH": "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    "DAI": "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046",
    "BTC": "0x007A22900a3B98143368Bd5906f8E17e9867581b",
    "USDC": "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0",
}

// newest
// deploying "LinearCurve" (tx: 0x6112b4d9cb2d7f2e12b2c76b7e70d10044a3d1138c6c1af67ffa7e3347913ae7)...: deployed at 0x12fef947988B2dAD92aE1bfaa4BC993D7EDDD88a with 641478 gas
// deploying "Controller" (tx: 0xb71b0e43830a68e7a0372393c85e08223cf5cdc96a97024db512b1b71d8282c7)...: deployed at 0x8d94D9b628A7232Df1cD9F81c4ADaE72e6832185 with 5042651 gas
// deploying "MarketManager" (tx: 0xbebfcb5102d2b6093ecceaa919ba4131a4ad697ad3854054e5215a84ce6f8b0e)...: deployed at 0x57DC32F90f722c58bdf4203bc848Ace6A26D2aF0 with 5442271 gas
// deploying "VaultFactory" (tx: 0xd3495e7b78c0b1dbd4656481adf0554b205b9afb99cc8f0fb04d3f4363737134)...: deployed at 0xB35dfDa623929718839A8D3d89f5454aF1Da39C3 with 5306859 gas
// deploying "ZCBFactory" (tx: 0xcd01bd9e60879f712460ac61d32ebcd9659177859b1ce0571122dde860fef63e)...: deployed at 0xdFC4706BB6e6AAa4CE31157e763F6019a515D5C4 with 1076564 gas
// deploying "SyntheticZCBPoolFactory" (tx: 0x4e32f0845723f2c201b7d7792c403ad908222158a146625740c9c9ab32804a18)...: deployed at 0xAB5b7A6122a97B25658e4Da7Ab805ED190fC6284 with 5302676 gas
// deploying "ReputationManager" (tx: 0x0ccd67bfffcedf7a3d47f483d59bf4ae6274a5922c514a74a37f344328440eba)...: deployed at 0x7b77eBEF87dce72D8c0dC8cff25a5c207D1414B5 with 1653961 gas
// deploying "ValidatorManager" (tx: 0x976d97ead0f48da9768fad07946fce32b6ae2b5dbae8cd78b240fd0a0201dcdc)...: deployed at 0x4DD84762180d8AC6A7AaB3Af53e475e135CCCaC2 with 2263431 gas
//deploying "Fetcher" (tx: 0x498af0877c42e4fd88e1eb756d80e540143ae494c90e1fe8ed2447aed0394af1)...: deployed at 0x8243F01d099B4f62789F3EcBE0c0F401972A873E with 3401584 gas