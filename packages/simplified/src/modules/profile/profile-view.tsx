import { useLocation } from "react-router";
import {
    Utils,
    LabelComps,
    Stores,
    ContractCalls, 
    ContractCalls2,
    useUserStore,
    useDataStore2
} from "@augurproject/comps";
// import ProfileCard from "../common/profile-card";
import Styles from "./profile-view.styles.less";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { PassportReader } from "@gitcoinco/passport-sdk-reader";
import InstrumentCard from "../common/instrument-card";
import BigNumber from "bignumber.js";
import { VaultBalances, ZCBBalances } from "@augurproject/comps/build/types";
import { Link } from "react-router-dom";
import { AppViewStats } from "../common/labels";

const { ContractSetup } = ContractCalls2;
const { ValueLabel } = LabelComps;
const { getFormattedInstrumentData } = ContractCalls

const { PathUtils: { makePath, makeQuery, parseQuery } } = Utils;


// reputation score + profile, vault balances, zcb balances,
const ProfileView: React.FC = () => {
    const { ramm: { reputationScore, vaultBalances, zcbBalances}} = useUserStore();
    console.log("Vault Balances: ", vaultBalances);
    const { vaults, instruments } = useDataStore2();
    const [loading, setLoading] = useState(true);

    const { account, loginAccount} = useUserStore();

    // non-zero vault balances.
    const filterVaults = (balances: VaultBalances) => { 
        let vaultIds = [];
        for (const [vaultId, val] of Object.entries(balances)) {
            if (val.shares !== "0") {
                vaultIds.push(vaultId);
            }
        }
        return vaultIds;
    }

    const filterMarkets = (zcbBalances: ZCBBalances) => {
        let marketIds = [];
        for (const [marketId, val] of Object.entries(zcbBalances)) {
            if (val.longZCB !== "0" || val.shortZCB !== "0") {
                marketIds.push(marketId);
            }
        }
        return marketIds;
    }

    const vaultIds = useMemo(() => {
        return filterVaults(vaultBalances);
    }, [vaultBalances]);
    const marketIds = useMemo(() => {
        return filterMarkets(zcbBalances);
    }, [zcbBalances]);

    return (
        <div className={Styles.ProfileView}>

            {/*<button onClick={()=> {console.log("Here"); ContractSetup(account, loginAccount.library)}}>
                Click Me
            </button>*/}

            <section className={Styles.UserDetailsView}>
                <ValueLabel label={"Reputation Score: "} value={reputationScore}/>
            </section>

            <div>
                <section className={Styles.UserVaultInfo}>
                    <h2>Vaults Balances: </h2>
                    { vaultIds && vaultIds?.length > 0 ? (
                        <div>
                            {vaultIds.map((vaultId) => {
                            const balance = vaultBalances[vaultId];
                            return (
                                <VaultCard key={vaultId} vaultId={vaultId} shareBalance={balance.shares} vaults={vaults} />
                            );

                        })}
                        </div>
                    ) : (
                        <div>
                            No Data Available.
                        </div>
                    )}
                    
                </section>
                <section className={Styles.UserVaultInfo}>
                    <h2>ZCB Postions</h2>
                    { marketIds && marketIds?.length > 0 ? (
                        <div>
                            {marketIds.map((marketId) => {
                        const zcbBalance = zcbBalances[marketId];
                        return (
                            <MarketCard key={marketId} marketId={marketId} zcbBalance={zcbBalance} instruments={instruments} />
                        )
                    })}
                    </div>) : (
                        <div className={Styles.EmptyMarketsMessage}>
                            No Data Available.
                        </div>
                    )
                    }
                </section>
            </div>
            <button onClick={()=> {console.log("Here"); ContractSetup(account, loginAccount.library)}}>
                Click Me
            </button>
        </div>
    )
}

export default ProfileView;

const VaultCard: React.FC = ({ vaultId, shareBalance, vaults}) => {
    const vault = useMemo(() => {
        return vaults[vaultId];
    }, [vaults, vaultId]);

    return (
        <Link to={{
            pathname: makePath("market-liquidity"),
            search: makeQuery({id: vaultId})
        }}>
        <div className={Styles.UserVaultCard}>
            <ValueLabel label={""} value={vault.name} />
            <ValueLabel label={"balance"} value={shareBalance} />
        </div>
        </Link>
    )
}

