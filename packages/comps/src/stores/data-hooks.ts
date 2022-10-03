import { dispatchMiddleware, arrayToKeyedObjectByProp } from "./utils";
import { useReducer } from "react";
import { windowRef } from "../utils/window-ref";
import { DATA_ACTIONS, DATA_KEYS, DEFAULT_DATA_STATE } from "./constants";
import { calculateAmmTotalVolApy } from "../utils/contract-calls";

const { UPDATE_DATA_HEARTBEAT } = DATA_ACTIONS;
const { VAULTS, BLOCKNUMBER, ERRORS, CASHES } = DATA_KEYS;

export function DataReducer(state, action) {
  const updatedState = { ...state };
  switch (action.type) {
    case UPDATE_DATA_HEARTBEAT:
      const { vaults, blocknumber, errors} = action;
      updatedState[VAULTS] = vaults;
      updatedState[BLOCKNUMBER] = blocknumber;
      updatedState[ERRORS] = errors;
      break
    default:
      console.log(`Error: ${action.type} not caught by Graph Data reducer`);
  }
  windowRef.data = updatedState;
  return updatedState;
}

export const useData = (cashes, defaultState = DEFAULT_DATA_STATE) => {
  const stateCashes = cashes.reduce((acc, cash) => {
    acc[cash.address] = cash;
    return acc;
  }, {});

  const [state, pureDispatch] = useReducer(DataReducer, { ...defaultState, [CASHES]: stateCashes });
  const dispatch = dispatchMiddleware(pureDispatch);
  windowRef.data = state;

  return {
    ...state,
    actions: {
      updateDataHeartbeat: (vaults, blocknumber, errors) =>
        dispatch({
          type: UPDATE_DATA_HEARTBEAT,
          vaults,
          blocknumber,
          errors,
        }),
    },
  };
};
