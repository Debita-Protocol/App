// This file is updated by deployer.
import { AddressMapping } from "./constants";

export const addresses: AddressMapping = {
  31337: {
    reputationToken: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    balancerFactory: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    marketFactories: [
      {
        type: "Grouped",
        subtype: "V3",
        address: "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E",
        collateral: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        ammFactory: "0x9E545E3C0baAB3E08CdfD552C960A1050f373042",
        fetcher: "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690",
        hasRewards: false,
        description: "Grouped",
        version: "FILL THIS OUT",
      },
      {
        type: "Crypto",
        subtype: "V3",
        address: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1",
        collateral: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        ammFactory: "0x9E545E3C0baAB3E08CdfD552C960A1050f373042",
        fetcher: "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
        hasRewards: false,
        description: "crypto prices",
        version: "FILL THIS OUT",
      },
      {
        type: "Grouped",
        subtype: "V3",
        address: "0x67d269191c92Caf3cD7723F116c85e6E9bf55933",
        collateral: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        ammFactory: "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690",
        fetcher: "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E",
        hasRewards: false,
        description: "Grouped",
        version: "FILL THIS OUT",
      },
      {
        type: "NBA",
        subtype: "V3",
        address: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
        collateral: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        ammFactory: "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690",
        fetcher: "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d",
        hasRewards: false,
        description: "nba",
        version: "FILL THIS OUT",
      },
    ],
    info: { uploadBlockNumber: 1, graphName: "" },
  },
  137: {
    reputationToken: "0x435C88888388D73BD97dab3B3EE1773B084E0cdd",
    balancerFactory: "0x3eC09e2A4699951179B61c03434636746aBE61AA",
    marketFactories: [
      {
        type: "MLB",
        subtype: "V3",
        address: "0x03810440953e2BCd2F17a63706a4C8325e0aBf94",
        collateral: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        ammFactory: "0x79C3CF0553B6852890E8BA58878a5bCa8b06d90C",
        fetcher: "0xcfcF4EF9A35460345D6efC7D01993644Dbcd4273",
        hasRewards: true,
        masterChef: "0x1486AE5344C0239d5Ec6198047a33454c25E1ffD",
        description: "mlb",
        version: "v1.4.0",
      },
      {
        type: "NBA",
        subtype: "V3",
        address: "0xe696B8fa35e487c3A02c2444777c7a2EF6cd0297",
        collateral: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        ammFactory: "0x79C3CF0553B6852890E8BA58878a5bCa8b06d90C",
        fetcher: "0xcfcF4EF9A35460345D6efC7D01993644Dbcd4273",
        hasRewards: true,
        masterChef: "0x1486AE5344C0239d5Ec6198047a33454c25E1ffD",
        description: "nba",
        version: "1.4.0",
      },
      {
        type: "NFL",
        subtype: "V3",
        address: "0x1f3eF7cA2b2ca07a397e7BC1bEb8c3cffc57E95a",
        collateral: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        ammFactory: "0x79C3CF0553B6852890E8BA58878a5bCa8b06d90C",
        fetcher: "0xcfcF4EF9A35460345D6efC7D01993644Dbcd4273",
        hasRewards: true,
        masterChef: "0x1486AE5344C0239d5Ec6198047a33454c25E1ffD",
        description: "nfl",
        version: "1.4.0",
      },
      {
        type: "MMA",
        subtype: "V3",
        address: "0x6D2e53d53aEc521dec3d53C533E6c6E60444c655",
        collateral: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        ammFactory: "0x79C3CF0553B6852890E8BA58878a5bCa8b06d90C",
        fetcher: "0xcfcF4EF9A35460345D6efC7D01993644Dbcd4273",
        hasRewards: true,
        masterChef: "0x1486AE5344C0239d5Ec6198047a33454c25E1ffD",
        description: "mma/ufc",
        version: "1.4.0",
      },
      {
        type: "Crypto",
        subtype: "V3",
        address: "0x48725baC1C27C2DaF5eD7Df22D6A9d781053Fec1",
        collateral: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        ammFactory: "0x79C3CF0553B6852890E8BA58878a5bCa8b06d90C",
        fetcher: "0x0C68954eCB79C80868cd34aE12e0C2cC8E1Cc430",
        hasRewards: true,
        masterChef: "0x1486AE5344C0239d5Ec6198047a33454c25E1ffD",
        description: "crypto prices",
        version: "1.4.0",
      },
    ],
    info: { uploadBlockNumber: 15336699, graphName: "matic" },
  },
  80001: {
    reputationToken: "0x1A921b8a13372Cc81A415d02627756b5418a71c9",
    balancerFactory: "0xE152327f9700F1733d12e7a507045FB4A4606C6F",
    evenTheOdds: "0xd89515B7229E2b499e94c94BD40c28c6C2c2f82F",
    marketFactories: [
      {
        type: "Grouped",
        subtype: "V3",
        address: "0xC844a28C66E0796321351a262cB87A5da5D3d8fa",
        collateral: "0x5799bFe361BEea69f808328FF4884DF92f1f66f0",
        ammFactory: "0xDcf4173FC3947bC2CbAB929559b7f38Cb25Bef34",
        fetcher: "0xDB1FDD47b2dDc7d98698e8248202A56FCB7De53B",
        hasRewards: true,
        masterChef: "0xa976cb47C216Ee71089b10383bDEa4e230551458",
        description: "grouped",
        version: "FILL THIS OUT",
      },
      {
        type: "MLB",
        subtype: "V3",
        address: "0xaa7156a7B4d9590220D59e219B900FfDa52F6153",
        collateral: "0x5799bFe361BEea69f808328FF4884DF92f1f66f0",
        ammFactory: "0xDcf4173FC3947bC2CbAB929559b7f38Cb25Bef34",
        fetcher: "0xe5708a8D1980dB451e9d8059BD20D1BEb6A0a688",
        hasRewards: true,
        masterChef: "0xa976cb47C216Ee71089b10383bDEa4e230551458",
        description: "mlb",
        version: "FILL THIS OUT",
      },
      {
        type: "NBA",
        subtype: "V3",
        address: "0xedf8f21CD357Fb3B51dfc9bAc227a678344956CE",
        collateral: "0x5799bFe361BEea69f808328FF4884DF92f1f66f0",
        ammFactory: "0xDcf4173FC3947bC2CbAB929559b7f38Cb25Bef34",
        fetcher: "0xe5708a8D1980dB451e9d8059BD20D1BEb6A0a688",
        hasRewards: true,
        masterChef: "0xa976cb47C216Ee71089b10383bDEa4e230551458",
        description: "nba",
        version: "FILL THIS OUT",
      },
      {
        type: "NFL",
        subtype: "V3",
        address: "0xaf2ed373E031bA5c9Ad10E4686e1F5C1074639D2",
        collateral: "0x5799bFe361BEea69f808328FF4884DF92f1f66f0",
        ammFactory: "0xDcf4173FC3947bC2CbAB929559b7f38Cb25Bef34",
        fetcher: "0xe5708a8D1980dB451e9d8059BD20D1BEb6A0a688",
        hasRewards: true,
        masterChef: "0xa976cb47C216Ee71089b10383bDEa4e230551458",
        description: "nfl",
        version: "FILL THIS OUT",
      },
      {
        type: "MMA",
        subtype: "V3",
        address: "0x9213E2Ce5D0Eb030Aaccce61685e0453a8426947",
        collateral: "0x5799bFe361BEea69f808328FF4884DF92f1f66f0",
        ammFactory: "0xDcf4173FC3947bC2CbAB929559b7f38Cb25Bef34",
        fetcher: "0xe5708a8D1980dB451e9d8059BD20D1BEb6A0a688",
        hasRewards: true,
        masterChef: "0xa976cb47C216Ee71089b10383bDEa4e230551458",
        description: "mma/ufc",
        version: "FILL THIS OUT",
      },
      {
        type: "CryptoCurrency",
        subtype: "V3",
        address: "0x6B12716B875320Dd7c6fC1161639f93a088091B7",
        collateral: "0x5799bFe361BEea69f808328FF4884DF92f1f66f0",
        ammFactory: "0xDcf4173FC3947bC2CbAB929559b7f38Cb25Bef34",
        fetcher: "0xdA65A1f9c322384F743C474040283897cDcE8cC5",
        hasRewards: true,
        masterChef: "0xa976cb47C216Ee71089b10383bDEa4e230551458",
        description: "crypto prices",
        version: "FILL THIS OUT",
      },

      {//0x78a37719caDFBb038359c3A06164c46932EBD29A
        //0x7445a93A9FBcaFc4B1b383D8e42F56791b085bf8
        //fetcher:0x108513d02D12E90b47D8f884213A02353897DFBb
          type:"Trusted",
          subtype:"V3",
         // address:"0x323D62F7FC2a1a078787dB5045ae14E0567b0476",
          address: "0x453693835A40289553b155F354f7a45819c7753D", 
         collateral: "0xC9a5FfC14d68c511e83E758d186C249580d5f111",
         ammFactory: "0x7fc5F526A8be47f9D6460b26D59532C35bd54931",
          hasRewards: true,
          fetcher: "0xcE5c2E8FA35bED364593e63974930D4fE942eCB1",
//0x12297ec2FB50EC75ddCB2BD37A5DD60D71D0a2F9
        masterChef: "0x81D0609d4FDe0efa1661dB340b99E730285b592e",
        description: "crypto prices",
        version: "FILL THIS OUT",
      },
            {//0x78a37719caDFBb038359c3A06164c46932EBD29A
        //0x7445a93A9FBcaFc4B1b383D8e42F56791b085bf8
        //fetcher:0x108513d02D12E90b47D8f884213A02353897DFBb
          type:"CDS",
          subtype:"V1",
          address: "0xd2c8018E0315E164709AbBC7832321436555ed79", 
         collateral: "0xe3E34E7d6D406838e3d6D36eC8C2116BA3053938",
         ammFactory: "0xDcf4173FC3947bC2CbAB929559b7f38Cb25Bef34",
          hasRewards: true,
          fetcher: "0x450c6A1F99d991aA2df36F3dA61652cca07eA135",
//0x12297ec2FB50EC75ddCB2BD37A5DD60D71D0a2F9
        masterChef: "0xa976cb47C216Ee71089b10383bDEa4e230551458",
        description: "CDS market",
        version: "FILL THIS OUT",
      },
    ],
    info: { uploadBlockNumber: 15336699, graphName: "mumbai" },
  },
};
// deploying "FeePot" (tx: 0xa69cf1d2f58b4c3b180a15fbdd860ca5fdc463bc1be4ac2682a019298649fbe7)...: deployed at 0xd0780FD29f17cF568f45d26d4F71f66ed747e605 with 1465627 gas
// deploying "TrustedFetcher" (tx: 0x62b150e295b9c4b65414cd4d7ca0fd9870948686cca0daf1e016e0a2c2fcb0d4)...: deployed at 0xcE5c2E8FA35bED364593e63974930D4fE942eCB1 with 2233816 gas
// deploying "MasterChef" (tx: 0x728df5c61f75f1a9343430ff0697e0bd6084101cd5c8b72a2f197643dd3e5d59)...: deployed at 0x81D0609d4FDe0efa1661dB340b99E730285b592e with 3798866 gas
// deploying "AMMFactory" (tx: 0x4ec8ed081fc3f384a99c0578806ed2d4fa8a7d6debab0810134e4322acf28190)...: deployed at 0x7fc5F526A8be47f9D6460b26D59532C35bd54931 with 4624583 gas
// deployer 0xFD84b7AC1E646580db8c77f1f05F47977fAda692
// deploying "DS" (tx: 0x9ae5ca8111abb901aef09d3ff3e8d468eced426e6337f34e24f3b76ead914bba)...: deployed at 0xC9a5FfC14d68c511e83E758d186C249580d5f111 with 1938526 gas
// deploying "DSS" (tx: 0x8758b82cfdb416bd34e7e67eb554127bb97cd05e79c19a3415e81e90c941570c)...: deployed at 0x9ee05EBdD94e1779072634b4C8C636f68f3088a2 with 1938630 gas
// deploying "LendingPool" (tx: 0xe0bfe77a4b2086923e2cb7b140c8beeb5e421383d1bd6ed95c8cfc7a3253e310)...: deployed at 0x7eEea60c374187FAF1c00D82427788BAb3a096CD with 4222573 gas
// deploying "TrustedMarketFactoryV3" (tx: 0xbcd1721d946fa10416f786bf6d30cf80886802218cc343f14dd1c67625aa23fb)...: deployed at 0x453693835A40289553b155F354f7a45819c7753D with 4286247 gas
// deploying "Manager" (tx: 0x57358b01ff295410d92a04ce41c7f7172323f49141730c3ceaaa51a202c22d6d)...: deployed at 0xEFa17081CE1C50077E944C58796D6F937c117e8d with 1351552 gas


