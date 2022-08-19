import { useLocation } from "react-router";
import {
    Utils,
    LabelComps,
    Stores,
    ContractCalls, 
    useUserStore
} from "@augurproject/comps";
import ProfileCard from "../common/profile-card";
import Styles from "./profile-view.styles.less";
import React, { useCallback, useEffect, useState } from "react";
import { PassportReader } from "@gitcoinco/passport-sdk-reader";
import InstrumentCard from "../common/instrument-card";
import BigNumber from "bignumber.js";

const { getInstrumentData } = ContractCalls

const { PathUtils: { makePath, makeQuery, parseQuery } } = Utils;



const useAddressQuery = () => {
    const location = useLocation();
    const { address } = parseQuery(location.search); //TODO make sure it's a valid address
    return address;
};


const PASSPORT_CERAMIC_NODE_URL = "https://ceramic.staging.dpopp.gitcoin.co";

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

// for displaying borrower - market profile., takes marketID => get's borrower address
const ProfileView = () => {
    const query_address = useAddressQuery();
    const {
        account,
        loginAccount,
        passport,
        activePassport,
        actions: {
            updatePassport,
            updatePassportStatus
        }
    } = useUserStore()
    const isUser = !query_address;
    let address = query_address ? query_address : account;
    const [instrument, setInstrument] = useState<InstrumentData>({
        trusted: true,
        balance: "150.052", 
        faceValue: "200.5",
        marketId: "1",
        principal: "175.0",
        expectedYield: "25.5", 
        duration: "31536000",
        description: "a description about the usage of the creditline perhaps", 
        Instrument_address: "address",
        instrument_type: "0"
    })
    const [path, setPath] = useState("creditline")
    const [query, setQuery] = useState("")
    const [ isLink, setIsLink ] = useState(isUser && path.length > 0)

    console.log("passport: ", passport)
    console.log("activePassport: ", activePassport)
    console.log("instrument:", instrument)
    console.log("query address: ", query_address)

    const getPassport = useCallback(async () => {
        // Dynamically load @gitcoinco/passport-sdk-verifier
        const PassportVerifier = (await import("@gitcoinco/passport-sdk-verifier")).PassportVerifier;
        const verifier = new PassportVerifier(PASSPORT_CERAMIC_NODE_URL);
        const reader = new PassportReader(PASSPORT_CERAMIC_NODE_URL)
        const _passport = await reader.getPassport(address);
        const verifiedPassport = await verifier.verifyPassport(address, _passport)
        console.log("Verified Passport: ", verifiedPassport)

        if (!_passport) {
            updatePassportStatus(false)
        } else {
            updatePassport(verifiedPassport)
            updatePassportStatus(true)
        }
    }, [account, loginAccount])

    const getInstruments = useCallback(async ()=> {
        const _instrument = await getInstrumentData(address, loginAccount.library)
        if (parseInt(_instrument.marketId) === 0) {
            console.log(_instrument)
            setInstrument(_instrument)
        }
        if (_instrument.trusted && isUser && parseInt(_instrument.instrument_type) === 0 ) {
            setPath(makePath("creditline"))
        }
    })

    useEffect(() => {
        getPassport()
        //getInstruments()
    }, [])
    
    return (
        <>
            <div className={Styles.ProfileView}>
                {activePassport ? (
                    <ProfileCard passport={passport}/>
                ) : (
                    <div>
                        No Passport Found ...
                    </div>
                )
                }
            </div>
            <section>
                <InstrumentCard
                    isLink={isLink}
                    path={path}
                    query={query}
                    instrument={instrument}
                />
            </section>
        </>
    )
}


export default ProfileView;