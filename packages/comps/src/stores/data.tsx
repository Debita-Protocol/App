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
import { getMarketInfos, getRewardsStatus, getVaultInfos } from "../utils/contract-calls";
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
    
    const getMarkets = async () => {
      console.log("calling getMarkets...");
      const { account: userAccount, loginAccount } = UserStore.get();
      const { isRpcDown, isWalletRpc } = AppStatusStore.get();
      // const { blocknumber: dblock, markets: dmarkets, ammExchanges: damm } = DataStore.get();
      const { blocknumber: dblock, vaults: dvaults } = DataStore.get();

      const { actions: { setIsRpcDown } } = AppStatusStore;
      const provider = isWalletRpc ? loginAccount?.library : getDefaultProvider() || loginAccount?.library;
      let infos = { vaults: dvaults , blocknumber: dblock };

      try {
        infos = await getVaultInfos(
          provider,
          userAccount
        );
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
      return { vaults: {}, blocknumber: null };
    };

    getMarkets().then(({ vaults, blocknumber }) => {
      isMounted &&
        blocknumber &&
        blocknumber > DataStore.get().blocknumber &&
        updateDataHeartbeat(vaults, blocknumber, null);

      intervalId = setInterval(() => {
        getMarkets().then(({ vaults, blocknumber }) => {
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
