// should be able to call => check if borrower submitted proposal fee (i.e. check if registered). submit proposal

import { ContractCalls } from "@augurproject/comps";
import React, { useContext, useState } from "react";
const BorrowContext = React.createContext();

// const { checkLoanRegistration } = ContractCalls;

// const LendingPoolCalls = { checkLoanRegistration, "hello":3 }

export const BorrowProvider = ({ children }) => {
    
    return (
        <BorrowContext.Provider value={"LendingPoolCalls"}> 
            {children}
        </BorrowContext.Provider>
    );
}

export const useBorrowContext = () => {
    return useContext(BorrowContext);
}