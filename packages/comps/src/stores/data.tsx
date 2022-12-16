import React, { useEffect } from "react";
import {
  DEFAULT_DATA_STATE,
  STUBBED_DATA_ACTIONS,
  PARA_CONFIG,
  NETWORK_BLOCK_REFRESH_TIME,
  MULTICALL_MARKET_IGNORE_LIST,
  DEFAULT_INSTRUMENT_STATE, 
} from "./constants";
import { useData } from "./data-hooks";
import { useUserStore, UserStore } from "./user";
import { getMarketInfos, getRewardsStatus, 
  //getVaultInfos 
} from "../utils/contract-calls";
import { VaultInfos } from "types";
import { getAllTransactions } from "../apollo/client";
import { getDefaultProvider } from "../components/ConnectAccount/utils";
import { AppStatusStore } from "./app-status";
import { MARKET_LOAD_TYPE } from "../utils/constants";
import {dsAddress} from "../data/constants"

export const DataContext = React.createContext({
  ...DEFAULT_DATA_STATE,
  actions: STUBBED_DATA_ACTIONS,
});

export const DataStore = {
  actionsSet: false,
  get: () => ({ ...DEFAULT_DATA_STATE }),
  actions: STUBBED_DATA_ACTIONS,
};

export const DataProvider = ({ loadType = MARKET_LOAD_TYPE.SIMPLIFIED, children }: any) => {
  const { account } = useUserStore();
  const configCashes = getCashesInfo();
  const state = useData(configCashes);
  console.log("state: ", state);
  const {
    actions: { updateDataHeartbeat },
  } = state;

  if (!DataStore.actionsSet) {
    DataStore.actions = state.actions;
    DataStore.actionsSet = true;
  }
  const readableState = { ...state };
  delete readableState.actions;
  DataStore.get = () => readableState;
  const networkId = Number(PARA_CONFIG.networkId);
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;
    
    const getVaults = async () => {
      console.log("calling getMarkets...");
      const { account: userAccount, loginAccount } = UserStore.get();
      const { isRpcDown, isWalletRpc } = AppStatusStore.get();
      // const { blocknumber: dblock, markets: dmarkets, ammExchanges: damm } = DataStore.get();
      const { blocknumber: dblock, vaults: dvaults } = DataStore.get();

      const { actions: { setIsRpcDown } } = AppStatusStore;
      const provider = isWalletRpc ? loginAccount?.library : getDefaultProvider() || loginAccount?.library;
      let infos = { vaults: dvaults , blocknumber: dblock };

      // try {
      //   infos = await getVaultInfos(
      //     provider,
      //     userAccount
      //   );
      //   console.log('infos: ', infos)
      //   if (isRpcDown) {
      //     setIsRpcDown(false);
      //   }
      //   return infos;
      // } catch (e) {
      //   if (e.data?.error?.details) {
      //     if (e.data?.error?.details.toLowerCase().indexOf("rate limit") !== -1) {
      //       if (e.data?.error?.data?.rate_violated.toLowerCase().indexOf("700 per 1 minute") !== -1) {
      //         setIsRpcDown(true);
      //       }
      //     }
      //   }
      //   console.log("error getting market data", e);
      // }
      // return { vaults: {}, blocknumber: null };
      let vaults: VaultInfos = {};
      let emptyMarket = {
        bondPool: "0x1",
        marketId: "1",
        creationTimestamp: "1",
        long: "0x1",
        short: "0x1",
        parameters: {
          N: "1",
          sigma: "1",
          omega: "1",
          delta: "1",
          r: "1",
          s: "1",
          steak: "1"
        },
        phase: {
          duringAssessment: true,
          onlyReputable: true,
          resolved: false,
          alive: true,
          atLoss: false,
          base_budget: "0"
        },
        longZCB: "0x1",
        shortZCB: "0x1",
        instrument: {
          trusted: false,
          isPool: false,
          balance: "0",
          faceValue: "0",
          principal: "0",
          expectedYield: "0",
          duration: "0",
          description: "a test description of the instrument",
          address: "0x1",
          type: 0,
          maturityDate: "0",
          poolData: { 
            saleAmount: "0",
            initPrice: "0",
            promisedReturn: "0",
            inceptionTime: "0",
            inceptionPrice: "0",
            leverageFactor: "1"
          }
        },
        approved_principal: "0",
        approved_yield: "0",
        utilizer: "0x1",
      };
      let emptyVault = {
        vaultId: "1",
        address: "0x1",
        marketIds: [],
        onlyVerified: false,
        default_params: {
          N: "1",
          sigma: "1",
          omega: "1",
          delta: "1",
          r: "1",
          s: "1",
          steak: "1"
        },
        r: "10",
        asset_limit:"0",
        total_asset_limit:"0",
        collateral_address:"0x1",
        markets: {}
      };
      for (let i = 1; i < 10; i++) { 
        vaults[i.toString()] = {
          ...emptyVault,
          vaultId: i.toString(),
          address: "0x" + i.toString(),
          marketIds: [i.toString()] 
        }
        // vaults[i.toString()].vaultId = i.toString();
        // vaults[i.toString()].address = "0x" + i.toString();
        // vaults[i.toString()].marketIds.push(i.toString());
        
        // for (let j= i + (i-1); j < i + (i-1) + 2; j++) {
        //   console.log("j: ", j)
        //   console.log("i: ", i)
        //   console.log("vaultId: ", vaults[i.toString()].vaultId);
        //   vaults[i.toString()].marketIds.push(j.toString());
        //   vaults[i.toString()].markets[j.toString()] = {
        //     ...emptyMarket
        //   }
          // vaults[i.toString()].markets[j.toString()].marketId = j.toString();
          // vaults[i.toString()].markets[j.toString()].long = "0x" + j.toString();
          // vaults[i.toString()].markets[j.toString()].short = "0x" + j.toString();
          // vaults[i.toString()].markets[j.toString()].longZCB = "0x" + j.toString();
          // vaults[i.toString()].markets[j.toString()].shortZCB = "0x" + j.toString();
          // vaults[i.toString()].markets[j.toString()].instrument.address = "0x" + j.toString();
        // }
      }
      return { vaults, blocknumber: 1 };
    };

    getVaults().then(({ vaults, blocknumber }) => {
      isMounted &&
        blocknumber &&
        blocknumber > DataStore.get().blocknumber &&
        updateDataHeartbeat(vaults, blocknumber, null);

      intervalId = setInterval(() => {
        getVaults().then(({ vaults, blocknumber }) => {
          isMounted &&
            blocknumber &&
            blocknumber > DataStore.get().blocknumber &&
            updateDataHeartbeat(vaults, blocknumber, null);
        });
      }, NETWORK_BLOCK_REFRESH_TIME[networkId]);
    });

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // removed record of transactions => need to build subgraph first

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
};

export const useDataStore = () => React.useContext(DataContext);

const output = {
  DataProvider,
  useDataStore,
  DataStore,
};

// for now we jsut do this here...
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
      symbol: "USDC",
      usdPrice: "1"
    },
    {
      name: "ETH",
      displayDecimals: 4,
      decimals: 18,
      address: "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa", // WETH address on Matic Mumbai
      usdPrice: "2000",
    },
  ];

  return cashes;
};

export default output;
