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
export const controller_address = "0x45537e41cef044b1ED489A55490717B23612891A";
export const market_manager_address = "0xC23306778fD55FAD3DDA0c2256567693B79584e9";
export const vault_factory_address = "0xE701Fff9159d51F5D42521df5d1baF075fee7DE4";
export const creditLine_address = "0x4be7805A2b35ce177F802D88A01Fecfc686fFB38"; 
export const pool_factory_address = "0x23B728884D56b3562F399128C6Eb1c622b67B581"; 
export const usdc_address = "0xd6A5640De726a89A54ca724ac12BCc5E89600720"; 
export const weth_address = "0x6219CC8a3E880053ea0A1398f86E226C37603239";
export const reputation_manager_address = "0x88Eb71Bb9cd9997c4815eFC704Aa3Ee09d4F0F53";
export const fetcher_address =  "0x01c8E1DE7A03264685b62ed74d7DDaC169d2a3e7";
export const leverageModule_address = "0xf9c6A04026c30dFC56FdB72A4B8cd00fB922823b";
export const variable_interest_rate_address = "0x541D09035CA76AE5CEA1C6ECDf098A48a8F2FDEe";
export const validator_manager_address = "0x8C73fB98088e5109F021C553f1c9a43c29F03337";

export const ORACLE_MAPPING = { // X/USD
    "MATIC" : "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
    "ETH": "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    "DAI": "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046",
    "BTC": "0x007A22900a3B98143368Bd5906f8E17e9867581b",
    "USDC": "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0",
}

// // newest
// deploying "LinearCurve" (tx: 0x6559e73a0e8956f27556cab100c82fbe457ef19f1fee8ab69935fa5cac39e408)...: deployed at 0x881d7b5CB21dc6e073C0157A75968FA15b8f32D1 with 641466 gas
// deploying "Controller" (tx: 0xa8cc0505faa32fd87abda961b8baa282460cf3daaad69a0d700aba6bb83325d7)...: deployed at 0x45537e41cef044b1ED489A55490717B23612891A with 5380851 gas
// deploying "MarketManager" (tx: 0x495bbaf42b621f47d11521fda2b298a85c0d9078b531a4f89c76cdd55a7fe177)...: deployed at 0xC23306778fD55FAD3DDA0c2256567693B79584e9 with 4787518 gas
// deploying "VaultFactory" (tx: 0x6bbf2e123399f0ef1d27eb213999e841fe83a677df58aef270b84e0803cffdd4)...: deployed at 0xE701Fff9159d51F5D42521df5d1baF075fee7DE4 with 5324778 gas
// reusing "LinearCurve" at 0x881d7b5CB21dc6e073C0157A75968FA15b8f32D1
// deploying "Fetcher" (tx: 0xbd051b97f3280f697fdff56ea902da672b44eaf4f3479fab7a79142988d4163d)...: deployed at 0x4ae0d04Df06793E6d638fb2FfE5151D14087EF08 with 4088733 gas
// deploying "ZCBFactory" (tx: 0x768d84eb71b8d1c0254f1c1848f75a8d02dd4cedd850acaf80af856e364dcdbc)...: deployed at 0x8F9fd150452eA8771ddFe450fDCE674a8CA68b7b with 1076564 gas
// deploying "SyntheticZCBPoolFactory" (tx: 0x491eae75a2adc1f74a6c9f4ae4399cf2ecdbf5012b1324f13e24bef9a6f5de0d)...: deployed at 0x23B728884D56b3562F399128C6Eb1c622b67B581 with 5302676 gas
// deploying "ReputationManager" (tx: 0x8ad87086e195027a1bef27eb3a5050137221b00e0d75127b10c29c28ccebe8e4)...: deployed at 0x88Eb71Bb9cd9997c4815eFC704Aa3Ee09d4F0F53 with 1692462 gas
// deploying "ValidatorManager" (tx: 0x534c4a9c987eb07dcad6d55edfa2d0985a83ddbe0cfb130d21dcf964ba12dfa5)...: deployed at 0x8C73fB98088e5109F021C553f1c9a43c29F03337 with 2263431 gas