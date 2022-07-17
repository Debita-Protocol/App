

import React, { useEffect,useState } from "react";
// import { useSimplified } from "../stores/simplified-hooks";
// import { useUserStore, Stores, ContractCalls } from "@augurproject/comps";


// const {mintDS} = ContractCalls;


export const MarketCardContext = React.createContext()




export const MarketCardProvider = ({ children }: any) => {

    const [currentAccount, setCurrentAccount] = useState()
    // const {
    // account,
    // loginAccount,
    // balances,
    // actions: { addTransaction },
    // } = useUserStore();
    const [formData, setFormData] = useState({
        addressTo: '',
        amount: '',
      })

    const handleChange = (e, name) => {
    console.log(name, e.target.value)
    setFormData(prevState => ({ ...prevState, [name]: e.target.value }))
    }
    const handleSubmit =  () => {
  
    }
    const mint = () => {
      const { addressTo, amount } = formData
            console.log('MINTING!', amount.toString())

     

    }


  return <MarketCardContext.Provider value={{formData, 
    handleChange, mint}}>{children}</MarketCardContext.Provider>;
};

// export const useSimplifiedStore = () => React.useContext(SimplifiedContext);

