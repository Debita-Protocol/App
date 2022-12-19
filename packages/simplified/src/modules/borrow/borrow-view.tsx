import React, { useState, useEffect } from "react"
import { useDataStore2, useUserStore } from "@augurproject/comps"
import Styles from "./borrow-view.styles.less";
import {TabContent, TabNavItem} from "./Tabs";
import { InstrumentInfos, VaultInfos, CoreInstrumentData} from "@augurproject/comps/build/types"
import { PoolCard, LoadingPoolCard } from "./PoolCard";

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
    const { vaults: vaults, instruments: instruments }: { vaults: VaultInfos, instruments: InstrumentInfos} = useDataStore2();
    const [ pools, setPools ] = useState([]);
    const [loading, setLoading] = useState(true);


    // get the pools
    const getPools = (_instruments: InstrumentInfos) => {
        let _pools = [];
        for (const [id, instr] of Object.entries(_instruments)) {
            if (instr.isPool) {

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
        <div className="Pools">
            <h3>Pools</h3>
            <div className="PoolHeader">
                <ul className="PoolHeaderItem">
                    Market Id
                </ul>
                <ul className="PoolHeaderItem">
                    Vault Id
                </ul>
                <ul className="PoolHeaderItem">
                    Utilizer
                </ul>
                <ul className="PoolHeaderItem">
                    Collateral
                </ul>
                <ul className="PoolHeaderItem">
                    Leverage Factor
                </ul>
            </div>
            { loading ? (
                <section>
                {new Array(PAGE_LIMIT).fill(null).map((m, index) => (
                    <LoadingPoolCard key={index} />
                ))}
                </section>
            ) : pools.length > 0 ? (
                <section>
                  {sliceByPage(pools, page, PAGE_LIMIT).map((pool, index) => (
                    <PoolCard
                      key={`${pool.marketId}-${index}`}
                      marketId={pool.marketId}
                      instruments={pools}
                      vaults={vaults}
                    />
                  ))}
                </section>
              ) : (
                <span className={Styles.EmptyMarketsMessage}>No markets to show. Try changing the filter options.</span>
              )}
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

    useScrollToTopOnMount(page);

    const getUserLoans = (_instruments: InstrumentInfos) => {
        let _loans = [];
        for (const [id, instr] of Object.entries(_instruments)) {
            if (instr.utilizer === account) {
                _loans.push(instr);
            }
        }
        return _loans;
    }

    useEffect(() => {
        if (instruments.length > 0) {
            setLoans(getUserLoans(instruments));
        }
    }, [instruments]);
    
    return (
        <div className="MyLoansPage">
            <h3>My Loans</h3>
            { loading ? (
                <section>
                {new Array(PAGE_LIMIT).fill(null).map((m, index) => (
                    <LoadingPoolCard key={index} />
                ))}
                </section>
            ) : loans.length > 0 ? (
                <section>
                  {sliceByPage(loans, page, PAGE_LIMIT).map((loan, index) => (
                    <PoolCard
                      key={`${loan.marketId}-${index}`}
                      marketId={loan.marketId}
                      instruments={loans}
                      vaults={loans}
                    />
                  ))}
                </section>
              ) : (
                <span className={Styles.EmptyMarketsMessage}>No markets to show. Try changing the filter options.</span>
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
            <ul className="nav">
                <TabNavItem title="Pools" id="0" activeTab={activeTab} setActiveTab={setActiveTab}/>
                <TabNavItem title="My Loans" id="1" activeTab={activeTab} setActiveTab={setActiveTab}/>
            </ul>
            <div className="outlet">
                <TabContent id="0" activeTab={activeTab}> 
                    <Pools />
                </TabContent>
                <TabContent id="1" activeTab={activeTab}>
                    <MyLoans />
                </TabContent>
            </div>
        </div>
    )
}

export default BorrowView