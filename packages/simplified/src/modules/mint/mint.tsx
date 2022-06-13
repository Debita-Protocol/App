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



// const MintProvider = ({children})=>{
//   const [formData, setFormData] = useState({
//         MintAmount: '',
//       })

//     const handleChange = (e, name) => {
//       console.log('fefefef', name, e.target.value);
//     setFormData(prevState => ({ ...prevState, [name]: e.target.value }))

//     }

//   return (
//         <MintContext.Provider 
//         value = {{
//           formData,
//             handleChange,
           
            
//         }}>
//         {children}
//         </MintContext.Provider>
//     )
// }

// const MintContext = React.createContext(MintProvider);

const MintView= () => {
   // const{formData, handleChange, sendTransaction} = useContext(TransactionContext)
 const {formData, handleChange,sendTransaction} = useContext(MintContext);

  const { isMobile, isLogged } = useAppStatusStore();
  const {
    marketsViewSettings,
    settings: { showLiquidMarkets, timeFormat },
    actions: { setSidebar, updateMarketsViewSettings },
  } = useSimplifiedStore();
  const { ammExchanges, markets, transactions } = useDataStore();
  const { subCategories, sortBy, primaryCategory, reportingState, currency } = marketsViewSettings;
  const [loading, setLoading] = useState(true);
  const [filteredMarkets, setFilteredMarkets] = useState([]);
  const [filter, setFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useQueryPagination({
    itemsPerPage: PAGE_LIMIT,
    itemCount: filteredMarkets.length,
  });
  const marketKeys = Object.keys(markets);

  useScrollToTopOnMount(page);
  // console.log('UI markets', markets)

  let changedFilters = 0;

  Object.keys(DEFAULT_MARKET_VIEW_SETTINGS).forEach((setting) => {
    if (marketsViewSettings[setting] !== DEFAULT_MARKET_VIEW_SETTINGS[setting]) changedFilters++;
  });

  return (
    <div
      className={classNames(Styles.MarketsView, {
        [Styles.SearchOpen]: showFilter,
      })}
    >
      <SEO {...MARKETS_LIST_HEAD_TAGS} />
      <NetworkMismatchBanner />
      {isLogged ? <AppViewStats small liquidity trading /> : <TopBanner />}
      {isMobile && (
        <div>
          <SecondaryThemeButton
            text={`filters${changedFilters ? ` (${changedFilters})` : ``}`}
            icon={FilterIcon}
            action={() => setSidebar(SIDEBAR_TYPES.FILTERS)}
          />
          <SearchButton
            action={() => {
              setFilter("");
              setShowFilter(!showFilter);
            }}
            selected={showFilter}
          />
        </div>
      )}
      <ul>
        <SquareDropdown
          onChange={(value) => {
            updateMarketsViewSettings({ primaryCategory: value, subCategories: [] });
          }}
          options={categoryItems}
          defaultValue={primaryCategory}
        />
        <SquareDropdown
          onChange={(value) => {
            updateMarketsViewSettings({ sortBy: value });
          }}
          options={sortByItems}
          defaultValue={sortBy}
        />
        <SquareDropdown
          onChange={(value) => {
            updateMarketsViewSettings({ reportingState: value });
          }}
          options={marketStatusItems}
          defaultValue={reportingState}
        />
        <SearchButton
          selected={showFilter}
          action={() => {
            setFilter("");
            setShowFilter(!showFilter);
          }}
          showFilter={showFilter}
        />
      </ul>
      <SearchInput
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        clearValue={() => setFilter("")}
        showFilter={showFilter}
      />
 
     <div className = {styleMint.wrapper}>  
        <div className = {styleMint.content}>
          <div className={styleMint.transferPropContainer}>
                <input
                    type='text'
                    className={styleMint.transferPropInput}
                    placeholder='0.0'
                    pattern='^[0-9]*[.,]?[0-9]*$'
                    onChange={e => handleChange(e, 'amount')}
                />
            
          </div>


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

export interface SubCategoriesFilterProps {
  primaryCategory: string;
  subCategories: Array<string>;
  updateCategories: (update: any) => void;
}

export const SubCategoriesFilter = ({ primaryCategory, subCategories, updateCategories }: SubCategoriesFilterProps) => {
  if (primaryCategory.toLowerCase() !== "sports") return null;
  const { icon: SportsIcon } = getCategoryIconLabel([primaryCategory]);
  const { icon: MLBIcon } = getCategoryIconLabel(["Sports", "Baseball", "MLB"]);
  const { icon: NBAIcon } = getCategoryIconLabel(["Sports", "Basketball", "NBA"]);
  const { icon: MMAIcon } = getCategoryIconLabel(["Sports", "MMA"]);

  // const { icon: HockeyIcon } = getCategoryIconLabel(["Sports", "Hockey", "NHL"]);
  const { icon: FootballIcon } = getCategoryIconLabel(["Sports", "American Football", "NFL"]);
  return (
    <div className={Styles.SubCategoriesFilter}>
      <button
        className={classNames(Styles.SubCategoryFilterButton, {
          [Styles.selectedFilterCategory]: subCategories.length === 0,
        })}
        onClick={() => updateCategories({ subCategories: [] })}
      >
        {SportsIcon} All Sports
      </button>
      <button
        className={classNames(Styles.SubCategoryFilterButton, {
          [Styles.selectedFilterCategory]: subCategories.includes("MLB"),
        })}
        onClick={() => updateCategories({ subCategories: ["Baseball", "MLB"] })}
      >
        {MLBIcon} MLB
      </button>
      <button
        className={classNames(Styles.SubCategoryFilterButton, {
          [Styles.selectedFilterCategory]: subCategories.includes("NBA"),
        })}
        onClick={() => updateCategories({ subCategories: ["Basketball", "NBA"] })}
      >
        {NBAIcon} NBA
      </button>
      <button
        className={classNames(Styles.SubCategoryFilterButton, {
          [Styles.selectedFilterCategory]: subCategories.includes("MMA"),
        })}
        onClick={() => updateCategories({ subCategories: ["MMA"] })}
      >
        {MMAIcon} MMA
      </button>
      {
        /* <button
        className={classNames(Styles.SubCategoryFilterButton, {
          [Styles.selectedFilterCategory]: subCategories.includes("NHL"),
        })}
        onClick={() => updateCategories({ subCategories: ["Hockey", "NHL"] })}
      >
        {HockeyIcon} NHL
      </button> */
        <button
          className={classNames(Styles.SubCategoryFilterButton, {
            [Styles.selectedFilterCategory]: subCategories.includes("NFL"),
          })}
          onClick={() => updateCategories({ subCategories: ["American Football", "NFL"] })}
        >
          {FootballIcon} NFL
        </button>
      }
    </div>
  );
};
