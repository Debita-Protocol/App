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
const { PathUtils: { parseQuery } } = Utils;

const useAddressQuery = () => {
    const location = useLocation();
    const { address } = parseQuery(location.search);
    return address;
};


const PASSPORT_CERAMIC_NODE_URL = "https://ceramic.staging.dpopp.gitcoin.co";

// for displaying borrower - market profile., takes marketID => get's borrower address
const ProfileView = () => {
    const address = useAddressQuery();
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
    console.log("passport: ", passport)
    console.log("activePassport: ", activePassport)

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

    useEffect(() => {
        getPassport()
    }, [])
    
    return (
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
    )
}


export default ProfileView;