// creditline functionality => /creditline, borrow + repay + creditline specific functionality + checkLoan

import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router";
import {
    Utils,
    LabelComps,
    Stores,
    ContractCalls, 
    useUserStore
  } from "@augurproject/comps";
import { Loan } from "@augurproject/comps/build/types";
import { utils } from "ethers";
import Styles from "../market/market-view.styles.less";
import BN from "bignumber.js"
import { SecondaryThemeButton } from "@augurproject/comps/build/components/common/buttons";

const { PathUtils: { parseQuery } } = Utils;
const { ValueLabel } = LabelComps;

const PRICE_PRECISION = 6;
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

const { getInstrumentData, checkInstrumentStatus, borrow_from_creditline, repay_to_creditline} = ContractCalls;

interface InstrumentData {
    trusted: boolean; 
    balance: string; 
    faceValue: string;
    marketId: string; 
    principal: string; 
    expectedYield: string; 
    duration: string;
    description: string; 
    Instrument_address: string;
    instrument_type: string;
  }; 

const CreditLineView = () => {
    const { account, loginAccount } = useUserStore();
    const [ borrowAmount, setBorrowAmount ] = useState("0.0");
    const [ repayPrincipal, setRepayPrincipal ] = useState("0.0");
    const [ repayInterest, setRepayInterest ] = useState("0.0");
    const [ loading, setLoading ] = useState(false);
    const [ instrument, setInstrument ] = useState<>()

    const retrieveInstrument = useCallback(async () => {

    });
    
    const _borrow = useCallback(async () => {
        
    });

    const _repay = useCallback(async () => {
        
    });

    return (
        <div className={Styles.MarketView}>
            <ValueLabel large={true} label={"Loan ID"} value={loanId}/>
            <ValueLabel light={true} label={"Description"} value={loan.description}/>
            <ValueLabel small={true} label={ loan.recipient === NULL_ADDRESS ? "Discretionary" : "Smart Contract"} value={""}/>
            { loading ? (
                <div>
                    Loading...
                </div>
            ) : (
                <>
                <ValueLabel large={true} label={"Principal"} value={loan.principal}/>
                <ValueLabel large={true} label={"Total Interest"} value={loan.totalInterest}/>
                { (loan.approved && loan.repaymentDate < new Date().getSeconds()) ? (
                    <>
                        <ValueLabel label={"Repayment Date"} value={loan.repaymentDate}/>
                        <ValueLabel label={"Amount Borrowed"} value={loan.amoutnBorrowed}/>
                        <ValueLabel label={"Interest Repaid"} value={loan.interestRepaid}/>
                        <ValueLabel label={"Allowance"} value={loan.allowance}/>
                        <div>
                            <label>Borrow Amount: </label> <br />
                            <input 
                                type="text"
                                placeholder="0.0"
                                value={ borrowAmount }
                                onChange={(e) => {
                                if (/^\d*\.?\d*$/.test(e.target.value)) {
                                    setBorrowAmount(e.target.value)
                                }
                                }}
                            />
                            <SecondaryThemeButton action={_borrow} text={"borrow"}/>s
                        </div>
                        <br />
                        <div className="principal">
                            <label>Repay Principal: </label> <br />
                            <input 
                                type="text"
                                placeholder="0.0"
                                value={ repayPrincipal }
                                onChange={(e) => {
                                if (/^\d*\.?\d*$/.test(e.target.value)) {
                                    setRepayPrincipal(e.target.value)
                                }
                                }}
                            />
                            <label>Repay Interest: </label> <br />
                            <input 
                                type="text"
                                placeholder="0.0"
                                value={ repayInterest }
                                onChange={(e) => {
                                if (/^\d*\.?\d*$/.test(e.target.value)) {
                                    setRepayInterest(e.target.value)
                                }
                                }}
                            />
                        </div>
                        <SecondaryThemeButton action={_repay} text={"repay"}/>
                    </>
                ) : (
                    <>
                        <ValueLabel label={"Duration (days): "} value={loan.duration}/>
                    </>
                )
                }
                </>
            )
            }
        </div>
    )

}

export default LoanView;