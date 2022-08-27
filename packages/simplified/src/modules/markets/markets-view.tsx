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

import type { MarketInfo } from "@augurproject/comps/build/types";

import { MARKETS_LIST_HEAD_TAGS } from "../seo-config";


const { newFunction, createMarket,endMarket, estimateAddLiquidityPool, mintCompleteSets_,
createMarket_, mintDS, resolveMarket, contractApprovals,
doBulkTrade, addProposal, doOwnerSettings ,mintRepNFT, resolveZCBMarket} = ContractCalls;
const { approveERC20Contract } = ApprovalHooks;

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

const PAGE_LIMIT = 21;
const MIN_LIQUIDITY_AMOUNT = 1;

const confirmMint = async ({
  //addTransaction,
  
  account,
  loginAccount,

  afterSigningAction = () => {},
}) => {

const marketFactoryAddress = "0x323D62F7FC2a1a078787dB5045ae14E0567b0476";
const settlementAddress = "0xFD84b7AC1E646580db8c77f1f05F47977fAda692";
const dsAddress = "0xc90AfD78f79068184d79beA3b615cAB32D0DC45D";
const lendingPooladdress = "0x97Ed87C184b79bD6C34c1C056b6930Fd08C4F8d5";
const usdc =  "0x5799bFe361BEea69f808328FF4884DF92f1f66f0";

   //const tx = await approveERC20Contract(usdc, "text", lendingPooladdress, loginAccount);
   console.log('minting account',account)
  // await newFunction(account, loginAccount.library)
 await mintDS(settlementAddress, loginAccount.library)
  // console.log(isdone)
};

const confirmApprove = async({
  account, loginAccount, 
}) => {

  await doOwnerSettings(account, loginAccount.library)
 // await  contractApprovals(account, loginAccount.library)

}
const confirmInitiate = async({
  account, 
  loginAccount, 
})=> {
  // await validator_initiate_market(loginAccount.library, account, 
  //   "100000",
  //   )
  await resolveMarket(account, loginAccount.library)
}

const confirmResolve = async ({
  //addTransaction,
  
  account,
  loginAccount,

  afterSigningAction = () => {},
}) => {
    
  await resolveZCBMarket(
  account, loginAccount.library); 
  // marketId: string = "2", 
  // atLoss: boolean = false, 
  // extra_gain: string ="0", 
  // principal_loss: string = "0"
  // )
   //await resolveMarket(account, loginAccount.library)
};


const confirmAction = async ({
  //addTransaction,
  
  account,
  loginAccount,

  afterSigningAction = () => {},
}) => {


   await createMarket_(loginAccount.library)
};

 function createmarket(account, provider) {
  //newFunction();
  console.log('account', account, provider)

   mintCompleteSets_( provider, "100", account)

}

const confirmBulkTrade = async({
  account,  loginAccount, formData, 
  afterSigningAction = () => {}
}) => {
  await doBulkTrade( loginAccount.library,account, formData)
}


const confirmCreate =async({
  account, loginAccount
}) =>{
  addProposal(
    account, loginAccount.library 
    )
}

const confirmMintRepNFT = async({
  account,  loginAccount, 
}) => {
await mintRepNFT( account, loginAccount.library); 
}



