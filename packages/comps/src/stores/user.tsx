import React, {useEffect} from "react";
import { DEFAULT_USER_STATE, NETWORK_BLOCK_REFRESH_TIME, PARA_CONFIG, STUBBED_USER_ACTIONS } from "./constants";
import { useUser } from "./user-hooks";
import { AppStatusStore } from "./app-status";
import { getDefaultProvider } from "../components/ConnectAccount/utils";
import { getRammData } from "../utils/contract-calls-new";
import { DataStore2 } from "./data-2";

export const UserContext = React.createContext({
  ...DEFAULT_USER_STATE,
  actions: STUBBED_USER_ACTIONS,
});

export const UserStore = {
  actionsSet: false,
  get: () => ({ ...DEFAULT_USER_STATE }),
  actions: STUBBED_USER_ACTIONS,
};

export const UserProvider = ({ children }: any) => {
  const state = useUser();
  
  if (!UserStore.actionsSet) {
    UserStore.actions = state.actions;
    UserStore.actionsSet = true;
  }
  const readableState = { ...state };
  delete readableState.actions;
  UserStore.get = () => readableState;
  const networkId = Number(PARA_CONFIG.networkId);
  const { account, loginAccount, actions: {updateRammData}} = state;  
  const { vaults, markets, instruments} = DataStore2.get();
  
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;
    
    const getUserData = async () => {
  
      const { isRpcDown, isWalletRpc } = AppStatusStore.get();
      const { actions: { setIsRpcDown } } = AppStatusStore;
      
      const provider = isWalletRpc ? loginAccount?.library : getDefaultProvider() || loginAccount?.library;

      if ( account) {
        console.log("HERE BABY")
        try {
          const rammData = await  getRammData(account, provider, vaults, markets, instruments);
          console.log("rammData", rammData)
  
          return rammData;
        } catch (e) {
          if (e.data?.error?.details) {
            if (e.data?.error?.details.toLowerCase().indexOf("rate limit") !== -1) {
              if (e.data?.error?.data?.rate_violated.toLowerCase().indexOf("700 per 1 minute") !== -1) {
                setIsRpcDown(true);
              }
            }
          }
          console.log("error getting ramm user data", e);
        }
      }
      return { reputationScore: "", vaultBalances: {}, zcbBalances: {}, poolInfos: {} };
    }

    getUserData().then((ramm)=> {
      isMounted && updateRammData(ramm)
    })

    intervalId = setInterval(() => {
      getUserData().then((ramm) => {
        isMounted &&
          updateRammData(ramm)
      });
    }, 1200);


    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  },[account, loginAccount, vaults, markets, instruments])
  

  return <UserContext.Provider value={state}>{children}</UserContext.Provider>;
};

export const useUserStore = () => React.useContext(UserContext);

const output = {
  UserProvider,
  useUserStore,
  UserStore,
};

export default output;
