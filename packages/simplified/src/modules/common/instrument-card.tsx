import React, { useCallback } from "react";
import {Link} from "react-router-dom";
import { ValueLabel } from "@augurproject/comps/build/components/common/labels";
import { ethers, BigNumber, BytesLike } from "ethers";
//import { InstrumentData } from "@augurproject/comps/build/types";
import BN from "bignumber.js"
import { ContractCalls, useUserStore } from "@augurproject/comps";
import { PrimaryThemeButton } from "@augurproject/comps/build/components/common/buttons";

const { checkInstrumentStatus } = ContractCalls;



interface InstrumentCardProps {
    isLink: boolean,
    path: string,
    query: string,
    trusted: boolean, 
    balance: string, 
    faceValue: string,
    marketId: string,
    principal: string, 
    expectedYield: string, 
    duration: string,
    description: string, 
    address: string,
    instrument_type: string,
}
// card displayed for info about stuff. optional link to acutal instrument if on profile page.
const InstrumentCard = ({
    isLink,
    path,
    query,
    trusted, 
    balance, 
    faceValue,
    marketId,
    principal, 
    expectedYield, 
    duration,
    description, 
    address,
    instrument_type,
}:InstrumentCardProps) => {

    let _duration = new BN(duration).div(24*60*60).toFixed(6).toString()
    let type_label = parseInt(instrument_type) === 1 ? "Credit Line" : "Other"

    const { account, loginAccount } = useUserStore();

    const handleCheck = useCallback(async () => {
        let tx = await checkInstrumentStatus(account, loginAccount.library, address)

        await tx.wait();
        console.log("checked loan!")
    })

    let Props = (
        <>
            <section>
                <ValueLabel label={"Approved"} value={trusted ? "Yes" : "No"}/>
                <ValueLabel label={"Balance"} value={ balance }/>
                <ValueLabel label={"Duration (Days)"} value={ _duration }/>
                <ValueLabel label={"Face Value"} value={ faceValue }/> 
                <ValueLabel label={"MarketId"} value={ marketId }/>
                <ValueLabel label={"Principal"} value={ principal }/>
                <ValueLabel label={"Expected Yield"} value={ expectedYield }/> 
                <ValueLabel label={"Type"} value={ type_label }/>
                <ValueLabel label={"Instrument Address"} value={ address }/>
            </section>
            <div>
                <span>Description</span>
                { description }
            </div>
            <PrimaryThemeButton id={marketId} text={"Check Instrument Status"} action={handleCheck}/>
        </>   
    )

    return (
        <>
            <section>
                { isLink ? (
                    <Link to={
                        {
                            pathname: path,
                            search: query
                        }
                    }>
                        { Props }       
                    </Link>
                ) : (
                    {Props}
                )}
            </section>
        </>
    )
}

export default InstrumentCard;
