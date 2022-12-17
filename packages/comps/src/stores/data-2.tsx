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
import { getMarketInfos, getRewardsStatus, 
  //getVaultInfos 
} from "../utils/contract-calls";
import { VaultInfos, VaultInfo } from "types";
import { getAllTransactions } from "../apollo/client";
import { getDefaultProvider } from "../components/ConnectAccount/utils";
import { AppStatusStore } from "./app-status";
import { MARKET_LOAD_TYPE } from "../utils/constants";
import {dsAddress} from "../data/constants"

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
    actions: { updateDataHeartbeat },
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
    
    const getVaults = async () => {
      console.log("calling getMarkets...");
      const { account: userAccount, loginAccount } = UserStore.get();
      const { isRpcDown, isWalletRpc } = AppStatusStore.get();
      // const { blocknumber: dblock, markets: dmarkets, ammExchanges: damm } = DataStore.get();
      const { blocknumber: dblock, vaults: dvaults } = DataStore2.get();

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
        approved_principal: "0",
        approved_yield: "0",
        utilizer: "0x1",
      };

      let emptyInstrument =  {
        trusted: false,
        isPool: true,
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
        collateral_address:"0x1"
      };
      let _markets = {};
      let instruments = {};
      for (let i = 1; i < 10; i++) { 
        let vault: any = {};
        Object.assign(
          vault, 
          emptyVault,
          {
            vaultId: i.toString(),
            address: "0x" + i.toString(),
            marketIds: []
          }
        );
        for (let j= i + (i-1); j < i + (i-1) + 2; j++) {
          vault.marketIds.push(j.toString());
          Object.assign(
            _markets,
            {
              [j.toString()]: {
                ...emptyMarket,
                vaultId: i.toString(),
                longZCB: "0x" + j.toString(),
                shortZCB: "0x" + j.toString(),
                marketId: j.toString()
              }
            }
          );
          Object.assign(instruments,
            {
              [j.toString()]: {
                ...emptyInstrument,
                vaultId: i.toString(),
                marketId: j.toString(),
                utilizer: "0x" + j.toString(),
              }
            })
        }
        Object.assign(vault, {markets: _markets});
        Object.assign(vaults, {[i.toString()]: vault});
      }
      
      return { vaults, blocknumber: 1, markets: _markets, instruments };
    };

    getVaults().then(({ vaults, blocknumber, markets, instruments }) => {
      isMounted &&
        blocknumber &&
        blocknumber > DataStore2.get().blocknumber &&
        updateDataHeartbeat(vaults, blocknumber, null, markets, instruments);

      // intervalId = setInterval(() => {
      //   getVaults().then(({ vaults, blocknumber }) => {
      //     isMounted &&
      //       blocknumber &&
      //       blocknumber > DataStore.get().blocknumber &&
      //       updateDataHeartbeat(vaults, blocknumber, null);
      //   });
      // }, NETWORK_BLOCK_REFRESH_TIME[networkId]);
    });

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // removed record of transactions => need to build subgraph first

  return <DataContext2.Provider value={state}>{children}</DataContext2.Provider>;
};

export const useDataStore2 = () => React.useContext(DataContext2);

const output = {
  DataProvider2,
  useDataStore2,
  DataStore2,
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
