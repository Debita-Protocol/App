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
import { utils } from "ethers";
import Styles from "./creditline-view.styles.less";
import BN from "bignumber.js"
import { SecondaryThemeButton } from "@augurproject/comps/build/components/common/buttons";
import InstrumentCard from "../common/instrument-card";

const { PathUtils: { parseQuery } } = Utils;
const { ValueLabel } = LabelComps;

const PRICE_PRECISION = 6;
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

const { getFormattedInstrumentData, checkInstrumentStatus, borrow_from_creditline, repay_to_creditline} = ContractCalls;

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
    maturityDate: string;
  }; 

const CreditLineView = () => {
    const { account, loginAccount } = useUserStore();
    const [ borrowAmount, setBorrowAmount ] = useState("0.0");
    const [ repayPrincipal, setRepayPrincipal ] = useState("0.0");
    const [ repayInterest, setRepayInterest ] = useState("0.0");
    const [ loading, setLoading ] = useState(false);
    const [ instrument, setInstrument ] = useState<InstrumentData>({
        trusted: false,
        balance: "", 
        faceValue: "",
        marketId: "",
        principal: "",
        expectedYield: "", 
        duration: "",
        description: "", 
        Instrument_address: "",
        instrument_type: "",
        maturityDate: ""
    })

    const retrieveInstrument = useCallback(async () => {
        const result = await getFormattedInstrumentData(account, loginAccount.library)
        console.log("success retrieving instrument")
        console.log("marketId: ", result.marketId)
        setInstrument(result)
    });

    useEffect(() => {
        if (account && loginAccount) {
            retrieveInstrument()
        }
    },[account, loginAccount])
    
    const _borrow = useCallback(async (e) => {
        e.preventDefault();
        if (parseInt(instrument.marketID) !== 0) {
            try {
                const tx = await borrow_from_creditline(account, loginAccount.library, instrument.Instrument_address, borrowAmount)
                tx.wait()
                console.log("success borrowing amount: ", borrowAmount) 
            } catch (err) {
                console.log(err)
            }
        }
    });

    const _repay = useCallback(async () => {
        if (parseInt(instrument.marketID) !== 0) {
            try {
                const tx = await repay_to_creditline(account, loginAccount.library, instrument.Instrument_address, repayPrincipal, repayInterest)
                tx.wait()
                console.log("success repay principal: ", repayPrincipal)
                console.log("success repay interest: ", repayInterest) 
            } catch (err) {
                console.log(err)
            }
        }
    });

    
    return (
        <section className={Styles.CreditlineView}>
            <InstrumentCard isLink={false} path={""} query={""} instrument={instrument}/>
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
                <SecondaryThemeButton action={_borrow} text={"borrow"}/>
            </div>
            <div>
                <div>
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
                <div>
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
                </div>
                <SecondaryThemeButton action={_repay} text={"repay"}/>
            </div>
        </section>
    )

}

export default CreditLineView;