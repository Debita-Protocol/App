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
import { getContractData, getRammData } from "../utils/contract-calls-new";
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
  const { account, actions: {updateRammData} } = useUserStore();
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

      const { account: userAccount, loginAccount } = UserStore.get();
      const { isRpcDown, isWalletRpc } = AppStatusStore.get();
      const { 
        blocknumber: dblock, 
        vaults: dvaults, 
        instruments: dinstruments,
        markets: dmarkets,
        prices: dprices
      } = DataStore2.get();

      const { actions: { setIsRpcDown } } = AppStatusStore;
      const provider = isWalletRpc ? loginAccount?.library : getDefaultProvider() || loginAccount?.library;
      let infos = { vaults: dvaults , blocknumber: dblock, instruments: dinstruments, markets: dmarkets, prices: dprices };

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
      
      return { vaults: {}, blocknumber: 1, markets: {}, instruments: {}, prices: {} };
    };

    getData().then(({ vaults, blocknumber, markets, instruments, prices }) => {
      isMounted &&
        blocknumber &&
        blocknumber > DataStore2.get().blocknumber &&
        updateDataHeartbeat(vaults, blocknumber, null, markets, instruments, prices);

      intervalId = setInterval(() => {
        getData().then(({ vaults, blocknumber, markets, instruments, prices }) => {

          isMounted &&
            blocknumber &&
            blocknumber > DataStore2.get().blocknumber &&
            updateDataHeartbeat(vaults, blocknumber, null, markets, instruments, prices);
        });
      }, NETWORK_BLOCK_REFRESH_TIME[networkId]);
    });

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

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