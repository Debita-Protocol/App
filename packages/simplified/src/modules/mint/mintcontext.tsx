

import React, { useEffect,useState } from "react";
import { DEFAULT_SIMPLIFIED_STATE, STUBBED_SIMPLIFIED_ACTIONS, SIMPLIFIED_STATE_KEYS } from "../stores/constants";
import { useSimplified } from "../stores/simplified-hooks";
import { useUserStore, Stores, ContractCalls } from "@augurproject/comps";


const {mintDS, mintVaultDS} = ContractCalls;


export const MintContext = React.createContext()



export const MintProvider = ({ children }: any) => {

    const [currentAccount, setCurrentAccount] = useState()
    const {
    account,
    loginAccount,
    balances,
    actions: { addTransaction },
    } = useUserStore();
    const [formData, setFormData] = useState({
        addressTo: '',
        amount: '',
      })

    const handleChange = (e, name) => {
    console.log(name, e.target.value)
    setFormData(prevState => ({ ...prevState, [name]: e.target.value }))
    }

    const mint = () => {
      const { addressTo, amount } = formData
            console.log('MINTING!', account, loginAccount.library, amount.toString())

      //mintDS(account, loginAccount.library, amount.toString(), true )
        mintVaultDS(account, loginAccount.library, amount.toString(), true)

    }


  return <MintContext.Provider value={{currentAccount,
    formData, handleChange, mint}}>{children}</MintContext.Provider>;
};

// export const useSimplifiedStore = () => React.useContext(SimplifiedContext);

