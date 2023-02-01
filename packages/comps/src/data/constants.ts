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
export const controller_address = "0x8F8a9d52CB27860F1655abBFfd24A51675C6d2C0";
export const market_manager_address = "0xBc6Ae8fDb436A00FEe62DbC7C344ddA767af010A";
export const vault_factory_address = "0x9ABaCB3F5132b634Ed9F5D29944E1825DfeA3463";
export const creditLine_address = "0x4be7805A2b35ce177F802D88A01Fecfc686fFB38"; 
export const pool_factory_address = "0xd15128EaCF1978db26b0035a3aA18993ed8E8B96"; 
export const usdc_address = "0xd6A5640De726a89A54ca724ac12BCc5E89600720"; 
export const weth_address = "0x6219CC8a3E880053ea0A1398f86E226C37603239";
export const reputation_manager_address = "0x789710C2E3c1663a59de28Dc7317bfb1AA910a62";
export const fetcher_address =  "0x226112dd12aDF4b9165004F05c5F687C4824566b";
export const leverageModule_address = "0xf9c6A04026c30dFC56FdB72A4B8cd00fB922823b";
export const leverage_manager_address = "0xEb3969Ebe6CB90747Da900cE0d8C227b21d7A20e";
export const variable_interest_rate_address = "0x541D09035CA76AE5CEA1C6ECDf098A48a8F2FDEe";
export const validator_manager_address = "0xA166314EFB605e29998717B7451A706A7ACA9b4A";
export const storage_handler_address = "0x251DAaef44bcdd754Bde1c068B7b298E6f2b327c";

export const ORACLE_MAPPING = { // X/USD
    "MATIC" : "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
    "ETH": "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    "DAI": "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046",
    "BTC": "0x007A22900a3B98143368Bd5906f8E17e9867581b",
    "USDC": "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0",
}

// // newest
// deploying "LinearCurve" (tx: 0xb555c9d8ee91fadbf820751fdcbd0a03e9abff090b7b6bc8899590aaeba86101)...: deployed at 0x83021898fA15d28819A3a96b51A086180fDEda8C with 641478 gas
// deploying "Controller" (tx: 0xbe483ba078765f98c3ef8f68a0647b8a0cc8f0aaefb575e59bbfe7f1cf216f6c)...: deployed at 0x8F8a9d52CB27860F1655abBFfd24A51675C6d2C0 with 5280879 gas
// deploying "PerpTranchePricer" (tx: 0xc93fd29999a076000b8031621f292eda9a678d0b092d078c8ead88651beb9614)...: deployed at 0x332F9E6e38b7722755Dd1cD792D42A207eb451E4 with 449518 gas
// deploying "StorageHandler" (tx: 0x349c69ee82a1a722d476faa9b41eefba76e2b43b3235a104a22948ab7eae3035)...: deployed at 0x251DAaef44bcdd754Bde1c068B7b298E6f2b327c with 1298500 gas
// deploying "MarketManager" (tx: 0x645e50c1f20f0bd092aee985bf9afa4714039f5a5eb1f7299d205a75b745348f)...: deployed at 0xBc6Ae8fDb436A00FEe62DbC7C344ddA767af010A with 4851864 gas
// deploying "VaultFactory" (tx: 0xb16c1e9464ff9463250589c28dca83d3c996c2875efde4b8f4a9b4d5ec70e77e)...: deployed at 0x9ABaCB3F5132b634Ed9F5D29944E1825DfeA3463 with 5157356 gas
// reusing "LinearCurve" at 0x83021898fA15d28819A3a96b51A086180fDEda8C
// deploying "Fetcher" (tx: 0x5f36d0b0d96c8a1dedb446a33b672ad29df09d2e6816983dc48195d591dc7454)...: deployed at 0x6A51c65AE11310Fefce0CBad66Ad37A2CE653Edd with 4135319 gas
// deploying "ZCBFactory" (tx: 0x70fa81d19065024e142709671c152ad7b74b03d325569c74ff5a4319450b3034)...: deployed at 0x40099D146F3F765CaA061474460b79c95738499E with 1076564 gas
// deploying "SyntheticZCBPoolFactory" (tx: 0x09374a15b627bf6bcd40c3e99e9c4b08d94463093e2deb52239eb14933a89711)...: deployed at 0xd15128EaCF1978db26b0035a3aA18993ed8E8B96 with 5302676 gas
// deploying "ReputationManager" (tx: 0x68233046699582808dc1dda4210420c274b029018f5a58104c3fa9271539278c)...: deployed at 0x789710C2E3c1663a59de28Dc7317bfb1AA910a62 with 1692450 gas
// deploying "LeverageManager" (tx: 0xae6c2b9498210efe91df67dbb84dfade6cb36e181202f523e4723574679bee93)...: deployed at 0xEb3969Ebe6CB90747Da900cE0d8C227b21d7A20e with 4095590 gas
// deploying "ValidatorManager" (tx: 0x05fa722a0e0085e5b03437bf1a92dad20e3685da7f17c34cf61d1ef4ca103637)...: deployed at 0xA166314EFB605e29998717B7451A706A7ACA9b4A with 2263419 gas