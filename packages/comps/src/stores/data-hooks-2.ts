import { dispatchMiddleware, arrayToKeyedObjectByProp } from "./utils";
import { useReducer } from "react";
import { windowRef } from "../utils/window-ref";
import { DATA_ACTIONS_2, DATA_KEYS_2, DEFAULT_DATA_STATE_2 } from "./constants-2";
import { calculateAmmTotalVolApy } from "../utils/contract-calls";

const { UPDATE_DATA_HEARTBEAT, UPDATE_PRICES } = DATA_ACTIONS_2;
const { VAULTS, BLOCKNUMBER, ERRORS, CASHES, MARKETS, INSTRUMENTS } = DATA_KEYS_2;

export function DataReducer2(state, action) {
  const updatedState = { ...state };
  console.log("data reducer action: ", action)
  switch (action.type) {
    case UPDATE_DATA_HEARTBEAT:
      const { vaults, blocknumber, errors, markets, instruments, prices } = action;
      updatedState[VAULTS] = vaults;
      updatedState[BLOCKNUMBER] = blocknumber;
      updatedState[ERRORS] = errors;
      updatedState[MARKETS] = markets;
      updatedState[INSTRUMENTS] = instruments;
      updatedState["prices"] = prices;
      break
    case UPDATE_PRICES:
      const { prices: p } = action;
      updatedState["prices"] = p;
    default:
      console.log(`Error: ${action.type} not caught by Graph Data reducer`);
  }
  windowRef.data = updatedState;
  return updatedState;
}

export const useData2 = (cashes, defaultState = DEFAULT_DATA_STATE_2) => {
  const stateCashes = cashes.reduce((acc, cash) => {
    acc[cash.address] = cash;
    return acc;
  }, {});

  const [state, pureDispatch] = useReducer(DataReducer2, { ...defaultState, [CASHES]: stateCashes });
  const dispatch = dispatchMiddleware(pureDispatch);
  windowRef.data = state;

  return {
    ...state,
    actions: {
      updateDataHeartbeat: (vaults, blocknumber, errors, markets, instruments, prices) =>
        dispatch({
          type: UPDATE_DATA_HEARTBEAT,
          vaults,
          blocknumber,
          errors,
          markets,
          instruments,
          prices
        }),
      updatePrices: (prices) =>
        dispatch(
          {
            type: UPDATE_PRICES,
            prices
          }
        )
    },
  };
};
