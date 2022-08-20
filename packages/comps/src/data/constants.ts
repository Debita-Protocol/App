import abi from "./TrustedMarketFactoryV3.json"

export const TrustedMarketFactoryV3ABI = abi.abi; 
export const TrustedMarketFactoryV3Address = "0xD6D42E84C4127E71eD55eEecdfcBCF24e1c059E4"; 
//export const marketFactoryAddress = "0x453693835A40289553b155F354f7a45819c7753D";
// export const marketFactoryAddress = TrustedMarketFactoryV3Address;
export const settlementAddress = "0xFD84b7AC1E646580db8c77f1f05F47977fAda692";
//export const dsAddress = "0xc90AfD78f79068184d79beA3b615cAB32D0DC45D";
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

// DEBITA 2.0
export const controller_address = "0x7d90D8190195E1435a4db20cFdF0764B75DDF649";
export const Vault_address = "0x8c05D03eff257e7d0E5711F4Ab4cd2277cB9B119";
export const MM_address = "0xfc5410f1985C59f7924868FFd8f95B86EfE9eB9D";
export const Controller_address = "0x7d90D8190195E1435a4db20cFdF0764B75DDF649";
export const RepNFT_address = "0x745c04eEAb4C90E242130460919dFe8ED0845725";
export const sample_instument_address = "0x518662466dfcad248968808F07f5066176bda060"; 
export const marketFactoryAddress = "0x21Bf714953425a08a94F62913e93f49259b4cf0d"


// deploying "Controller" (tx: 0x8daf2cf033d167aba866b3b41cd8449dd8f15682c78ba6e92e75b67268fcd35c)...: deployed at 0x7d90D8190195E1435a4db20cFdF0764B75DDF649 with 4229240 gas
// deploying "ReputationNFT" (tx: 0xd8398e978678bea79d0e6806c9002bec46b0d137facdb02585ae5d131c35fdac)...: deployed at 0x745c04eEAb4C90E242130460919dFe8ED0845725 with 1168626 gas
// deploying "MarketManager" (tx: 0x23f8a222bea65325d0322df08c7b62c0d7800f1fb1e980cfaeba11123ef36b06)...: deployed at 0xfc5410f1985C59f7924868FFd8f95B86EfE9eB9D with 3267370 gas
// deploying "Vault" (tx: 0x2811b931c0ca8be055c73f7cbf5223ae6ccc1b1b23d69f02aca1c13ccbc9b10d)...: deployed at 0x8c05D03eff257e7d0E5711F4Ab4cd2277cB9B119 with 2821756 gas
// deploying "CreditLine" (tx: 0x1ff52efbe2994132c17e7032a4ab6335eb6351aa9f9a35c842aa697d0ec221b8)...: deployed at 0x518662466dfcad248968808F07f5066176bda060 with 886865 gas
// reusing "TrustedMarketFactoryV3" at 0x21Bf714953425a08a94F62913e93f49259b4cf0d

// deploying "AMMFactory" (tx: 0xdb2bfd4abb8ff125fdf88ff6830a2386864eb89c6470d8234fd98a54ff2c71b6)...: deployed at 0x63be015Ec11Aa2928f8731bE32C4E604aadc38af with 3849105 gas
// deploying "Controller" (tx: 0xf958a3127307a7c0bd632a34db014111cf3928beba41336158910314292023b6)...: deployed at 0x6Bad2685217683B9395e11AAbc468c3919c6FB84 with 4147792 gas
// deploying "ReputationNFT" (tx: 0xd7a1316e9822372449db118007378c1ba910d3e57b4b14a1494ff04836445514)...: deployed at 0x575b9b7dBD0Bb1124A5dBEB53eA0c8614a74Ce33 with 1168626 gas
// deploying "MarketManager" (tx: 0x8b154d32f46e21bb4c43a4c4e0e75619ed6dae560db634ed4242bd3cbae78e5d)...: deployed at 0xcC0F5e97D6326811932b9a49647De232f7FD6806 with 3244799 gas
// deploying "Vault" (tx: 0xd9fdb8b9c4b3b29226a9b314736fcda374e60746dfb55c6264327b68a469211d)...: deployed at 0xCFedCe5185055d4478d52fbE31a7fefBDD972433 with 2753893 gas
// deploying "CreditLine" (tx: 0x9d9c5b227538e3b0e897563e7166a09796a07cef11ae1d172cf0de6b4b380c6f)...: deployed at 0x7657334F6fb9E74F224A5386f100E2C7Bd5F682c with 886853 gas
// deploying "TrustedMarketFactoryV3" (tx: 0x42a6ec49b9130237265d889250795a3398a06d8c2e69a74a9bb6db4f10e944ed)...: deployed at 0x21Bf714953425a08a94F62913e93f49259b4cf0d with 3941144 gas
// deploying "TrustedFetcher" (tx: 0x247a1676b0d4ee792485ca6725e2ff5d0af0032f5be6375de17506c20478392b)...: deployed at 0x1c3D0E2faf2411B628cB9707B7396E7D3b024349 with 1832562 gas
// deploying "TrancheAMMFactory" (tx: 0x910b485c4fe6d5bb0f75cb1ec4f6376321fa2408f87805cc2206a6023f70d585)...: deployed at 0xd9A4e17C2FCD4C2DB250CBa6cfFAC7295fd7C21F with 1618673 gas
// deploying "TrancheFactory" (tx: 0x60d5a1ed954bef23c1146b4565929666692bceef1d036d6b3ab9953b8ce0de22)...: deployed at 0xf6aE969Cd284dF6A78eCd3024cd1b47278C1d286 with 4968805 gas
// deploying "TrancheMaster" (tx: 0xf03ef2bf6154883be870e21cd807d77da7dd39067e9d48ff1298c399a914cbc8)...: deployed at 0xC524E70b3Be115F2e753e1683Fa4D95A5b06af7b with 1515611 gas