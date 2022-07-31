import React, { useEffect, useState, useContext } from "react";
import { AppViewStats } from "../common/labels";
import classNames from "classnames";
import { useSimplifiedStore } from "../stores/simplified";
import { categoryItems, DEFAULT_MARKET_VIEW_SETTINGS } from "../constants";
import { TopBanner } from "../common/top-banner";
import {
  useAppStatusStore,
  useDataStore,
  useScrollToTopOnMount,
  SEO,
  Constants,
  Components,
  getCategoryIconLabel,
  ContractCalls,
  useUserStore,
  ApprovalHooks,

} from "@augurproject/comps";
import { Link } from "react-router-dom"

import type { Loan } from "@augurproject/comps/build/types";
import { MARKETS_LIST_HEAD_TAGS } from "../seo-config";
import { utils } from "ethers";
import { LoadingMarketCard } from "@augurproject/comps/build/components/market-card/market-card";
import { LoanCard } from "../loan-card/loan-card-view";
import Styles from "../markets/markets-view.styles.less"
import makePath from "@augurproject/comps/build/utils/links/make-path";

const {
  PaginationComps: { sliceByPage, useQueryPagination, Pagination },
} = Components;


const PAGE_LIMIT = 5;
const MIN_LIQUIDITY_AMOUNT = 1;

const { getLoans } = ContractCalls;

const { parseBytes32String, formatBytes32String } = utils;

const BorrowView = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const { account, loginAccount } = useUserStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useQueryPagination({
    itemsPerPage: PAGE_LIMIT,
    itemCount: loans.length,
  });
  
  useScrollToTopOnMount(page);

  useEffect(() => {
    if (account && loginAccount.library) {
      ;(async () => {
        setLoading(true)
        let result = await getLoans(account, loginAccount.library, account)
        console.log("LOANS RETRIEVED: ", result)
        setLoans(result)

        setLoading(false)
      })()
    }
  }, [account, loginAccount]);

  return (
    <>
      <div className={Styles.MarketsView}>
        <section>
          <li>
            <Link to={makePath("proposal")}>
              Loan Proposal
            </Link>
          </li>
          
        </section>
        {loading ? (
          <section>
            {new Array(PAGE_LIMIT).fill(null).map((m, index) => (
              <LoadingMarketCard key={index} />
            ))}
          </section>
        ) : (

          <section>
          {sliceByPage(loans, page, PAGE_LIMIT).map((loan, index) => (
            <LoanCard
              {... loan}
              key={`loan-${parseBytes32String(loan.id)}-${index}`}
            />         
          ))}
        </section>
        )}
        {loans.length > 0 ? (
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
        ) : (
          <div>
            No loans to show
          </div>
        )}
      </div>
    </>
  )
};

export default BorrowView;
