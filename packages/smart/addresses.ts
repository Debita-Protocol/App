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

      {
        type:"Trusted",
        subtype:"V3",
        //address: "0x453693835A40289553b155F354f7a45819c7753D", 
      //  address: "0x9DFd4B4e2AB18CB2bffB6A2bcB42Ca34b20b51bF",
        //address:"0x21Bf714953425a08a94F62913e93f49259b4cf0d", 
       // address: "0x89Ab58356AfAca06405149fbf2A919d9ae3A92b1",
        address: "0x0559B2a21d6479b9a03ea835D83895f5aEE47C5f", 
        collateral: "0xC9a5FfC14d68c511e83E758d186C249580d5f111",
        ammFactory: "0x7fc5F526A8be47f9D6460b26D59532C35bd54931",
        hasRewards: true,
        fetcher: "0xcE5c2E8FA35bED364593e63974930D4fE942eCB1",
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
// deploying "TrustedMarketFactoryV3" (tx: 0x375d01241845370c7a76f96594782f480a06a45b955055df34c476f4c05ac491)...: deployed at 0x9DFd4B4e2AB18CB2bffB6A2bcB42Ca34b20b51bF with 3941144 gas
// deploying "TrustedFetcher" (tx: 0xfc4cffd0af9d3b752dc32eb9c56eb29949e67cce8024e26e973f9602259109d2)...: deployed at 0x596f90d532cb2e61D655a0A9bC835ABB11219aCF with 1832562 gas
// deploying "AMMFactory" (tx: 0x48c5ed3f0628dd3f8cecfde8da8f0e0ecfda0bddca7a42e98b803bf3ddde4c28)...: deployed at 0x0A54AFFFcC4A08017BC34e17994dBF612955e1aF with 3849105 gas
// deploying "Controller" (tx: 0x475c1896ecda68581f5a66bfd5feee030b2e7fc4e99cbf27ed8c13bd88f1dd8e)...: deployed at 0x7609e874dEe3160A0Cc07EF1E52c0Bde8D23d046 with 3898941 gas
// deploying "ReputationNFT" (tx: 0xbc86089e4c5f043bdf07790c0c5802dcd5bc69ffe59fd6a61b2e97c1f972cee4)...: deployed at 0xf39cd0caeeb5A02dCf51817d1aFF8D7BCd752002 with 1168626 gas
// deploying "MarketManager" (tx: 0x19d935c3887a85c3c00262cccdc715615c01abdbb241877b2c4a3cb9a8f8380e)...: deployed at 0xe0746079b499a8d10BdF3fdeF91417657Ff21289 with 3211328 gas
// deploying "Vault" (tx: 0x5beabb2083d141e51b487ef2698dc92127a063fe12f5361afc44c2e205129f30)...: deployed at 0x55C6C0ACEd3d83A1F66E37a6d9a31d0B0259FA70 with 2534977 gas
// deploying "TrancheAMMFactory" (tx: 0x29562e1274249c0111719391dd6212d1fbaaf8a526ab8084e81b4feb116db7a7)...: deployed at 0xa94Ab06f65A3D75dc183abBA737E9BF4f630BD91 with 1618673 gas
// deploying "TrancheFactory" (tx: 0x578297b0a40b883d5bf684764fd1014e844687eefba41304011dda23aea199f4)...: deployed at 0xcBff2FEBd3Ddd1cF9F3620844D08290a298665Aa with 4968793 gas
// deploying "TrancheMaster" (tx: 0x428e160c43dc1b5aaa13bf1cb1e8c53932fb6ebe25e305760e059c6e4068fd10)...: deployed at 0x5A9a8908d0B066c210f1F5a50AbD871b0fF0b717 with 1515599 gas