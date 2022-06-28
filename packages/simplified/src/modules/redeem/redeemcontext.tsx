

import React, { useEffect,useState } from "react";
import { DEFAULT_SIMPLIFIED_STATE, STUBBED_SIMPLIFIED_ACTIONS, SIMPLIFIED_STATE_KEYS } from "../stores/constants";
import { useSimplified } from "../stores/simplified-hooks";
import { useUserStore, Stores,ContractCalls } from "@augurproject/comps";


const {redeemDS} = ContractCalls;


export const RedeemContext = React.createContext()




export const RedeemProvider = ({ children }: any) => {

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
      console.log('amI redeeming??')
      redeemDS(account, loginAccount.library, amount.toString(), true )
     

    }


  return <RedeemContext.Provider value={{currentAccount,
    formData, handleChange, mint}}>{children}</RedeemContext.Provider>;
};

// export const useSimplifiedStore = () => React.useContext(SimplifiedContext);

