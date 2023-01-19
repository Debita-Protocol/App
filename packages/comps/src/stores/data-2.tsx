import React, { useEffect } from "react";
import {
  DEFAULT_DATA_STATE_2,
  STUBBED_DATA_ACTIONS_2,
  PARA_CONFIG,
  NETWORK_BLOCK_REFRESH_TIME,
  MULTICALL_MARKET_IGNORE_LIST,
  DEFAULT_INSTRUMENT_STATE, 
} from "./constants-2";
import { useData2 } from "./data-hooks-2";
import { useUserStore, UserStore } from "./user";
import { getContractData } from "../utils/contract-calls-new";
import { fetchRammGraphData } from "../utils/contract-calls-new";
import { VaultInfos, VaultInfo } from "types";
//import { getAllTransactions } from "../apollo/client";
import { getDefaultProvider } from "../components/ConnectAccount/utils";
import { AppStatusStore } from "./app-status";
import { MARKET_LOAD_TYPE } from "../utils/constants";

export const DataContext2 = React.createContext({
  ...DEFAULT_DATA_STATE_2,
  actions: STUBBED_DATA_ACTIONS_2,
});

export const DataStore2 = {
  actionsSet: false,
  get: () => ({ ...DEFAULT_DATA_STATE_2 }),
  actions: STUBBED_DATA_ACTIONS_2,
};

export const DataProvider2 = ({ loadType = MARKET_LOAD_TYPE.SIMPLIFIED, children }: any) => {
  const { account } = useUserStore();
  const configCashes = getCashesInfo();
  const state = useData2(configCashes);
  const {
    actions: { updateDataHeartbeat, updatePrices },
  } = state;

  if (!DataStore2.actionsSet) {
    DataStore2.actions = state.actions;
    DataStore2.actionsSet = true;
  }
  const readableState = { ...state };
  delete readableState.actions;
  DataStore2.get = () => readableState;
  const networkId = Number(PARA_CONFIG.networkId);
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;
    const getData = async () => {
      console.log("getData...")
      const { account: userAccount, loginAccount } = UserStore.get();
      const { isRpcDown, isWalletRpc } = AppStatusStore.get();
      const { 
        blocknumber: dblock, 
        vaults: dvaults, 
        instruments: dinstruments,
        markets: dmarkets
      } = DataStore2.get();

      const { actions: { setIsRpcDown } } = AppStatusStore;
      const provider = isWalletRpc ? loginAccount?.library : getDefaultProvider() || loginAccount?.library;
      let infos = { vaults: dvaults , blocknumber: dblock, instruments: dinstruments, markets: dmarkets };

      try {
        infos = await getContractData(
          userAccount,
          provider
        );
        // infos = await fetchRammGraphData(provider)
        console.log('infos: ', infos)
        if (isRpcDown) {
          setIsRpcDown(false);
        }
        return infos;
      } catch (e) {
        if (e.data?.error?.details) {
          if (e.data?.error?.details.toLowerCase().indexOf("rate limit") !== -1) {
            if (e.data?.error?.data?.rate_violated.toLowerCase().indexOf("700 per 1 minute") !== -1) {
              setIsRpcDown(true);
            }
          }
        }
        console.log("error getting market data", e);
      }
      
      return { vaults: {}, blocknumber: 1, markets: {}, instruments: {} };
    };

    getData().then(({ vaults, blocknumber, markets, instruments }) => {
      isMounted &&
        blocknumber &&
        blocknumber > DataStore2.get().blocknumber &&
        updateDataHeartbeat(vaults, blocknumber, null, markets, instruments);

      intervalId = setInterval(() => {
        getData().then(({ vaults, blocknumber, markets, instruments }) => {

          isMounted &&
            blocknumber &&
            blocknumber > DataStore2.get().blocknumber &&
            updateDataHeartbeat(vaults, blocknumber, null, markets, instruments);
        });
      }, NETWORK_BLOCK_REFRESH_TIME[networkId]);
    });

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // useEffect(() => {
  //   let isMounted = true;
  //   let intervalId = null;
  //   const getData = async () => {
  //     console.log("getData...")
  //     const { account: userAccount, loginAccount } = UserStore.get();
  //     const { isRpcDown, isWalletRpc } = AppStatusStore.get();
  //     const { 
  //       blocknumber: dblock, 
  //       vaults: dvaults, 
  //       instruments: dinstruments,
  //       markets: dmarkets
  //     } = DataStore2.get();

  //     const { actions: { setIsRpcDown } } = AppStatusStore;
  //     const provider = isWalletRpc ? loginAccount?.library : getDefaultProvider() || loginAccount?.library;
  //     let infos = { vaults: dvaults , blocknumber: dblock, instruments: dinstruments, markets: dmarkets };

  //     try {
  //       infos = await getContractData(
  //         userAccount,
  //         provider
  //       );
  //       // infos = await fetchRammGraphData(provider)
  //       console.log('infos: ', infos)
  //       if (isRpcDown) {
  //         setIsRpcDown(false);
  //       }
  //       return infos;
  //     } catch (e) {
  //       if (e.data?.error?.details) {
  //         if (e.data?.error?.details.toLowerCase().indexOf("rate limit") !== -1) {
  //           if (e.data?.error?.data?.rate_violated.toLowerCase().indexOf("700 per 1 minute") !== -1) {
  //             setIsRpcDown(true);
  //           }
  //         }
  //       }
  //       console.log("error getting market data", e);
  //     }
      
  //     return { vaults: {}, blocknumber: 1, markets: {}, instruments: {} };
  //   };

  //   getData().then(({ vaults, blocknumber, markets, instruments }) => {
  //     isMounted &&
  //       blocknumber &&
  //       blocknumber > DataStore2.get().blocknumber &&
  //       updateDataHeartbeat(vaults, blocknumber, null, markets, instruments);

  //     intervalId = setInterval(() => {
  //       getData().then(({ vaults, blocknumber, markets, instruments }) => {

  //         isMounted &&
  //           blocknumber &&
  //           blocknumber > DataStore2.get().blocknumber &&
  //           updateDataHeartbeat(vaults, blocknumber, null, markets, instruments);
  //       });
  //     }, NETWORK_BLOCK_REFRESH_TIME[networkId]);
  //   });

  //   return () => {
  //     isMounted = false;
  //     clearInterval(intervalId);
  //   };
  // }, []);


  // removed record of transactions => need to build subgraph first

  return <DataContext2.Provider value={state}>{children}</DataContext2.Provider>;
};

