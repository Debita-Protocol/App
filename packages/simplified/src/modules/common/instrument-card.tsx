import React, { useCallback } from "react";
import {Link} from "react-router-dom";
import { ValueLabel } from "@augurproject/comps/build/components/common/labels";
import { ethers, BigNumber, BytesLike } from "ethers";
//import { InstrumentData } from "@augurproject/comps/build/types";
import BN from "bignumber.js"
import { ContractCalls, useUserStore } from "@augurproject/comps";
import { PrimaryThemeButton } from "@augurproject/comps/build/components/common/buttons";
import Styles from "./instrument-card.styles.less"
const { checkInstrumentStatus } = ContractCalls;


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

// card displayed for info about stuff. optional link to acutal instrument if on profile page.
const InstrumentCard = ({
    instrument,
    isLink,
    path,
    query
}:{instrument: InstrumentData, isLink: boolean, path:string, query:string}) => {

    let _duration = new BN(instrument.duration).div(24*60*60).toFixed(6).toString()
    let type_label = parseInt(instrument.instrument_type) === 0 ? "Credit Line" : "Other"

    const { account, loginAccount } = useUserStore();

    const handleCheck = useCallback(async () => {
        let tx = await checkInstrumentStatus(account, loginAccount.library, instrument.Instrument_address)

        await tx.wait();
        console.log("checked loan!")
    })

    let Props = (
        <>
            <span>
                Instrument:
            </span>
            <section className={Styles.InstrumentLabels}>
                <ValueLabel label={"Approved"} value={instrument.trusted ? "Yes" : "No"}/>
                <ValueLabel label={"Balance"} value={ instrument.balance }/>
                <ValueLabel label={"Duration (Days)"} value={ _duration }/>
                <ValueLabel label={"Face Value"} value={ instrument.faceValue }/> 
                <ValueLabel label={"MarketId"} value={ instrument.marketId }/>
                <ValueLabel label={"Principal"} value={ instrument.principal }/>
                <ValueLabel label={"Expected Yield"} value={ instrument.expectedYield }/> 
                <ValueLabel label={"Type"} value={ type_label }/>
                <ValueLabel label={"Instrument Address"} value={ instrument.Instrument_address }/>
            </section>
            <div className={"Description"}>
                <span>Description</span>
                <br />
                { instrument.description }
            </div>
            <PrimaryThemeButton id={instrument.marketId} text={"Check Instrument Status"} action={handleCheck}/>
        </>   
    )

    console.log("HERE IS INSTRUMENT", instrument)

    return (
        <>
            <section className={Styles.InstrumentCard}>
            {isLink ? (
                <div>
                    <Link
                        to={{
                            pathname: path,
                            search: query,
                          }}
                    >
                    {Props}
                    </Link>
                </div>
            ) : (
                <div>
                    {Props}
                </div>
            )}
            </section>

        </>
    )
}

export default InstrumentCard;
