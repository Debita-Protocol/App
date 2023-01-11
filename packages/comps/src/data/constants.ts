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
export const controller_address = "0x07B318BDda3ca6e51A9f8546cFd07ea15096D478";
export const market_manager_address = "0xfFd8D1d768199714E94C433894F67f94Df658Afa";
export const vault_factory_address = "0x458b1a6F452D262f5ddE6dc9725dCeAfcB2d3751";
export const creditLine_address = "0x4be7805A2b35ce177F802D88A01Fecfc686fFB38"; 
export const pool_factory_address = "0x4ABeCdDDB28492Bd9A3BDe3156Bee0EBE7dCa40F"; 
export const cash_address = "0xd6A5640De726a89A54ca724ac12BCc5E89600720"; 
export const reputation_manager_address = "0xdec32C81f4021a9BD51Efc9b28568928DDaF2Ad3";
export const fetcher_address =  "0x51065b5cE4E476720A223a6eb0890B9D5B5403E6";
export const leverageModule_address = "0xf9c6A04026c30dFC56FdB72A4B8cd00fB922823b"; 
export const variable_interest_rate_address = "0x541D09035CA76AE5CEA1C6ECDf098A48a8F2FDEe";
export const validator_manager_address = "0xD2cfbB4719C4EFb9985280d635BE1518ba69D696";

// 12/30 3.27pm
// deploying "Controller" 0xbAB2fa347D9e605d3038DbCb5c23D7e5C1898544 with 5363775 gas
// deploying "MarketManager"  0x01C0bdE52D1994Cc7A24393C5471Aa0fC1853518 with 5414203 gas
// deploying "VaultFactory" 0xB937dde3Ee191c2b03a0Bf6cFa1C910D6c73a703 with 5263893 gas
// deploying "LinearCurve" 0x01887966f6cE370AD040a9ba48B634772aD5afbf with 633477 gas
// deploying "Fetcher"  0x161587Ec83BfC707ac5704Cc74102E82cFc81CcA with 3417500 gas
// deploying "ZCBFactory"  0x495E213034Fcd42Aa5fce91eC555A2132bDF02E4 with 1076564 gas
// deploying "SyntheticZCBPoolFactory"  0x156EfAc1B3765a680236308Cc6451ECEDA1497e4 with 5320070 gas
// deploying "ReputationManager" 0x5CeD3af8781B18ae686ED469D0B485e438C74E6c with 1095089 gas

// SUBGRAPH TESTING
// deploying "Collateral" (tx: 0x1e700f53aa0abe182f73c99cacdbe4077f4c28bcd9315c68140de1e6dfed8061)...: deployed at 0x77b40B1321de8853643A1fCCCAf1946083fB05aE with 652858 gas
// deploying "LinearCurve" (tx: 0xca348a7bea14c050f1b45478057e2621c5b9dae9440d73a09c4970b31cb11978)...: deployed at 0xe0d186aD90DC63ea8E76536d25840ca823270464 with 633477 gas
// deploying "Controller" (tx: 0x9d1bff4059a82bd9daae1b3411fe87cc180b6799aefd7ff70ea2bede114ce69c)...: deployed at 0x36c7feB605891E643258B7fFd5c28a41b83D71Aa with 4829706 gas
// deploying "MarketManager" (tx: 0x1d115988b07b36ef6715bb35f839eba5e3d546afb2dbc62f8b0d2c81b285befb)...: deployed at 0x18A7D487c5139ff4314Dc6907Dc3c7570E3f6890 with 5437363 gas
// deploying "VaultFactory" (tx: 0xffa99fc9fec7c39f10eb54281d0398a411949fe281918e1fa31dee810c29c812)...: deployed at 0xca78349EB90CeB5Cc8D7B98154B7e8179ccd2A15 with 5198017 gas
// reusing "LinearCurve" at 0xe0d186aD90DC63ea8E76536d25840ca823270464
// deploying "ZCBFactory" (tx: 0xd4aa5e5c4393fa38e3bb763077abbd2440e58643d3d0682b40022a69164bdc6c)...: deployed at 0xee296E3fdEc99F5f9248Bde2b65Ec34c4419d155 with 1076552 gas
// deploying "SyntheticZCBPoolFactory" (tx: 0x9c9239641b1bd4ccdead1310bdccf65dc2f2c64291d16af8961f7c7c992ef760)...: deployed at 0xd4244cfc3461d936a563e370aCE6867f25cEac2f with 5334689 gas
// deploying "ReputationManager" (tx: 0xc098d3fa1f6dc21cf51fb563bf6a4e622686a69fda546b8c6ea56385bd36c517)...: deployed at 0x2558d5A7475891cA513944328052073f841CaB05 with 1654717 gas
// deploying "ValidatorManager" (tx: 0xcc2413bec4a7addbd36533d302a2e4c0ca91953a2401120d0c30bd4ecb944ed3)...: deployed at 0xB32f1b9753948eA080e61c29ede33Aaf32E218aC with 2263431 gas