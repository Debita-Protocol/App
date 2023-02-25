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
export const controller_address = "0x3F7c97f46B18C844B38275bd42F3CaF8e09C8b39";
export const market_manager_address = "0xe2c48198979c9DC363A908F5A7cA28225DD6b002";
export const vault_factory_address = "0x43e93b674EA82Ce08e1729ab67cbF16566dF4D89";
export const creditLine_address = "0x4be7805A2b35ce177F802D88A01Fecfc686fFB38"; 
export const pool_factory_address = "0x22f1d3F9f9871d59d65c3E14e6a61c1D44f6AF46"; 
export const usdc_address = "0xd6A5640De726a89A54ca724ac12BCc5E89600720"; 
export const weth_address = "0x6219CC8a3E880053ea0A1398f86E226C37603239";
export const reputation_manager_address = "0x8be9269da60EC8691d3fB1F7AC8Fd2cAfF7C5B8a";
export const fetcher_address =  "0x856Ca1965BED15aAcD4CEa7E4924E3299064Ca59";
export const leverageModule_address = "0xf9c6A04026c30dFC56FdB72A4B8cd00fB922823b";
export const leverage_manager_address = "0xA7cB4120Da8c54e139A6C50e731d76D84B78d35A";
export const variable_interest_rate_address = "0x541D09035CA76AE5CEA1C6ECDf098A48a8F2FDEe";
export const validator_manager_address = "0x4CFbBf4F4B52b6241D4EDBB9E4e7bC0D2Bd6Ed22";
export const storage_handler_address = "0x58616DB907767821d8EDE7dC0161F17f91edE03e";
export const order_manager_address = "0xAfAdF36C704A65e44715C9adb163FA6dFCE15153";

export const cash_1 = "0xF44d295fC46cc72f8A2b7d91F57e32949dD6B249";
export const nft_1 = "0x8b8f72a08780CB4deA2179d049472d57eB3Fe9e6";

export const ORACLE_MAPPING = { // X/USD
    "MATIC" : "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
    "ETH": "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    "DAI": "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046",
    "BTC": "0x007A22900a3B98143368Bd5906f8E17e9867581b",
    "USDC": "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0",
}

// newest
// deploying "LinearCurve" (tx: 0x8c6f6820e28b982ea11399bbfee5295eb04480ebd42a6780a130027bc9b04981)...: deployed at 0xF275fB203faC62d7A601df34f45374c41EB14D42 with 641478 gas
// deploying "Controller" (tx: 0x046af21c26a4cca9e6332a72ea656201ca61b63a1d5be52e504f0715da2dd9a4)...: deployed at 0x3F7c97f46B18C844B38275bd42F3CaF8e09C8b39 with 5149799 gas
// deploying "PerpTranchePricer" (tx: 0xa0792cd5552ace861f08db826ef37923c0f8497ef32f2b5f0acd06f08067a4b8)...: deployed at 0xe9D855b2902893839e56EF2BD817bB6a602C1D99 with 650736 gas
// deploying "StorageHandler" (tx: 0xd34ed2f2a082d9ff56845413c5ea6d7a9935c03269aea807d4e28d48503fc492)...: deployed at 0x58616DB907767821d8EDE7dC0161F17f91edE03e with 2153028 gas
// deploying "MarketManager" (tx: 0xc493e729669a9e319a9c69b202f31dba9f87668696a9974c43341201720dfc89)...: deployed at 0xe2c48198979c9DC363A908F5A7cA28225DD6b002 with 5364892 gas
// deploying "VaultFactory" (tx: 0x9109ab004569aeb8862fbfb0be8ae199373a84b4e3af99b52afa84bf05b8f969)...: deployed at 0x43e93b674EA82Ce08e1729ab67cbF16566dF4D89 with 4987479 gas
// reusing "LinearCurve" at 0xF275fB203faC62d7A601df34f45374c41EB14D42
// deploying "Fetcher" (tx: 0x66e7880638d5ded326a92a2c44ce50c10f14eaaf19435f7ae4db50f00c1cf535)...: deployed at 0xF3b38c0676A3ceE1A8022DB10F13ee8172878738 with 3881186 gas
// deploying "ZCBFactory" (tx: 0x103fa58cfb6516c497c4d1d7a38ac4c333ff2794aa78ea1bebe5933f6b87845d)...: deployed at 0x55891c58381286a3E1ff5bfB998BBf52B58F54dB with 1076564 gas
// deploying "LinearPiecewiseCurve" (tx: 0x9dd87f013b69948ca2cd3551e37d62c610a200bd61b1b2ee59e09622c8b5c7bf)...: deployed at 0x6433B92FFBd9491476f1C0e677E3e574a403d986 with 660514 gas
// deploying "SyntheticZCBPoolFactory" (tx: 0x5ef18548287ce75b69a047d0c3daea05800ebcc2ebb520e47bb7f59ab6a14b03)...: deployed at 0x22f1d3F9f9871d59d65c3E14e6a61c1D44f6AF46 with 1770270 gas
// deploying "ReputationManager" (tx: 0x506c9c35a710740d83f6fa1e2831a6920eabde3914b70a68ba5779fd3b6930cc)...: deployed at 0x8be9269da60EC8691d3fB1F7AC8Fd2cAfF7C5B8a with 1742550 gas
// deploying "LeverageManager" (tx: 0x8ccb1208f03d6831b93efad086912802201baa838f1e646e2446fb34ff7ff22a)...: deployed at 0xA7cB4120Da8c54e139A6C50e731d76D84B78d35A with 4393987 gas
// deploying "ValidatorManager" (tx: 0x62825505cbadfba41328cc99685fd21928e81727f605a92675085b37aedf54f1)...: deployed at 0x4CFbBf4F4B52b6241D4EDBB9E4e7bC0D2Bd6Ed22 with 2295596 gas
// deploying "OrderManager" (tx: 0x2c7b8c38ef074f5def887cce8796cbf071a00d96fab35408d0e11fef72f09e53)...: deployed at 0xAfAdF36C704A65e44715C9adb163FA6dFCE15153 with 1162085 gas