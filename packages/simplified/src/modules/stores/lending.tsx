import React, { useState, useEffect, useReducer, useContext } from "react"
import { useWeb3React } from "@web3-react/core";
// import { useWalletBalances } from "./wallet.tsx";

// const LendingContext = React.createContext();

// export const useLendingStore = () => useContext(LendingContext);

// //account balances of deposited tokens + number of minted dss?

// export const LendingProvider = ({ children }: any) => {
//     const {
//         account,
//         activate,
//         active,
//         chainId,
//         connector,
//         deactivate,
//         error,
//         provider,
//         setError,
//     } = useWeb3React();
//     const [ walletBalances ] = useWalletBalances();
// }