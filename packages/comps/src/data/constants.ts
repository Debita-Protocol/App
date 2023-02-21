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
export const controller_address = "0xEad58e9Fd8D2B62A1bfdeEC254560F0a430061B6";
export const market_manager_address = "0x2d56DDE8442860859f8D61421F1a41548bc2832c";
export const vault_factory_address = "0x6d90f8899240ee10b7D6E1e5f8df70d8ac38928A";
export const creditLine_address = "0x4be7805A2b35ce177F802D88A01Fecfc686fFB38"; 
export const pool_factory_address = "0xD4aE39D97c314c6DFca696a15c48570c414Fa144"; 
export const usdc_address = "0xd6A5640De726a89A54ca724ac12BCc5E89600720"; 
export const weth_address = "0x6219CC8a3E880053ea0A1398f86E226C37603239";
export const reputation_manager_address = "0x9141ee2b3Be8239DB01421939996aD255f707998";
export const fetcher_address =  "0x856Ca1965BED15aAcD4CEa7E4924E3299064Ca59";
export const leverageModule_address = "0xf9c6A04026c30dFC56FdB72A4B8cd00fB922823b";
export const leverage_manager_address = "0xb3dB065B0D8d48bF12634e167e3b0712d0d98028";
export const variable_interest_rate_address = "0x541D09035CA76AE5CEA1C6ECDf098A48a8F2FDEe";
export const validator_manager_address = "0x50009e68EdCf6A1D25fA7c8F590b7dd49Fe97897";
export const storage_handler_address = "0x8f561ef850f80c910BE0C2622e563CE817e94655";
export const order_manager_address = "0x061dc5b51301031D941353baD3cEA3a046e2B8ff";

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
// deploying "LinearCurve" (tx: 0x4af12f17db2db90463205876371dd60e8e4063cb49bab30964f275d193ebb537)...: deployed at 0x9d5aB5EDE669115195C75c543cfCb523B41e1Ce8 with 641478 gas
// deploying "Controller" (tx: 0xf97982741d2b4251935658b6556eb9fd72123f3bcfa55fd9fbd32b47c8bf0b79)...: deployed at 0xEad58e9Fd8D2B62A1bfdeEC254560F0a430061B6 with 5337792 gas
// deploying "PerpTranchePricer" (tx: 0x9bd64b179989d83f017eefba889f4b47d5a6c94f16c164ccb6fad805d9af76cb)...: deployed at 0x1a3b979A3E28e6bde9FC99C583D7EF48406094eA with 650724 gas
// deploying "StorageHandler" (tx: 0x7e7face5e90256a314b1a84de2c34a0707bf3fba8359e8d037465a71f7129f73)...: deployed at 0x8f561ef850f80c910BE0C2622e563CE817e94655 with 2153028 gas
// deploying "MarketManager" (tx: 0x52864aed4fc5e80318a4cf6d4ef2d0ab7439a1385b05e85729c560d6a4d7b7c6)...: deployed at 0x2d56DDE8442860859f8D61421F1a41548bc2832c with 5364880 gas
// deploying "VaultFactory" (tx: 0x54a0a48d82b29c2a9f0a41f5656df86717996d2266ee5f5abb9ab5552f66e4fc)...: deployed at 0x6d90f8899240ee10b7D6E1e5f8df70d8ac38928A with 4987443 gas
// reusing "LinearCurve" at 0x9d5aB5EDE669115195C75c543cfCb523B41e1Ce8
// deploying "Fetcher" (tx: 0x249a1c09462e71f9d58a6dcb4e8528023cb284627fc483784cdacf56e084ce75)...: deployed at 0x1D1FADEf6bE09853FF2cBC3191dA7aEea606A310 with 3881186 gas
// deploying "ZCBFactory" (tx: 0xb8dfd0a234d74e3f401d4f794aa78afa2ffd85332c53f58902f532d9c72b6148)...: deployed at 0xd87d1d4B247Cd5637Cce675cF61d191a15046434 with 1076564 gas
// deploying "LinearPiecewiseCurve" (tx: 0x4495182fb0dd1d6632af43ec7d7ec54961c55eed99785f76dfbf8aac48f49cb9)...: deployed at 0xEb0d7E84B436B02359F07f0E8bd230391a8668D7 with 660514 gas
// deploying "SyntheticZCBPoolFactory" (tx: 0x5e61917bb3bccbfdf1b68e0f0f7c041c378bfd55ef3456b9adfe1e23e3378b67)...: deployed at 0xD4aE39D97c314c6DFca696a15c48570c414Fa144 with 1770270 gas
// deploying "ReputationManager" (tx: 0x3af901434513a21517a14b7b534947dbcfc34f2b41e2e4524588873cbec32b4c)...: deployed at 0x9141ee2b3Be8239DB01421939996aD255f707998 with 1742538 gas
// deploying "LeverageManager" (tx: 0xa4bc842ee0ba9d49e338eba411f2b8b57d450e0d6765e1f6349470c0aa20b334)...: deployed at 0xb3dB065B0D8d48bF12634e167e3b0712d0d98028 with 4393975 gas
// deploying "ValidatorManager" (tx: 0xd0580fc16a5c23e081fe8351084a197036ea4349ac1b3ebb64f61cbd7e0e52ad)...: deployed at 0x50009e68EdCf6A1D25fA7c8F590b7dd49Fe97897 with 2295584 gas
// deploying "OrderManager" (tx: 0x315083369e6d76e315c468873f18316e6a077d2c1b78fb7ecc912469dfe54876)...: deployed at 0x061dc5b51301031D941353baD3cEA3a046e2B8ff with 1162061 gas
