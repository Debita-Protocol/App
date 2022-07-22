import React, { useEffect, useState, useContext } from "react";
import Styles from "../markets/markets-view.styles.less";
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
} from "@augurproject/comps";

import { MARKETS_LIST_HEAD_TAGS } from "../seo-config";


import { MintContext } from './mintcontext'; 

import buttonStyles from "../common/buttons.styles.less";

// import { RiSettings3Fill } from 'react-icons/ri'


const {
  SelectionComps: { SquareDropdown },
  ButtonComps: { SecondaryThemeButton },
  Icons: { FilterIcon, SearchIcon },
  MarketCardComps: { LoadingMarketCard, MarketCard },
  PaginationComps: { sliceByPage, useQueryPagination, Pagination },
  InputComps: { SearchInput },
  LabelComps: { NetworkMismatchBanner },
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

const PAGE_LIMIT = 21;
const MIN_LIQUIDITY_AMOUNT = 1;
const styleMint = {
    wrapper: `w-screen flex items-center justify-center mt-14`,
    content: `bg-[#191B1F] w-[40rem] rounded-2xl p-4`,
    formHeader: `px-2 flex items-center justify-between font-semibold text-xl`,
    transferPropContainer: `bg-[#20242A] my-3 rounded-2xl p-6 text-3xl  border border-[#20242A] hover:border-[#41444F]  flex justify-between`,
    transferPropInput: `bg-transparent placeholder:text-[#B2B9D2] outline-none mb-6 w-full text-2xl`,
    currencySelector: `flex w-1/4`,
    currencySelectorContent: `w-full h-min flex justify-between items-center bg-[#2D2F36] hover:bg-[#41444F] rounded-2xl text-xl font-medium cursor-pointer p-2 mt-[-0.2rem]`,
    currencySelectorIcon: `flex items-center`,
    currencySelectorTicker: `mx-2`,
    currencySelectorArrow: `text-lg`,
    confirmButton: `bg-[#2172E5] my-2 rounded-2xl py-6 px-8 text-xl font-semibold flex items-center justify-center cursor-pointer border border-[#2172E5] hover:border-[#234169]`,
  }


const SearchButton = (props) => (
  <SecondaryThemeButton {...{ ...props, icon: SearchIcon, customClass: Styles.SearchButton }} />
);




const MintView= () => {
   // const{formData, handleChange, sendTransaction} = useContext(TransactionContext)
 const {formData, handleChange, mint} = useContext(MintContext);

  const [loading, setLoading] = useState(true);
  const [filteredMarkets, setFilteredMarkets] = useState([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useQueryPagination({
    itemsPerPage: PAGE_LIMIT,
    itemCount: filteredMarkets.length,
  });

  const handleSubmit = async (e: any) => {
    // const { addressTo, amount } = formData
    // e.preventDefault()

    // if (!addressTo || !amount) return

    mint()
  }

  useScrollToTopOnMount(page);
  // console.log('UI markets', markets)

  let changedFilters = 0;



  return (
    <div
      className={classNames(Styles.MarketsView, {
      })}
    >
      <SEO {...MARKETS_LIST_HEAD_TAGS} />
      <NetworkMismatchBanner />

      <ul>

      </ul>
 
 

     <div className = {styleMint.wrapper}>  
        <div className = {styleMint.content}>
          <div className={styleMint.formHeader}>
            <div>Mint DS for USDC</div>
          </div>
          <div className={styleMint.transferPropContainer}>
                <input
                    type='text'
                    className={styleMint.transferPropInput}
                    placeholder='0.0'
                    pattern='^[0-9]*[.,]?[0-9]*$'
                    onChange={e => handleChange(e, 'amount')}
                />

            
          </div>

        <button onClick={e => handleSubmit(e)} className={buttonStyles.SimplifiedActionButton}>
        &nbsp; &nbsp;  &nbsp; Confirm &nbsp; &nbsp; &nbsp; 
        </button>

        </div>
      </div>




      {filteredMarkets.length > 0 && (
        <Pagination
          page={page}
          useFull
          itemCount={filteredMarkets.length}
          itemsPerPage={PAGE_LIMIT}
          action={(page) => {
            setPage(page);
          }}
          updateLimit={null}
          usePageLocation
        />
      )}
    </div>
  );
};

export default MintView;
