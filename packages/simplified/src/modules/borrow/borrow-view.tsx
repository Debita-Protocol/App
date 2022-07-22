import React, { useEffect, useState, useContext } from "react";
import Styles from "./markets-view.styles.less";
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

import Styles from "../markets/markets-view.styles.less"

import type { Loan } from "@augurproject/comps/build/types";

import { MARKETS_LIST_HEAD_TAGS } from "../seo-config";


const {
  SelectionComps: { SquareDropdown },
  ButtonComps: { SecondaryThemeButton },
  Icons: { FilterIcon, SearchIcon },
  MarketCardComps: { LoadingMarketCard, MarketCard },
  PaginationComps: { sliceByPage, useQueryPagination, Pagination },
  InputComps: { SearchInput },
  LabelComps: { NetworkMismatchBanner },
  MarketCardContext, 
} = Components;
const {
  SIDEBAR_TYPES,
  ALL_CURRENCIES,
  ALL_MARKETS,
  // currencyItems,
  marketStatusItems,
  OPEN,
  OTHER,
  POPULAR_CATEGORIES_ICONS,
  sortByItems,
  TOTAL_VOLUME,
  STARTS_SOON,
  RESOLVED,
  IN_SETTLEMENT,
  LIQUIDITY,
  MARKET_STATUS,
  TWENTY_FOUR_HOUR_VOLUME,
  SPORTS,
} = Constants;

const PAGE_LIMIT = 5;
const MIN_LIQUIDITY_AMOUNT = 1;

const { getLoans } = ContractCalls;


const BorrowView = () => {
  const [loans, setLoans] = useState<Loan[]>();
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

        setLoans(await getLoans(account, loginAccount.library, account))

        setLoading(false)
      })()
    }
  }, [account, loginAccount]);

  return (
    <>
      {loading ? (
        <section>
          {new Array(PAGE_LIMIT).fill(null).map((m, index) => (
            <LoadingMarketCard key={index} />
          ))}
        </section>
      ) : ( true
        // <section>
        // {sliceByPage(loans, page, PAGE_LIMIT).map((loan, index) => (
        //   <LoanCard
        //     {... loan}
        //   />         
        // ))}
        // </section>
      ) }
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
    </>
  )
};

export default BorrowView;
