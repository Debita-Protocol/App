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
export const controller_address = "0xaF6481f77193a1A6B3264C0996FCeFf2F6E950A2";
export const market_manager_address = "0x88a2A25cFa60AAe055087A2Db8Bb60AE155E32e1";
export const vault_factory_address = "0x386A9Bb4Bed9c02392da4Cf27De323D4E3C10f27";
export const creditLine_address = "0x4be7805A2b35ce177F802D88A01Fecfc686fFB38"; 
export const pool_factory_address = "0x814bF2956fCd357a9EE3C3A254F7b41ed0B85C9b"; 
export const usdc_address = "0xd6A5640De726a89A54ca724ac12BCc5E89600720"; 
export const weth_address = "0x6219CC8a3E880053ea0A1398f86E226C37603239";
export const reputation_manager_address = "0x5Fbd382E5DA955EFEA59E664C88B48922957033c";
export const fetcher_address =  "0xdCe8f2059831f5027cCFe648D365f5eE7AD1712A";
export const leverageModule_address = "0xf9c6A04026c30dFC56FdB72A4B8cd00fB922823b";
export const leverage_manager_address = "0x725AAD287Ab704a05994eDE13bd10C5B98Dfe820";
export const variable_interest_rate_address = "0x541D09035CA76AE5CEA1C6ECDf098A48a8F2FDEe";
export const validator_manager_address = "0x9ba78bA111Ab4E3EAf46c5071C4d0589bb062555";
export const storage_handler_address = "0x43d527fe7b5822D81264057be591c771806F8E4d";

export const ORACLE_MAPPING = { // X/USD
    "MATIC" : "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
    "ETH": "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    "DAI": "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046",
    "BTC": "0x007A22900a3B98143368Bd5906f8E17e9867581b",
    "USDC": "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0",
}

// // newest
// Compiled 87 Solidity files successfully
// deploying "LinearCurve" (tx: 0xbe957924cd963737a72321f912e484654abb3064f3d6bc4efc9115fcc8ba28b2)...: deployed at 0xd4eA4D5f8f57Ad7Dee1A28d58F3212ec5986dF67 with 641478 gas
// deploying "Controller" (tx: 0x44829676e8aceb8c52a28fc7027b73d59b39ffac86a969cd26a3f9d4add1a561)...: deployed at 0xaF6481f77193a1A6B3264C0996FCeFf2F6E950A2 with 5312124 gas
// deploying "PerpTranchePricer" (tx: 0xc8157535d8fb43790880dd776c17bd4688f69d540bb90ce4db73c1dc1a7811de)...: deployed at 0x715e301FDDaC1e453F995d0d33203EBc838f4d28 with 306000 gas
// deploying "StorageHandler" (tx: 0x04e791c8b0cf9ae2743c3fe984b0b3e2d2626dbd2904744330d4277e07624fe7)...: deployed at 0x43d527fe7b5822D81264057be591c771806F8E4d with 949084 gas
// deploying "MarketManager" (tx: 0xcafcd36ed0a88d5fb4113783ac2372fef8a3462238450d436fb643a98a2891ed)...: deployed at 0x88a2A25cFa60AAe055087A2Db8Bb60AE155E32e1 with 4787518 gas
// deploying "VaultFactory" (tx: 0x59bfba1c236d30e602c56fcc91a764be204633e20861b7c7de24f316d0f460e7)...: deployed at 0x386A9Bb4Bed9c02392da4Cf27De323D4E3C10f27 with 5157344 gas
// reusing "LinearCurve" at 0xd4eA4D5f8f57Ad7Dee1A28d58F3212ec5986dF67
// deploying "Fetcher" (tx: 0xa92dad5dd389903ee25240fe54e35c3a366b2fbf7ac09110d26c51e4c92e705c)...: deployed at 0xdCe8f2059831f5027cCFe648D365f5eE7AD1712A with 4098185 gas
// deploying "ZCBFactory" (tx: 0x5401803bb1061e3e70849568dfff3662501d8bfc38edda7a61cb6b8870822b0f)...: deployed at 0x34B8Dc9fb480A12750DB0A5c0F0d0d448880Dbe2 with 1076564 gas
// deploying "SyntheticZCBPoolFactory" (tx: 0x6df5268d0a713662d5cc0bd6dd57affac160f76c7c84e396dfe50a4bfa11591c)...: deployed at 0x814bF2956fCd357a9EE3C3A254F7b41ed0B85C9b with 5302676 gas
// deploying "ReputationManager" (tx: 0x0fa16fd3022338ce738caf02977af014cc03923388739e620989127f1d924dcd)...: deployed at 0x5Fbd382E5DA955EFEA59E664C88B48922957033c with 1692462 gas
// deploying "LeverageManager" (tx: 0x0df4af91b3ba1ed31149ac982e23a2b7eb0fd4e8c925c7a41e318ebe3679b81d)...: deployed at 0x725AAD287Ab704a05994eDE13bd10C5B98Dfe820 with 4098694 gas
// deploying "ValidatorManager" (tx: 0x8255f53fae0c8d5a729bf2e14f9fc05540eeff7e5e55f85f7d8193feaa288b96)...: deployed at 0x9ba78bA111Ab4E3EAf46c5071C4d0589bb062555 with 2263431 gas