// deploying "FeePot" (tx: 0xa9657db66939d9560b96a2109e42193255ffca418323d680aae15d803200e1cf)...: deployed at 0x3444DC0F16914C45488744C84b074F5c560e8274 with 1256178 gas
// deploying "AMMFactory" (tx: 0xb12fe44d60a25e6bdfa1c410d9e64506851f6424cf75b842de6bba14500c2337)...: deployed at 0x183F734427950dBa3e2235314EB926Bb84dCff52 with 3332543 gas
// deployer 0xFD84b7AC1E646580db8c77f1f05F47977fAda692
// deploying "DS" (tx: 0xed101f9ace1e6b349b93b39936cec338f64150f2407ef99b8ffead0338066352)...: deployed at 0xe3E34E7d6D406838e3d6D36eC8C2116BA3053938 with 1565671 gas
// deploying "DSS" (tx: 0x2029f4eb008869428c293068970c3b106efb209749270cc7e8468f985df003c4)...: deployed at 0xd2B269F5a37B70ce7ab098BaeeCCB7A0740B7f8B with 1565737 gas
// deploying "LendingPool" (tx: 0xe76aade7a832e01f5b4a2ebeea16269726cadc113c409e267ff637a32c4cee3d)...: deployed at 0xcdb0976F4C07bE6124A6457BE79E0D15bdbFE98e with 1885857 gas
// deploying "sDS" (tx: 0x3af350ca2d3a1128c346048c2acc81092dc6e1a12b773b50e9fd935153a2fb79)...: deployed at 0xD69Ac9183910CD8d2298eD4737ba81028Eb8b0B7 with 1284032 gas
// deploying "StakingPool" (tx: 0xdb8f4cd48c69f9d5c6836a4d9ad77b0652c15ae1a9f2ec5a5cbd9d598dc7088b)...: deployed at 0x8CBbE7730149507a7631110DD071Fe9ac87Ca50E with 623767 gas
// deploying "iDSLocker" (tx: 0x081e7c5816333903a2ab07a184b049058bae85ba19a04802b9a09f5c98ff5d45)...: deployed at 0xA764F06eadEAEce5AC8B124F0508B7e6d2e3a8f7 with 2822829 gas
// deploying "iDS" (tx: 0x591f9735b275c26835a19b516cc48f367eb6f237b238764a37ba4a8c5ae6a911)...: deployed at 0xc6b8bf459bF3C53C0CaE08DD9DCB47780D248E43 with 495893 gas
// deploying "VoteTracker" (tx: 0x69bbce113ad1d302b22840da9f33f7ce71a446645025720a16ea4eabec9bf1a6)...: deployed at 0x92bC25C5Be800C2ECb1e66281634D9FE30b29Ab9 with 732903 gas
// deploying "TrustedMarketFactoryV3" (tx: 0xa2f674e240fa1f9f653428e69982d49f14e65bbba608871ab69d5ccf8a4564e8)...: deployed at 0x77FaA88896c0c1C66a546043bc11617d44D45695 with 3564782 gas


