import { useUserStore } from "@augurproject/comps";
import React, { useCallback, useEffect, useState } from "react";
import Styles from "./user-profile-view.styles.less";
import { PassportReader } from "@gitcoinco/passport-sdk-reader";
import MarketStyles from "../market/market-view.styles.less";
import ProfileCard from "../common/profile-card";


const PASSPORT_CERAMIC_NODE_URL = "https://ceramic.staging.dpopp.gitcoin.co";


const UserProfileView = () => {
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
        const _passport = await reader.getPassport(account);
        const verifiedPassport = await verifier.verifyPassport(account, _passport)
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
        <div className={Styles.UserProfileView}>
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

export default UserProfileView;