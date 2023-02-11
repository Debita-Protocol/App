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
export const controller_address = "0x3405cB798B5362B258e8cf4A64A5205A8915125F";
export const market_manager_address = "0x1f7cd885d5B45bbd81fEb1094f1411D884B018C4";
export const vault_factory_address = "0x0Db65CE1a09a866820436AB9b978251eEf12b2c6";
export const creditLine_address = "0x4be7805A2b35ce177F802D88A01Fecfc686fFB38"; 
export const pool_factory_address = "0xDdF36F34dDD4d048d5f4e1d9dDfFc9a5510a3782"; 
export const usdc_address = "0xd6A5640De726a89A54ca724ac12BCc5E89600720"; 
export const weth_address = "0x6219CC8a3E880053ea0A1398f86E226C37603239";
export const reputation_manager_address = "0x77C844C8E1d2D398f62373E8D90bBd6c13526652";
export const fetcher_address =  "0xB8FeabF8Fd9a1bC25086E1eba4BC811818cf7d85";
export const leverageModule_address = "0xf9c6A04026c30dFC56FdB72A4B8cd00fB922823b";
export const leverage_manager_address = "0x1E90401Be8ed4A5797Ad59DEb65D8A98bB5Eb580";
export const variable_interest_rate_address = "0x541D09035CA76AE5CEA1C6ECDf098A48a8F2FDEe";
export const validator_manager_address = "0xCaa256479AF9e7fEF3bc8Dc9283b41AB6BFeBe42";
export const storage_handler_address = "0x0610928938571D0F6314aC952B790D8f2d7A280e";
export const order_manager_address = "0xF30C0790A6f9Df46ac272327766bc64e0E2Bd210";

export const ORACLE_MAPPING = { // X/USD
    "MATIC" : "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
    "ETH": "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    "DAI": "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046",
    "BTC": "0x007A22900a3B98143368Bd5906f8E17e9867581b",
    "USDC": "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0",
}

// // newest
// deploying "LinearCurve" (tx: 0xb744148e2a84610369ab84505a66458ba7655d07c112ae45cf813d186f0cabcf)...: deployed at 0xE44DdA46BFfafC219722A72f1439A5FB7dC57602 with 641478 gas
// deploying "Controller" (tx: 0xe1d3820c2a73b4af1c76602810f6f947c4e016a7e99330b7898c8c02fb961b2e)...: deployed at 0x3405cB798B5362B258e8cf4A64A5205A8915125F with 5331879 gas
// deploying "PerpTranchePricer" (tx: 0xe6995653dd7d94e9c400aa28b850fafce5c0bcf8c7d795a6b10967bcb7ae10aa)...: deployed at 0x764B9CC646AbE1e700CCEDc1e1D96d0437d6C87b with 447790 gas
// deploying "StorageHandler" (tx: 0x3a9721025b05e336f22a05fdf51491d4fa978a9f5f2e2c27a267347d49448dcc)...: deployed at 0x0610928938571D0F6314aC952B790D8f2d7A280e with 1691949 gas
// deploying "MarketManager" (tx: 0x05d52578813ae47eeb5b73e72a8fe6c19ffea8f8afc15d946be049310378926c)...: deployed at 0x1f7cd885d5B45bbd81fEb1094f1411D884B018C4 with 5100603 gas
// deploying "VaultFactory" (tx: 0x170102ff4817ceb2d7ac3fe0f318d946376ef1a2a5b66e5823a108f1d376abe6)...: deployed at 0x0Db65CE1a09a866820436AB9b978251eEf12b2c6 with 4910115 gas
// reusing "LinearCurve" at 0xE44DdA46BFfafC219722A72f1439A5FB7dC57602
// deploying "Fetcher" (tx: 0x69e7788b1c044d7a588306aae0be798590709904b9fa585b5ed25ad60648e67e)...: deployed at 0xB8FeabF8Fd9a1bC25086E1eba4BC811818cf7d85 with 4135319 gas
// deploying "ZCBFactory" (tx: 0xe87dbd61504d774bb8aabf6964a9e67b0e9f910a40350ce3cab139260240753b)...: deployed at 0x67Ea7E8D21334bA68419f0aa198556A0d88f0Bea with 1076564 gas
// deploying "LinearPiecewiseCurve" (tx: 0x726059ddf315852e04cbdf3107172737a40465a6a81780d570f501a81d06b0ad)...: deployed at 0x274E6F838060Cab86a9bA39a564EC06411A0A5cc with 630629 gas
// deploying "SyntheticZCBPoolFactory" (tx: 0xb63213bea5a4fc8b1de2177175c81868eefd8b082af6b9ae91cfa0c201bb22b1)...: deployed at 0xDdF36F34dDD4d048d5f4e1d9dDfFc9a5510a3782 with 1652432 gas
// deploying "ReputationManager" (tx: 0x7631a49bae328ae0d81a1b9625b1960d1e87333c49b9bcaf91648a6f7a0032da)...: deployed at 0x77C844C8E1d2D398f62373E8D90bBd6c13526652 with 1742550 gas
// deploying "LeverageManager" (tx: 0x9e6ee71d4ccb90c10da759bd4920bde3fabb60f7f573cb3640a51fe2d1d405ff)...: deployed at 0x1E90401Be8ed4A5797Ad59DEb65D8A98bB5Eb580 with 4301338 gas
// deploying "ValidatorManager" (tx: 0x07f6d35b078a0330548310c7ed33ad5fd580cc40efe73853607d833462d6b172)...: deployed at 0xCaa256479AF9e7fEF3bc8Dc9283b41AB6BFeBe42 with 2263431 gas
// deploying "OrderManager" (tx: 0xbea03df3579fedbf7a519353b053343cf5e3702be2dbcb798e3be803c2e173c0)...: deployed at 0xF30C0790A6f9Df46ac272327766bc64e0E2Bd210 with 1162085 gas