export const useDataStore2 = () => React.useContext(DataContext2);

const output = {
  DataProvider2,
  useDataStore2,
  DataStore2,
};

// for now we just do this here...
const getCashesInfo = (): any[] => {
  const { marketFactories } = PARA_CONFIG;
  const { collateral: usdcCollateral } = marketFactories[0];
  // todo: need to grab all collaterals per vault.

  const cashes = [
    {
      name: "USDC",
      displayDecimals: 2,
      decimals: 6,
      address: usdcCollateral,
      shareToken: "",
      usdPrice: "1",
      asset: "",
    },
    {
      name: "ETH",
      displayDecimals: 4,
      decimals: 18,
      address: "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa", // WETH address on Matic Mumbai
      shareToken: "",
      usdPrice: "2000",
      asset: "ETH",
    },
  ];

  return cashes;
};

export default output;


          // fake data
          // let vaults: VaultInfos = {};
          // let emptyMarket = {
          //   bondPool: "0x1",
          //   marketId: "1",
          //   creationTimestamp: "1",
          //   long: "0x1",
          //   short: "0x1",
          //   parameters: {
          //     N: "1",
          //     sigma: "1",
          //     omega: "1",
          //     delta: "1",
          //     r: "1",
          //     s: "1",
          //     steak: "1"
          //   },
          //   phase: {
          //     duringAssessment: true,
          //     onlyReputable: true,
          //     resolved: false,
          //     alive: true,
          //     atLoss: false,
          //     base_budget: "0"
          //   },
          //   longZCB: "0x1",
          //   shortZCB: "0x1",
          //   approved_principal: "0",
          //   approved_yield: "0",
          //   utilizer: "0x1",
          // };
    
          // let emptyInstrument =  {
          //   trusted: false,
          //   isPool: true,
          //   balance: "0",
          //   faceValue: "0",
          //   principal: "0",
          //   expectedYield: "0",
          //   duration: "0",
          //   description: "a test description of the instrument",
          //   address: "0x1",
          //   type: 0,
          //   maturityDate: "0",
          //   poolData: { 
          //     saleAmount: "0",
          //     initPrice: "0",
          //     promisedReturn: "0",
          //     inceptionTime: "0",
          //     inceptionPrice: "0",
          //     leverageFactor: "1",
          //     APR: "0.5",
          //     NFTs: [
          //       {
          //           name: "NFT 1",
          //           symbol: "NFT1",
          //           tokenURI: "http://i2.wp.com/www.wonderslist.com/wp-content/uploads/2012/08/Kissing.jpg",
          //           address: "0x1",
          //           maxLTV: "0.5",
          //           APY:"2",
          //       },
          //       {
          //           name: "NFT 2",
          //           symbol: "NFT2",
          //           tokenURI: "http://i2.wp.com/www.wonderslist.com/wp-content/uploads/2012/08/Kissing.jpg",
          //           address: "0x2",
          //           maxLTV: "0.5",
          //           APY:"2",
          //       },
          //     ],
          //   }
          // };
    
          // let emptyVault: VaultInfo = {
          //   vaultId: "1",
          //   address: "0x1",
          //   marketIds: [],
          //   onlyVerified: false,
          //   default_params: {
          //     N: "1",
          //     sigma: "1",
          //     omega: "1",
          //     delta: "1",
          //     r: "1",
          //     s: "1",
          //     steak: "1"
          //   },
          //   r: "10",
          //   asset_limit:"0",
          //   total_asset_limit:"0",
          //   want: {
          //     address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",//usdc
          //     name: "USDC",
          //     symbol:"USDC",
          //     decimals: 6,
          //     displayDecimals: 2,
          //     asset: ""
          //   }
          // };
          // let _markets = {};
          // let instruments = {};
          // for (let i = 1; i < 10; i++) { 
          //   let vault: any = {};
          //   Object.assign(
          //     vault, 
          //     emptyVault,
          //     {
          //       vaultId: i.toString(),
          //       address: "0x" + i.toString(),
          //       marketIds: []
          //     }
          //   );
          //   for (let j= i + (i-1); j < i + (i-1) + 2; j++) {
          //     vault.marketIds.push(j.toString());
          //     Object.assign(
          //       _markets,
          //       {
          //         [j.toString()]: {
          //           ...emptyMarket,
          //           vaultId: i.toString(),
          //           longZCB: "0x" + j.toString(),
          //           shortZCB: "0x" + j.toString(),
          //           marketId: j.toString()
          //         }
          //       }
          //     );
          //     Object.assign(instruments,
          //       {
          //         [j.toString()]: {
          //           ...emptyInstrument,
          //           vaultId: i.toString(),
          //           marketId: j.toString(),
          //           utilizer: "0x" + j.toString()
          //         }
          //       })
          //   }
          //   Object.assign(vaults, {[i.toString()]: vault});
          // }
          // updateDataHeartbeat(vaults, 1, null, _markets, instruments);