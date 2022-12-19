import React, {useEffect} from "react";
import { DEFAULT_USER_STATE, STUBBED_USER_ACTIONS } from "./constants";
import { useUser } from "./user-hooks";

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
  const { updateUserNFTBalances } = state.actions;

  // fake data
  useEffect(() => {
    updateUserNFTBalances({
      "0x1": {
          name: "NFT 1",
          symbol: "NFT1",
          balance: "1",
          usdValue: "100"
      },
      "0x2": {
          name: "NFT 2",
          symbol: "NFT2",
          balance: "2",
          usdValue: "200"
      }
    })
  },[])

  if (!UserStore.actionsSet) {
    UserStore.actions = state.actions;
    UserStore.actionsSet = true;
  }
  const readableState = { ...state };
  delete readableState.actions;
  UserStore.get = () => readableState;

  return <UserContext.Provider value={state}>{children}</UserContext.Provider>;
};

export const useUserStore = () => React.useContext(UserContext);

const output = {
  UserProvider,
  useUserStore,
  UserStore,
};

export default output;
