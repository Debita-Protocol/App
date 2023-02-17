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
export const controller_address = "0x649Ce23C61A89556D0F88E3924f9Dfcb02750AcC";
export const market_manager_address = "0x0a4b0c1aDa916F4Fbb85eCF816d486A88d6283d8";
export const vault_factory_address = "0x10899462fb6Cdee382029073e5E905E23c13d547";
export const creditLine_address = "0x4be7805A2b35ce177F802D88A01Fecfc686fFB38"; 
export const pool_factory_address = "0xD279cEE385415C922a31b5d04caf20B9F76c4883"; 
export const usdc_address = "0xd6A5640De726a89A54ca724ac12BCc5E89600720"; 
export const weth_address = "0x6219CC8a3E880053ea0A1398f86E226C37603239";
export const reputation_manager_address = "0x5199DB59A18bC10c27e905345C2a93f7e872D183";
export const fetcher_address =  "0xedbB416B6F8347f35a0372fbE49717dd4a7F95ec";
export const leverageModule_address = "0xf9c6A04026c30dFC56FdB72A4B8cd00fB922823b";
export const leverage_manager_address = "0x77503E2500D92Bd9579E3a103f6a6B86dd8C7291";
export const variable_interest_rate_address = "0x541D09035CA76AE5CEA1C6ECDf098A48a8F2FDEe";
export const validator_manager_address = "0xD575CC80A1315858DeBAB1A5cE82aaD42Be6f940";
export const storage_handler_address = "0x040501D15eA891185Aa989E9663b18b0a0FBFE32";
export const order_manager_address = "0x6CA839f9528FA49bd7B257bD91259F90E84A7d77";

export const ORACLE_MAPPING = { // X/USD
    "MATIC" : "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
    "ETH": "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    "DAI": "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046",
    "BTC": "0x007A22900a3B98143368Bd5906f8E17e9867581b",
    "USDC": "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0",
}

// // newest
// deploying "LinearCurve" (tx: 0x24c44ddb627ec812fdbc69c482c11ef46525c052945066e1ee2456e6158e72ed)...: deployed at 0x7D97EeC72C047CbEAf5f27A18B5be2e50b1720b5 with 641466 gas
// deploying "Controller" (tx: 0x7d34516e84499a809748931ca93d764d5c06b7d0c5cf29d60af187a14c92a4b3)...: deployed at 0x649Ce23C61A89556D0F88E3924f9Dfcb02750AcC with 5381778 gas
// deploying "PerpTranchePricer" (tx: 0x28b66bbaf02474ae1662313257e8d047125cf298d0e68b0ad90a3511bb15591e)...: deployed at 0x1080686ebE76e688Ee07b30f37715C0fEdd4499F with 447790 gas
// deploying "StorageHandler" (tx: 0x6aa26f4352f3b76ad0037eafcbcabef0ace8cd4da3dac754de72eab271aa9938)...: deployed at 0x040501D15eA891185Aa989E9663b18b0a0FBFE32 with 1691949 gas
// deploying "MarketManager" (tx: 0x9ebf42f3f8d597bf76603a7bfd3937732c0ae2abc9eb69c35fe84809b7cdcde9)...: deployed at 0x0a4b0c1aDa916F4Fbb85eCF816d486A88d6283d8 with 5098518 gas
// deploying "VaultFactory" (tx: 0x5b3ef1e9fe769f4115a474ce3f950854e82d8db8433d8bff405bcf46a1192bb4)...: deployed at 0x10899462fb6Cdee382029073e5E905E23c13d547 with 4962616 gas
// reusing "LinearCurve" at 0x7D97EeC72C047CbEAf5f27A18B5be2e50b1720b5
// deploying "Fetcher" (tx: 0x0b3ec475969a40879ab844bb66a643884d287a9c57ce8f611b5c6561b43f695c)...: deployed at 0xedbB416B6F8347f35a0372fbE49717dd4a7F95ec with 3882410 gas
// deploying "ZCBFactory" (tx: 0x3ee7f082d35217c56f867b5bc1dc6fa1bb865ee91096bfb4008aad3724de9aff)...: deployed at 0x63030997276ac78bbafA938089cF699DF549eF08 with 1076540 gas
// deploying "LinearPiecewiseCurve" (tx: 0x850677e0bf254ee52c6dd69d74d066c03fe760c6d6c2f8b556f985e972ed19d5)...: deployed at 0x8A88b3D2ce9FFf5CcB33397af3cCaf0C25449473 with 630629 gas
// deploying "SyntheticZCBPoolFactory" (tx: 0x0e12db2b2a5068a2c26a4e9542579690d27db55c0dceeeaa696b788bfb0518ba)...: deployed at 0xD279cEE385415C922a31b5d04caf20B9F76c4883 with 1625836 gas
// deploying "ReputationManager" (tx: 0x4c083bb2cf4947c859192e8d8c30d5734717ae3d5da196431d49aa87ebda7c2c)...: deployed at 0x5199DB59A18bC10c27e905345C2a93f7e872D183 with 1742550 gas
// deploying "LeverageManager" (tx: 0x7cd90a17b6ffa6bc7895195e74dc7177d02d300f62d3f44cbd758156386e0b55)...: deployed at 0x77503E2500D92Bd9579E3a103f6a6B86dd8C7291 with 4393987 gas
// deploying "ValidatorManager" (tx: 0xda38cd7133ddefebda117d43634e77763e3f4e190d1d305f24b847538acdc0f3)...: deployed at 0xD575CC80A1315858DeBAB1A5cE82aaD42Be6f940 with 2295596 gas
// deploying "OrderManager" (tx: 0x45c25f7ab79785c50808aafed4704f335e6ffb511a83c8d774dbac98748932d4)...: deployed at 0x6CA839f9528FA49bd7B257bD91259F90E84A7d77 with 1162085 gas
