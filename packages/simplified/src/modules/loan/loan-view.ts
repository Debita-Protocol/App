import React, { useState, useEffect } from "react";
import { useLocation } from "react-router";
import {
    Utils,
    Components,
    Stores,
    ContractCalls, 
    useUserStore
  } from "@augurproject/comps";
import { Loan } from "@augurproject/comps/build/types";
const {
    PathUtils: { parseQuery },
  } = Utils;
const { getLoan } = ContractCalls;


export const useLoanIdQuery = () => {
    const location = useLocation();
    const { id: loanId } = parseQuery(location.search);
    return loanId;
  };

const LoanView = () => {
    const loanId = useLoanIdQuery();
    const [ loan, setLoan ] = useState<Loan>();
    const { account, loginAccount } = useUserStore();


    useEffect(() => {
        ;(async () => {
            if (account && loginAccount.library) {
                try {
                    setLoan(await getLoan(account, loginAccount.library, account, loanId));
                } catch (err) {
                    console.log("error retrieving loan", err.reason)
                }
            }
            
        })()
    },[account, loginAccount]);

    // const borrow = useCallback(async () => {

    // });

    // const repay = useCallback(async () => {
        
    // })
}

export default LoanView;