const MarketCard: React.FC = ({ marketId, zcbBalance, instruments }) => {
    const instrument = useMemo(() => {
        return instruments[marketId];
    }, [instruments, marketId]);

    return (
        <Link to={{
            pathname: makePath("market"),
            search: makeQuery({id: marketId})
        }}>
        <div className={Styles.UserVaultCard}>
            <ValueLabel label={""} value={instrument.name} />
            <ValueLabel label={"LongZCB balance"} value={zcbBalance.longZCB} />
            <ValueLabel label={"ShortZCB balance"} value={zcbBalance.shortZCB} />
        </div>
        </Link>
    )

}



// const PASSPORT_CERAMIC_NODE_URL = "https://ceramic.staging.dpopp.gitcoin.co";

// interface InstrumentData {
//     trusted: boolean; 
//     balance: string; 
//     faceValue: string;
//     marketId: string; 
//     principal: string;
//     expectedYield: string; 
//     duration: string;
//     description: string; 
//     Instrument_address: string;
//     instrument_type: string;
//     maturityDate: string;
//   }; 

// for displaying borrower - market profile., takes marketID => get's borrower address
// const ProfileView = () => {
//     const query_address = useAddressQuery();
//     const {
//         account,
//         loginAccount,
//         passport,
//         activePassport,
//         actions: {
//             updatePassport,
//             updatePassportStatus
//         }
//     } = useUserStore()
//     const isUser = !query_address;
//     let address = query_address ? query_address : account;
//     const [instrument, setInstrument] = useState<InstrumentData>({
//         trusted: false,
//         balance: "", 
//         faceValue: "",
//         marketId: "",
//         principal: "",
//         expectedYield: "", 
//         duration: "",
//         description: "", 
//         Instrument_address: "",
//         instrument_type: "",
//         maturityDate: ""
//     })

//     const [path, setPath] = useState("creditline")
//     const [query, setQuery] = useState("")
//     const [ isLink, setIsLink ] = useState(isUser && path.length > 0)

//     const getPassport = useCallback(async () => {
//         // Dynamically load @gitcoinco/passport-sdk-verifier
//         let _passport;
//         let verifiedPassport;
//         try {
//             const PassportVerifier = (await import("@gitcoinco/passport-sdk-verifier")).PassportVerifier;
//             const verifier = new PassportVerifier(PASSPORT_CERAMIC_NODE_URL);
//             const reader = new PassportReader(PASSPORT_CERAMIC_NODE_URL)
//             _passport = await reader.getPassport(address);
//             verifiedPassport = await verifier.verifyPassport(address, _passport)
//             console.log("Verified Passport: ", verifiedPassport)
//         } catch (err) {
//             console.log(err);
//         }


//         if (!_passport) {
//             updatePassportStatus(false)
//         } else {
//             updatePassport(verifiedPassport)
//             updatePassportStatus(true)
//         }
//     }, [account, loginAccount]);


//     const getInstruments = useCallback(async ()=> {
//         const _instrument = await getFormattedInstrumentData(address, loginAccount.library)
//         console.log("retrieved instrument: ", _instrument);
//         if (parseInt(_instrument.marketId) !== 0) {
//             console.log("got instrument: ", _instrument)
//             setInstrument(_instrument)
//         }
//         if (_instrument.trusted && isUser && parseInt(_instrument.instrument_type) === 0 ) {
//             setPath(makePath("creditline"))
//         }
//     })

//     useEffect(() => {
//         if (account && loginAccount.library) {
//             getInstruments()
//             getPassport()
//         }
//     }, [account, loginAccount])
    
//     return (
//         <>
//             <div className={Styles.ProfileView}>
//                 {activePassport ? (
//                     <ProfileCard passport={passport}/>
//                 ) : (
//                     <div>
//                         No Passport Found ...
//                     </div>
//                 )
//                 }
//             </div>
//             <section>
//                 {instrument.marketId !== "" ? (
//                     <InstrumentCard
//                     isLink={isLink}
//                     path={path}
//                     query={query}
//                     instrument={instrument}
//                 />
//                 ) : (
//                     <div>
//                         No Instrument Found ...
//                     </div>
//                 )}
//             </section>
//         </>
//     )
// }
// const useAddressQuery = () => {
//     const location = useLocation();
//     console.log("location.search: ", location.search)
//     const { address } = parseQuery(location.search); //TODO make sure it's a valid address
//     return address;
// };