// deployer 0xFD84b7AC1E646580db8c77f1f05F47977fAda692
// deploying "DS" (tx: 0xc57d94c407e68e799c8de76a57d4bb456e1fc1fe8f8cdc3d467d669e1a818d8f)...: deployed at 0x970C0f56f0755B2CC3DEeBA00e9e8aE5138d9fBC with 1565671 gas
// reusing "DSS" at 0xd2B269F5a37B70ce7ab098BaeeCCB7A0740B7f8B
// deploying "LendingPool" (tx: 0x07946ac7dba6c5ea76652b7c008b39de113b51f05724bb5726598e919373849b)...: deployed at 0x8447f8865d84c3DaFa0948645872d7522a7e9Ad7 with 2028989 gas
// deploying "sDS" (tx: 0x48e5adbfa94216140498813cabf13a8f540f9d3570bb35a7deb83a9db97482a3)...: deployed at 0x1C168DF0F7b307B4E63E2f9796ac675eFcDDa51c with 1284032 gas
// deploying "StakingPool" (tx: 0xa71bf8934d624bfec8f2766d431081056bce90102dd23e7cdebbd02c1ece37aa)...: deployed at 0x9b59B6ef69ab161BCA3F578E1E97A04dc7cc5F9c with 623767 gas
// reusing "iDSLocker" at 0xA764F06eadEAEce5AC8B124F0508B7e6d2e3a8f7
// reusing "iDS" at 0xc6b8bf459bF3C53C0CaE08DD9DCB47780D248E43
// reusing "VoteTracker" at 0x92bC25C5Be800C2ECb1e66281634D9FE30b29Ab9
// deploying "TrustedMarketFactoryV3" (tx: 0xe0d2e1c093a92d15afe77c83ac524b242e8e828d1be87cf583c2bcb4c1690e99)...: deployed at 0x52637EB4D0a4DE706fd28BE324b2393a00336813 with 3554886 gas
// deploying "Manager" (tx: 0x18c3639d390aa22d90d1fa2124a4e5f59a2ba0442463f358f836f358a2ec76bf)...: deployed at 0x104b93Fb6d9bC579d9Ab6d661412B80BEBD45AF4 with 968541 gas
