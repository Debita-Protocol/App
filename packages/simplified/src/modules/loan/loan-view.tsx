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


const { getLoan, borrow, repay } = ContractCalls;
const { parseBytes32String, formatBytes32String } = utils;

export const useLoanIdQuery = () => {
    const location = useLocation();
    const { id: loanId } = parseQuery(location.search);
    return loanId;
  };

const LoanView = () => {
    const loanId = useLoanIdQuery();
    const [ loan, setLoan ] = useState({
        principal: "",
        duration: "",
        totalInterest: "",
        repaymentDate: "",
        interestPaid: "",
        allowance: "",
        amountBorrowed: "",
        description: "",
        approved: false,
        recipient: ""
    });
    const { account, loginAccount } = useUserStore();
    const [ borrowAmount, setBorrowAmount ] = useState("0.0");
    const [ repayPrincipal, setRepayPrincipal ] = useState("0.0");
    const [ repayInterest, setRepayInterest ] = useState("0.0");
    const [ loading, setLoading ] = useState(false);
    
    const retrieveLoan = useCallback(async () => {
        if (account && loginAccount.library) {
            setLoading(true);
            try {
                console.log("Loan ID: ", loanId)
                let _loan = await getLoan(account, loginAccount.library, account, loanId);
                
                const principal = new BN(_loan.principal.toNumber()).div(10**PRICE_PRECISION).toString();
                const duration = new BN(_loan.duration.toNumber()).div(24*60*60).toString();
                const totalInterest = new BN(_loan.totalInterest.toNumber()).div(10**PRICE_PRECISION).toString();
                const repaymentDate = new Date(Number(_loan.repaymentDate) * 1000).toDateString()
                const interestPaid = new BN(_loan.interestPaid.toNumber()).div(10**PRICE_PRECISION).toString();
                const allowance = new BN(_loan.allowance.toNumber()).div(10**PRICE_PRECISION).toString();
                const amountBorrowed = new BN(_loan.amountBorrowed.toNumber()).div(10**PRICE_PRECISION).toString();
                const approved = _loan.approved;
                const recipient = _loan.recipient;

                setLoan({
                    principal,
                    duration,
                    totalInterest,
                    repaymentDate,
                    interestPaid,
                    allowance,
                    amountBorrowed,
                    approved,
                    recipient
                });
            } catch (err) {
                console.log("error retrieving loan", err.reason)
            }
            setLoading(false);
        }
    })

    useEffect(() => {
        retrieveLoan()
    }, [])

    const _borrow = useCallback(async () => {
        if (account && loginAccount.library) { 
            try {
                const tx = await borrow(account, loginAccount.library, loanId, borrowAmount)
                await tx.wait()
            } catch (err) {
                console.log("error borrowing funds", err)
                console.log("account: ", account)
                console.log("borrow amount: ", borrowAmount)
            }
        }
        retrieveLoan()
    });

    const _repay = useCallback(async () => {
        if (account && loginAccount.library) { 
            try {
                const tx = await repay(account, loginAccount.library, loanId, repayPrincipal, repayInterest)
                await tx.wait()
            } catch (err) {
                console.log("error repaying funds", err)
                console.log("account: ", account)
                console.log("repay amount: ", repayPrincipal, repayInterest)
            }
        }
        retrieveLoan()
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
                                    repayPrincipal(e.target.value)
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