const applyFiltersAndSort = (
  passedInMarkets,
  setFilteredMarkets,
  transactions,
  { filter, primaryCategory, subCategories, sortBy, currency, reportingState, showLiquidMarkets }
) => {
  // let updatedFilteredMarkets = passedInMarkets;
  // if (filter !== "") {
  //   updatedFilteredMarkets = updatedFilteredMarkets.filter((market) => {
  //     const { title, description, categories, outcomes } = market;
  //     const searchRegex = new RegExp(filter, "i");
  //     const matchTitle = searchRegex.test(title);
  //     const matchDescription = searchRegex.test(description);
  //     const matchCategories = searchRegex.test(JSON.stringify(categories));
  //     const matchOutcomes = searchRegex.test(JSON.stringify(outcomes.map((outcome) => outcome.name)));
  //     if (matchTitle || matchDescription || matchCategories || matchOutcomes) {
  //       return true;
  //     }
  //     return false;
  //   });
  // }

  // updatedFilteredMarkets = updatedFilteredMarkets.filter((market: MarketInfo) => {
  //   if (
  //     showLiquidMarkets &&
  //     (!market.amm || !market.amm.id || Number(market.amm.liquidityUSD) <= MIN_LIQUIDITY_AMOUNT)
  //   ) {
  //     return false;
  //   }
  //   if (
  //     primaryCategory !== ALL_MARKETS &&
  //     primaryCategory !== OTHER &&
  //     market.categories[0].toLowerCase() !== primaryCategory.toLowerCase()
  //   ) {
  //     return false;
  //   }
  //   if (primaryCategory === OTHER && POPULAR_CATEGORIES_ICONS[market.categories[0].toLowerCase()]) {
  //     return false;
  //   }
  //   if (primaryCategory === SPORTS && subCategories.length > 0) {
  //     // subCategories is always a max 2 length, markets are 3.
  //     const indexToCheck = subCategories.length === 1 ? 1 : market.categories.length - 1;
  //     if (
  //       market.categories[indexToCheck] &&
  //       market.categories[indexToCheck].toLowerCase() !== subCategories[indexToCheck - 1].toLowerCase()
  //     ) {
  //       return false;
  //     }
  //   }
  //   if (currency !== ALL_CURRENCIES) {
  //     if (!market.amm) {
  //       return false;
  //     } else if (market?.amm?.cash?.name !== currency) {
  //       return false;
  //     }
  //   }
  //   if (reportingState === OPEN) {
  //     if (market.reportingState !== MARKET_STATUS.TRADING) {
  //       return false;
  //     }
  //   } else if (reportingState === IN_SETTLEMENT) {
  //     if (market.reportingState !== MARKET_STATUS.REPORTING && market.reportingState !== MARKET_STATUS.DISPUTING)
  //       return false;
  //   } else if (reportingState === RESOLVED) {
  //     if (market.reportingState !== MARKET_STATUS.FINALIZED && market.reportingState !== MARKET_STATUS.SETTLED)
  //       return false;
  //   }

  //   return true;
  // });
  // updatedFilteredMarkets = updatedFilteredMarkets.sort((marketA, marketB) => {
  //   const aTransactions = transactions ? transactions[marketA.marketId] : {};
  //   const bTransactions = transactions ? transactions[marketB.marketId] : {};

  //   const mod = reportingState === RESOLVED ? -1 : 1;
  //   if (sortBy === TOTAL_VOLUME) {
  //     return (bTransactions?.volumeTotalUSD || 0) > (aTransactions?.volumeTotalUSD || 0) ? 1 : -1;
  //   } else if (sortBy === TWENTY_FOUR_HOUR_VOLUME) {
  //     return (bTransactions?.volume24hrTotalUSD || 0) > (aTransactions?.volume24hrTotalUSD || 0) ? 1 : -1;
  //   } else if (sortBy === LIQUIDITY) {
  //     return (Number(marketB?.amm?.liquidityUSD) || 0) > (Number(marketA?.amm?.liquidityUSD) || 0) ? 1 : -1;
  //   } else if (sortBy === STARTS_SOON) {
  //     return (marketA?.startTimestamp > marketB?.startTimestamp ? 1 : -1) * mod;
  //   }
  //   return true;
  // });
  // if (reportingState === OPEN) {
  //   if (sortBy !== STARTS_SOON) {
  //     // if we aren't doing start time, then move illiquid markets to the back
  //     // half of the list, also sort by start time ascending for those.
  //     const sortedIlliquid = updatedFilteredMarkets
  //       .filter((m) => m?.amm?.id === null)
  //       .sort((a, b) => (a?.startTimestamp > b?.startTimestamp ? 1 : -1));

  //     updatedFilteredMarkets = updatedFilteredMarkets.filter((m) => m?.amm?.id !== null).concat(sortedIlliquid);
  //   }

  //   // Move games where the start time is < current time
  //   const now = Date.now();
  //   const isExpired = (market) => {
  //     var thirtyHoursLaterMillis = market.startTimestamp
  //       ? (market.startTimestamp + 30 * 60 * 60) * 1000
  //       : market.endTimestamp;
  //     return now >= thirtyHoursLaterMillis;
  //   };

  //   const expired = updatedFilteredMarkets.filter((m) => isExpired(m));
  //   const scheduled = updatedFilteredMarkets.filter((m) => !isExpired(m));
  //   setFilteredMarkets([...scheduled, ...expired]);
  // } else {
  //   setFilteredMarkets(updatedFilteredMarkets);
  // }
      setFilteredMarkets(passedInMarkets);

};

