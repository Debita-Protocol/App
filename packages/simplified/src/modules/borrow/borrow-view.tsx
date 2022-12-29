import React, { useState, useEffect } from "react"
import { useDataStore2, useUserStore } from "@augurproject/comps"
import Styles from "./borrow-view.styles.less";
import classNames from "classnames";
import {TabContent, TabNavItem} from "./Tabs";
import { InstrumentInfos, VaultInfos, CoreInstrumentData, PoolInstrument} from "@augurproject/comps/build/types"
import { PoolCard, LoadingPoolCard } from "./PoolCard";
import { LoanCard } from "./UserLoanCard";
import {vaults, instruments} from "./fakedata";

import {
    Components,
    Constants,
    useScrollToTopOnMount,
} from "@augurproject/comps"

const { 
    ButtonComps: { SecondaryThemeButton },
    LabelComps: { ValueLabel },
    PaginationComps: { sliceByPage, useQueryPagination, Pagination },
} = Components

const PAGE_LIMIT = 5;


const Pools: React.FC = () => {
    // retrieve all the pools ever created.
    //const { vaults: vaults, instruments: instruments }: { vaults: VaultInfos, instruments: InstrumentInfos} = useDataStore2();
    console.log("vaults", vaults);
    console.log("instruments", instruments);
    const [ pools, setPools ] = useState<PoolInstrument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (Object.values(vaults).length > 0 && Object.values(instruments).length > 0) {
            setLoading(false);
        }
    }, [vaults, instruments]);

    // get the pools
    const getPools = (_instruments: InstrumentInfos) => {
        let _pools = [];
        for (const [id, instr] of Object.entries(_instruments)) {
            if ("poolLeverageFactor" in instr) {
                _pools.push(instr);
            }
        }
        setLoading(false);
        return _pools;
    }

    const [page, setPage] = useQueryPagination({
        itemsPerPage: PAGE_LIMIT,
        itemCount: pools.length,
    });

    useScrollToTopOnMount(page);

    useEffect(() => {
        if (instruments) {
            setPools(getPools(instruments));
        }
    }, [instruments]);
    
    return (
        <div className={Styles.PoolsView}>
            <table>
                <thead>
                    <tr>
                        <th>
                            Vault
                        </th>
                        <th>
                            Collateral
                        </th>
                        <th>
                            APR
                        </th>
                        <th>
                            Leverage Factor
                        </th>
                        <th>
                            Total Borrowed Assets
                        </th>
                        <th>
                            Total Available Assets
                        </th>
                    </tr>
                </thead>
                { loading ? (
                    <tbody>
                        <tr className={Styles.EmptyMarketsMessage}>Loading</tr>
                    </tbody>
                    
                ) : pools.length > 0 ? (

                    <tbody>
                        {sliceByPage(pools, page, PAGE_LIMIT).map((pool: PoolInstrument, index) => (
                        <PoolCard
                            key={`${pool.marketId}-${index}`}
                            marketId={pool.marketId}
                            vaultId={pool.vaultId}
                            instruments={pools}
                            vaults={vaults}
                        />
                      ))}
                    </tbody>
                    
                ) : (
                    <tr className={Styles.EmptyMarketsMessage}>No pools to show</tr>
                )}
            </table>
              {pools.length > 0 && (
                    <Pagination
                    page={page}
                    useFull
                    itemCount={pools.length}
                    itemsPerPage={PAGE_LIMIT}
                    action={(page) => {
                        setPage(page);
                    }}
                    updateLimit={null}
                    usePageLocation
                    />
                )}
        </div>
    )
}

const MyLoans: React.FC = () => {
    const { instruments } = useDataStore2();
    const { account, loginAccount } = useUserStore();
    const [ loans, setLoans ] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useQueryPagination({
        itemsPerPage: PAGE_LIMIT,
        itemCount: loans.length,
    });

    useEffect(() => {
        if (Object.values(instruments).length > 0) {
            setLoading(false);
            setLoans(getUserLoans(instruments));
        }
    }, [instruments]);

    useScrollToTopOnMount(page);

    const getUserLoans = (_instruments: InstrumentInfos) => {
        // TODO: contract-calls to get user loans.
        // const { loans, borrowedBalances } = getUserLoanData(instruments)

        // incorrect, but for now match instruments where the utilizer is the user.
        let _loans = [];
        for (const [id, instr] of Object.entries(_instruments)) {
            _loans.push(instr);
            break;
        }
        return _loans;
    }
    
    return (
        <div className={Styles.MyLoansView}>
            { loading ? (
                <section>
                {new Array(PAGE_LIMIT).fill(null).map((m, index) => (
                    <LoadingPoolCard key={index} />
                ))}
                </section>
            ) : loans.length > 0 ? (
                <section>
                  {sliceByPage(loans, page, PAGE_LIMIT).map((loan, index) => (
                    <LoanCard
                      key={`${loan.marketId}-${index}`}
                      
                    />
                  ))}
                </section>
              ) : (
                <span className={Styles.EmptyMarketsMessage}>No loans to show</span>
              )}
              {loans.length > 0 && (
                    <Pagination
                    page={page}
                    useFull
                    itemCount={loans.length}
                    itemsPerPage={PAGE_LIMIT}
                    action={(page) => {
                        setPage(page);
                    }}
                    updateLimit={null}
                    usePageLocation
                    />
                )}
        </div>
    )
}

const BorrowView: React.FC = () => {
    const { vaults } = useDataStore2();
    const [ activeTab, setActiveTab ] = useState("0");

    return (
        <div className={Styles.BorrowView}>
            <section className={Styles.Nav}>
                <TabNavItem title="Pools" id="0" activeTab={activeTab} setActiveTab={setActiveTab}/>
                <TabNavItem title="My Loans" id="1" activeTab={activeTab} setActiveTab={setActiveTab}/>
            </section>
            
            <section>
                <TabContent id="0" activeTab={activeTab}> 
                    <Pools />
                </TabContent>
                <TabContent id="1" activeTab={activeTab}>
                    <MyLoans />
                </TabContent>
            </section>
            
        </div>
    )
}

export default BorrowView