const SearchButton = (props) => (
  <SecondaryThemeButton {...{ ...props, icon: SearchIcon, customClass: Styles.SearchButton }} />
);

// const numberfy = (data) => (
//   var numbers:numbers[] = new Array(data.length);

//   for( let i=0; i< data.length; i++){
//     numbers[i] = data[i];

//   }) 

const MarketsView = () => {
  const {formData, handleChange} = useContext(MarketCardContext);
  // console.log('formdata in markets',formData)
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
  const {amm} = markets;


  useScrollToTopOnMount(page);
  // console.log('UI markets', markets)
  const handleFilterSort = () => {
    if (Object.values(markets).length > 0) {
      setLoading(false);
    }
    applyFiltersAndSort(Object.values(markets), setFilteredMarkets, transactions, {
      filter,
      primaryCategory,
      subCategories,
      sortBy,
      currency,
      reportingState,
      showLiquidMarkets,
    });
  };

  useEffect(() => {
    setPage(page);
    handleFilterSort();
  }, [sortBy, filter, primaryCategory, subCategories, reportingState, currency, showLiquidMarkets.valueOf()]);

  useEffect(() => {
    handleFilterSort();
  }, [marketKeys.length]);

  let changedFilters = 0;
  Object.keys(DEFAULT_MARKET_VIEW_SETTINGS).forEach((setting) => {
    if (marketsViewSettings[setting] !== DEFAULT_MARKET_VIEW_SETTINGS[setting]) changedFilters++;
  });
  console.log('filteredMarketsfrontend', filteredMarkets)

  const {
      account,
      loginAccount,
      balances,
      actions: { addTransaction },
    } = useUserStore();

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
     {/* <button onClick={() => createmarket(  account,    loginAccount
)}>CreateMarket</button> */}
   {  /*       <button onClick={() => confirmAction( { account,    loginAccount}
)}>CreateMarket</button>
           <button onClick={() => confirmMint( { account,    loginAccount}
)}>MintDS</button>
                      <button onClick={() => confirmResolve( { account, loginAccount}
)}>Resolvezcbmarket</button>

                      <button onClick={() => confirmApprove( { account,loginAccount}
)}>ApproveAll</button>
                      <button onClick={() => confirmCreate( { account,loginAccount}
)}>InitMarket</button>
                     <button onClick={() => confirmMintRepNFT( { account,loginAccount}
)}>MintRep</button>

                      
                  */  }

       {/* <SquareDropdown
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
        /> */}


      </ul>
      <SearchInput
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        clearValue={() => setFilter("")}
        showFilter={showFilter}
      />
      <SubCategoriesFilter
        {...{
          updateCategories: updateMarketsViewSettings,
          subCategories,
          primaryCategory,
        }}
      />
      {loading ? (
        <section>
          {new Array(PAGE_LIMIT).fill(null).map((m, index) => (
            <LoadingMarketCard key={index} />
          ))}
        </section>
      ) : filteredMarkets.length > 0 ? (
        <section>
          {sliceByPage(filteredMarkets, page, PAGE_LIMIT).map((market, index) => (
            <MarketCard
              key={`${market.marketId}-${index}`}
              marketId={market.marketId}
              markets={markets}
              ammExchanges={ammExchanges}
              noLiquidityDisabled={!isLogged}
              timeFormat={timeFormat}
              marketTransactions={transactions[market.marketId]}
            />         
          ))}
    { /*<button onClick={() => confirmBulkTrade( { account, loginAccount, formData}
)}>Buy</button> */}
        </section> 

      ) : (
        <span className={Styles.EmptyMarketsMessage}>No markets to show. Try changing the filter options.</span>
      )}
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

export default MarketsView;

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
