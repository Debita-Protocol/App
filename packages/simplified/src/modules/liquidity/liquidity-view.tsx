import React, { useState, useMemo, useEffect } from "react";
import { useHistory } from "react-router";
import classNames from "classnames";
import { Collateral } from "@augurproject/comps/build/types";
// @ts-ignore
import Styles from "./liquidity-view.styles.less";
import {
  Components,
  Utils,
  useDataStore,
  useUserStore,
  Constants,
  ContractCalls,
  Stores,
  useScrollToTopOnMount,
  useDataStore2, useAppStatusStore
} from "@augurproject/comps";

// @ts-ignore
import ButtonStyles from "../common/buttons.styles.less";

import { AppViewStats, AvailableLiquidityRewards, handleValue, MaticAddMetaMaskToken } from "../common/labels";
import {
  MARKET,
  categoryItems,
  MARKET_LIQUIDITY,
  ZERO,
  MARKET_TYPE_OPTIONS,
  POOL_SORT_TYPES,
  POOL_SORT_TYPE_TEXT,
  INSTRUMENT_SORT_TYPE_TEXT,
  INSTRUMENT_SORT_TYPES,
  INSTRUMENT_TYPE_OPTIONS
} from "../constants";
import { BonusReward } from "../common/tables";
import { useSimplifiedStore } from "../stores/simplified";
import { MarketInfo, InstrumentInfos, VaultInfos, CoreInstrumentData } from "@augurproject/comps/build/types";
import { InstrumentOverviewFormat, InstrumentBreakDownFormat, InstumentDescriptionFormat, InstrumentField } from "../market/market-view";
import BigNumber from "bignumber.js";
import { SubCategoriesFilter } from "../markets/markets-view";
import { Icon_Mapping, SizedChevronFlipIcon } from "@augurproject/comps/build/components/common/icons";
import { RammCategoryLabel, RammValueLabel, ValueLabel } from "@augurproject/comps/build/components/common/labels";
import { ExternalLink } from "@augurproject/comps/build/utils/links/links";
import { round } from "utils/helpers";
import ChevronFlip, { SizedChevronFlip } from "modules/common/chevron-flip";

const { ADD, CREATE, REMOVE, ALL_MARKETS, OTHER, POPULAR_CATEGORIES_ICONS, SPORTS, MARKET_ID_PARAM_NAME } = Constants;
const {
  PaginationComps: { sliceByPage, useQueryPagination, Pagination },
  Links: { MarketLink },
  SelectionComps: { SquareDropdown, ToggleSwitch },
  Icons: { Arrow, MaticIcon },
  InputComps: { SearchInput },
  LabelComps: { generateTooltip, CategoryIcon },
  MarketCardComps: { MarketTitleArea },
  ButtonComps: { PrimaryThemeButton, SecondaryThemeButton },
} = Components;
const { canAddLiquidity, getMaticUsdPrice, setUpExampleController, addProposal, setUpTestManager } = ContractCalls;
const {
  DateUtils: { getMarketEndtimeDate },
  Formatter: { formatApy, formatCash, formatToken },
  PathUtils: { makeQuery, makePath },
} = Utils;
const {
  Utils: { isMarketFinal },
} = Stores;

const PAGE_LIMIT = 50;

interface LiquidityMarketCardProps {
  key?: string;
  market: MarketInfo;
}

const setupExample = async ({
  account, loginAccount,
}) => {

  await setUpExampleController(account, loginAccount.library)

}
const setUpExampleManager = async ({
  account, loginAccount
}) => {
  await setUpTestManager(account, loginAccount.library)

}
const addExampleProposal = async ({
  account, loginAccount
}) => {
  await addProposal(account, loginAccount.library);

}

const applyFiltersAndSort = (
  passedInMarkets,
  setFilteredMarkets,
  transactions,
  lpTokens,
  pendingRewards,
  { filter, primaryCategory, subCategories, marketTypeFilter, sortBy, onlyUserLiquidity }
) => {
  let updatedFilteredMarkets = passedInMarkets;
  const userMarkets = Object.keys(lpTokens);
  // remove resolved markets unless we have liquidity.
  updatedFilteredMarkets = updatedFilteredMarkets.filter((market) =>
    market.hasWinner ? (userMarkets.includes(market.marketId) ? true : false) : true
  );

  if (onlyUserLiquidity) {
    updatedFilteredMarkets = updatedFilteredMarkets.filter((market) => userMarkets.includes(market.marketId));
  }

  if (marketTypeFilter !== MARKET_TYPE_OPTIONS[0].value) {
    updatedFilteredMarkets = updatedFilteredMarkets.filter((market) =>
      marketTypeFilter === MARKET_TYPE_OPTIONS[1].value ? !market.isGrouped : market.isGrouped
    );
  }

  if (filter !== "") {
    updatedFilteredMarkets = updatedFilteredMarkets.filter((market) => {
      const { title, description, categories, outcomes } = market;
      const searchRegex = new RegExp(filter, "i");
      const matchTitle = searchRegex.test(title);
      const matchDescription = searchRegex.test(description);
      const matchCategories = searchRegex.test(JSON.stringify(categories));
      const matchOutcomes = searchRegex.test(JSON.stringify(outcomes.map((outcome) => outcome.name)));
      if (matchTitle || matchDescription || matchCategories || matchOutcomes) {
        return true;
      }
      return false;
    });
  }

  updatedFilteredMarkets = updatedFilteredMarkets.filter((market: MarketInfo) => {
    if (
      primaryCategory !== ALL_MARKETS &&
      primaryCategory !== OTHER &&
      market.categories[0].toLowerCase() !== primaryCategory.toLowerCase()
    ) {
      return false;
    }
    if (primaryCategory === OTHER && POPULAR_CATEGORIES_ICONS[market.categories[0].toLowerCase()]) {
      return false;
    }
    if (primaryCategory === SPORTS && subCategories.length > 0) {
      // subCategories is always a max 2 length, markets are 3.
      const indexToCheck = subCategories.length === 1 ? 1 : market.categories.length - 1;
      if (
        market.categories[indexToCheck] &&
        market.categories[indexToCheck].toLowerCase() !== subCategories[indexToCheck - 1].toLowerCase()
      ) {
        return false;
      }
    }
    return true;
  });

  if (sortBy.type) {
    updatedFilteredMarkets = updatedFilteredMarkets.sort((marketA, marketB) => {
      const aLiquidity = marketA?.amm?.liquidityUSD;
      const bLiquidity = marketB?.amm?.liquidityUSD;
      const aTransactions = transactions ? transactions[marketA.marketId] : {};
      const bTransactions = transactions ? transactions[marketB.marketId] : {};
      const aUserLiquidity = Number(lpTokens?.[marketA.marketId]?.usdValue) || 0;
      const bUserLiquidity = Number(lpTokens?.[marketB.marketId]?.usdValue) || 0;
      const aUserRewards = Number(pendingRewards?.[marketA.marketId]?.balance) || 0;
      const bUserRewards = Number(pendingRewards?.[marketB.marketId]?.balance) || 0;

      const { type, direction } = sortBy;

      switch (type) {
        case POOL_SORT_TYPES.EXPIRES: {
          return Number(marketA.endTimestamp) < Number(marketB.endTimestamp) ? direction : direction * -1;
        }
        case POOL_SORT_TYPES.APR: {
          return (Number(bTransactions?.apy) || 0) > (Number(aTransactions?.apy) || 0) ? direction : direction * -1;
        }
        case POOL_SORT_TYPES.TVL: {
          return (bLiquidity || 0) > (aLiquidity || 0) ? direction : direction * -1;
        }
        case POOL_SORT_TYPES.LIQUIDITY: {
          return aUserLiquidity < bUserLiquidity ? direction : direction * -1;
        }
        case POOL_SORT_TYPES.REWARDS: {
          return aUserRewards < bUserRewards ? direction : direction * -1;
        }
        default:
          return 0;
      }
    });
  }

  setFilteredMarkets(updatedFilteredMarkets);
};
function bin2String(array) {
  var result = "";
  for (var i = 0; i < array.length; i++) {
    result += String.fromCharCode(parseInt(array[i], 2));
  }
  return result;
}

function roundDown(number, decimals) {
  decimals = decimals || 0;
  return (Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals));
}
export const InstrumentCard = ({ instrument }: any): React.FC => {
  const {
    settings: { timeFormat, theme },
  } = useSimplifiedStore();
  const { markets, vaults } = useDataStore2();

  const [expanded, setExpanded] = useState(false);

  const { actions: { setModal }, isMobile } = useAppStatusStore();
  const history = useHistory();

  // const { vaults: vaults, instruments: instruments }: { vaults: VaultInfos, instruments: InstrumentInfos} = useDataStore2();
  const { marketId, vaultId } = instrument;
  const type = Number(instrument?.instrumentType);


  const instrumentField = InstrumentField({ instrumentType: Number(type), instrument: instrument });
  const instrumentOverview = InstrumentOverviewFormat({ instrumenType: Number(type) })
  const instrumentDescription = InstumentDescriptionFormat({ instrumenType: Number(type), fields: instrumentField });
  const instrumentBreakDown = InstrumentBreakDownFormat({ instrumentType: type, field: instrumentField });

  const approved = (!markets[marketId]?.duringAssessment && markets[marketId]?.alive)

  let InstrumentDetails;
  switch (type) {
    case 0:
      // creditline
      break;
    case 1:
      // covered call
      break;
    case 2:
      // lending pool
      const { collaterals } = instrument;
      InstrumentDetails = (
        <div className={Styles.poolDetails}>
          <h3>
            Proposed Collateral:
          </h3>
          <div>
            {collaterals.map((collateral: any) => {
              return (
                <PoolCollateralCard collateral={collateral} />
              )
            })
            }
          </div>
        </div>
      )
      break;
  }

  console.log("expanded: ", expanded);

  return (
    <article
      className={classNames(Styles.LiquidityMarketCard, {
        [Styles.HasUserLiquidity]: true,
        [Styles.Expanded]: expanded,
        [Styles.Final]: true,
        [Styles.Light]: theme === "Dark" ? false : true
      })}
    >
      <section>
      <MarketLink id={marketId?.toString()} dontGoToMarket={false}>
        <img src={Icon_Mapping[vaults[vaultId]?.want?.symbol]} style={{ height: 40, width: 40 }} />
        <span>
          <span>{instrument.name}</span>
          <span>{instrument.description}</span>
        </span>
      </MarketLink>
      <RammCategoryLabel text={instrument?.isPool ? "  Perpetual" : "Fixed Term"} />
      <span>{roundDown(instrument?.balance.toString(), 2)}</span>
      <span>{roundDown((((1 + Number(instrument?.seniorAPR) / 1e18) ** 31536000) - 1) * 100, 2)}{"%"}</span>
      <span>
        {instrument?.exposurePercentage.toString()}{"%"}
      </span>
      <span>
        {(approved ? "  Yes" : "No")}
      </span>
      <div>
        <div className={Styles.MobileLabel}>
          <span>Approved</span>
          <span>{(approved ? "  Yes" : "No")}</span>
        </div>
        {isMobile ?
          (<MarketLink id={marketId?.toString()} dontGoToMarket={false}>
            <p style={{ fontWeight: 'bold' }}> {bin2String(instrument.name)}</p>

            {<SecondaryThemeButton
              text={instrument?.name}
              small
              disabled={false}
              action={() =>
                history.push({
                  pathname: makePath(MARKET),
                  search: makeQuery({
                    [MARKET_ID_PARAM_NAME]: marketId,
                  }),
                })
              }
            />}

          </MarketLink>)

          : (
            <label onClick={() => setExpanded(!expanded)}>
              <SizedChevronFlip pointDown={expanded} width={40} height={40} />
            </label>
          )}
      </div>  
      </section>
      {expanded && InstrumentDetails}

    </article>
  );
}

const VaultCard = ({ vault }: any): React.FC => {
  const {
    settings: { timeFormat },
  } = useSimplifiedStore();
  const {
    account,
    balances: { lpTokens, pendingRewards },
    loginAccount,
  } = useUserStore();
  const [expanded, setExpanded] = useState(false);

  // const {actions: {setModal},} = useAppStatusStore(); 
  const history = useHistory();

  // const { vaults: vaults, instruments: instruments }: { vaults: VaultInfos, instruments: InstrumentInfos} = useDataStore2();
  const { vaultId } = vault;
  return (
    <article
      className={classNames(Styles.LiquidityMarketCard, {
        [Styles.HasUserLiquidity]: true,
        [Styles.Expanded]: expanded,
        [Styles.Final]: true,
      })}
    >

      <MarketLink id={vaultId?.toString()} dontGoToMarket={true}>

        <p style={{ fontWeight: 'bold' }}> {"VaultId: "}{vaultId?.toString() + " "}{"USDC"}{" Vault"}</p>

      </MarketLink>

      <button onClick={() => setExpanded(!expanded)}>
        {/*<CategoryIcon {...{ categories }} />
                <MarketTitleArea {...{ ...market, timeFormat }} />*/}
      </button>
      <span>{"-"}</span>
      <span>{"-"}</span>
      <span>{"-"}</span>
      <span>
        {"$0.00"}
      </span>
      <span>
        {"$0.00"}
        {true && <span>{"0"}</span>}
      </span>
      <div>
        <div className={Styles.MobileLabel}>
          <span>My Liquidity</span>
          <span>{"$0.00"}</span>
          {/* <span>init. value {formatCash(userHasLiquidity?.initCostUsd, currency).full}</span> */}
        </div>
        {/*<div className={Styles.MobileLabel}>
          <span>My Rewards</span>
          <span>
            {rewardAmount.formatted} {MaticIcon}
          </span>
          <span>(${rewardsInUsd})</span>
        </div>*/}

        {true ? (
          <PrimaryThemeButton
            text="Go to Vault"
            small
            disabled={false}
            action={() =>
              history.push({
                pathname: makePath(MARKET_LIQUIDITY),
                search: makeQuery({
                  [MARKET_ID_PARAM_NAME]: vaultId,
                  [MARKET_LIQUIDITY]: ADD,
                }),
              })
            }
          />
        ) : true ? (
          <PrimaryThemeButton
            text="REMOVE LIQUIDITY"
            small
            action={() =>
              history.push({
                pathname: makePath(MARKET_LIQUIDITY),
                search: makeQuery({
                  [MARKET_ID_PARAM_NAME]: vaultId,
                  [MARKET_LIQUIDITY]: REMOVE,
                }),
              })
            }
          />
        ) : (
          <>
            <SecondaryThemeButton
              text="-"
              small
              action={() =>
                history.push({
                  pathname: makePath(MARKET_LIQUIDITY),
                  search: makeQuery({
                    [MARKET_ID_PARAM_NAME]: vaultId,
                    [MARKET_LIQUIDITY]: REMOVE,
                  }),
                })
              }
            />
            <PrimaryThemeButton
              text="+"
              small
              disabled={true}
              action={() =>
                !true &&
                history.push({
                  pathname: makePath(MARKET_LIQUIDITY),
                  search: makeQuery({
                    [MARKET_ID_PARAM_NAME]: vaultId,
                    [MARKET_LIQUIDITY]: ADD,
                  }),
                })
              }
            />
          </>
        )}
      </div>
    </article>
  );
}

const LiquidityMarketCard = ({ market }: LiquidityMarketCardProps): React.FC => {
  const {
    settings: { timeFormat },
  } = useSimplifiedStore();
  const {
    balances: { lpTokens, pendingRewards },
    loginAccount,
  } = useUserStore();
  const { transactions } = useDataStore();
  const {
    marketId,
    categories,
    amm: {
      hasLiquidity,
      cash: { name: currency },
      liquidityUSD,
    },
    endTimestamp,
    rewards,
  } = market;

  const marketTransactions = transactions[marketId];
  const formattedApy = useMemo(() => marketTransactions?.apy && formatApy(marketTransactions.apy).full, [
    marketTransactions?.apy,
  ]);
  const formattedTVL = useMemo(
    () => liquidityUSD && formatCash(liquidityUSD, currency, { bigUnitPostfix: true }).full,
    [liquidityUSD]
  );
  const [price, setPrice] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const history = useHistory();
  const userHasLiquidity = lpTokens?.[marketId];
  const canAddLiq = canAddLiquidity(market);
  const isfinal = isMarketFinal(market);
  const pendingUserRewards = (pendingRewards || {})[market.marketId];
  const hasRewards = pendingUserRewards?.pendingBonusRewards && pendingUserRewards?.pendingBonusRewards !== "0";
  const rewardAmount = formatToken(pendingUserRewards?.balance || "0", { decimalsRounded: 2, decimals: 2 });
  useEffect(() => {
    let isMounted = true;
    getMaticUsdPrice(loginAccount?.library).then((p) => {
      if (isMounted) setPrice(p);
    });
    return () => (isMounted = false);
  }, []);
  const rewardsInUsd = formatCash(Number(pendingUserRewards?.balance || "0") * price).formatted;
  return (
    <article
      className={classNames(Styles.LiquidityMarketCard, {
        [Styles.HasUserLiquidity]: userHasLiquidity,
        [Styles.Expanded]: expanded,
        [Styles.Final]: isfinal,
      })}
    >
      <MarketLink id={marketId} dontGoToMarket={false}>
        <CategoryIcon {...{ categories }} />
        <MarketTitleArea {...{ ...market, timeFormat }} />
      </MarketLink>
      <button onClick={() => setExpanded(!expanded)}>
        <CategoryIcon {...{ categories }} />
        <MarketTitleArea {...{ ...market, timeFormat }} />
      </button>
      <span>{endTimestamp ? getMarketEndtimeDate(endTimestamp) : "-"}</span>
      <span>{formattedTVL || "-"}</span>
      <span>{formattedApy || "-"}</span>
      <span>
        {userHasLiquidity ? formatCash(userHasLiquidity?.usdValue, currency).full : "$0.00"}
        {/* {userHasLiquidity && <span>Init Value {formatCash(userHasLiquidity?.usdValue, currency).full}</span>} */}
      </span>
      <span>
        {rewardAmount.formatted} wMATIC
        {userHasLiquidity && <span>(${rewardsInUsd})</span>}
      </span>
      <div>
        <div className={Styles.MobileLabel}>
          <span>My Liquidity</span>
          <span>{userHasLiquidity ? formatCash(userHasLiquidity?.usdValue, currency).full : "$0.00"}</span>
          {/* <span>init. value {formatCash(userHasLiquidity?.initCostUsd, currency).full}</span> */}
        </div>
        <div className={Styles.MobileLabel}>
          <span>My Rewards</span>
          <span>
            {rewardAmount.formatted} {MaticIcon}
          </span>
          <span>(${rewardsInUsd})</span>
        </div>
        {!userHasLiquidity ? (
          <PrimaryThemeButton
            text="ADD LIQUIDITY"
            small
            disabled={!canAddLiq}
            action={() =>
              history.push({
                pathname: makePath(MARKET_LIQUIDITY),
                search: makeQuery({
                  [MARKET_ID_PARAM_NAME]: marketId,
                  [MARKET_LIQUIDITY]: hasLiquidity ? ADD : CREATE,
                }),
              })
            }
          />
        ) : isfinal ? (
          <PrimaryThemeButton
            text="REMOVE LIQUIDITY"
            small
            action={() =>
              history.push({
                pathname: makePath(MARKET_LIQUIDITY),
                search: makeQuery({
                  [MARKET_ID_PARAM_NAME]: marketId,
                  [MARKET_LIQUIDITY]: REMOVE,
                }),
              })
            }
          />
        ) : (
          <>
            <SecondaryThemeButton
              text="-"
              small
              action={() =>
                history.push({
                  pathname: makePath(MARKET_LIQUIDITY),
                  search: makeQuery({
                    [MARKET_ID_PARAM_NAME]: marketId,
                    [MARKET_LIQUIDITY]: REMOVE,
                  }),
                })
              }
            />
            <PrimaryThemeButton
              text="+"
              small
              disabled={isfinal || !canAddLiq}
              action={() =>
                !isfinal &&
                history.push({
                  pathname: makePath(MARKET_LIQUIDITY),
                  search: makeQuery({
                    [MARKET_ID_PARAM_NAME]: marketId,
                    [MARKET_LIQUIDITY]: ADD,
                  }),
                })
              }
            />
          </>
        )}
      </div>
      {hasRewards && <BonusReward pendingBonusRewards={pendingUserRewards} rewardsInfo={rewards} />}
    </article>
  );
};

const LiquidityView = () => {
  const {
    poolsViewSettings,
    actions: { updatePoolsViewSettings },
  } = useSimplifiedStore();
  const {
    account,
    loginAccount,
    balances: { lpTokens, pendingRewards },
  } = useUserStore();
  const { markets, transactions } = useDataStore();
  const { marketTypeFilter, sortBy, primaryCategory, subCategories, onlyUserLiquidity } = poolsViewSettings;
  const { vaults: vaults, instruments: instruments }: { vaults: VaultInfos, instruments: InstrumentInfos } = useDataStore2();



  const [filter, setFilter] = useState("");
  const [filteredMarkets, setFilteredMarkets] = useState([]);
  const [page, setPage] = useQueryPagination({
    itemCount: filteredMarkets.length,
    itemsPerPage: PAGE_LIMIT,
  });
  const marketKeys = Object.keys(markets);
  const userMarkets = Object.keys(lpTokens);
  const rewardBalance =
    pendingRewards && Object.values(pendingRewards).length
      ? String(
        Object.values(pendingRewards).reduce(
          (p: BigNumber, r: { balance: string; earnedBonus: string }) => p.plus(r.balance).plus(r.earnedBonus),
          ZERO
        )
      )
      : "0";
  const handleFilterSort = () => {
    applyFiltersAndSort(Object.values(markets), setFilteredMarkets, transactions, lpTokens, pendingRewards, {
      filter,
      primaryCategory,
      subCategories,
      marketTypeFilter,
      sortBy,
      onlyUserLiquidity,
    });
  };

  useEffect(() => {
    handleFilterSort();
  }, [filter, primaryCategory, subCategories, marketTypeFilter, onlyUserLiquidity, sortBy?.type, sortBy?.direction]);

  useEffect(() => {
    handleFilterSort();
  }, [marketKeys.length, userMarkets.length]);

  useScrollToTopOnMount(page);

  return (
    <div className={Styles.LiquidityView}>

      {/*<AppViewStats small liquidity /> */}
      {/*<AvailableLiquidityRewards balance={rewardBalance} /> */}
      {/*<MaticAddMetaMaskToken /> */}
      {/*<button onClick={() => setupExample( { account,loginAccount}
)}>SetUp</button>
  
  <button onClick={() => setUpExampleManager( { account,loginAccount}
)}>SetUpManager</button>
  <button onClick={()=> addExampleProposal({account, loginAccount})}>Example Proposal</button> */}

      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      {<h1>Earn by pricing risks</h1>}
      {/*<p>
              Pariticipate in pricing risks and earn more <a href=".">Learn more →</a>
            </p>*/}
      <ul>
        {/* <SecondaryThemeButton
  action = {()=> addExampleProposal({account, loginAccount})}
  text = {"Example Proposal"}
     /> */}
        {/*<SquareDropdown
          onChange={(value) => {
            updatePoolsViewSettings({ primaryCategory: value, subCategories: [] });
          }}
          options={categoryItems}
          defaultValue={primaryCategory}
        />*/}
        <SquareDropdown
          onChange={(value) => {
            updatePoolsViewSettings({ marketTypeFilter: value });
          }}
          options={INSTRUMENT_TYPE_OPTIONS}
          defaultValue={INSTRUMENT_TYPE_OPTIONS[0].value}
        />
        <label html-for="toggleOnlyUserLiquidity">
          <ToggleSwitch
            id="toggleOnlyUserLiquidity"
            toggle={onlyUserLiquidity}
            clean
            setToggle={() => updatePoolsViewSettings({ onlyUserLiquidity: !onlyUserLiquidity })}
          />
          {"My Positions"}
          {/*`My Liquidity Positions ${userMarkets.length > 0 ? `(${userMarkets.length})` : ''}`*/}
        </label>
        <label html-for="toggleOnlyUserLiquidity">
          <ToggleSwitch
            id="toggleOnlyUserLiquidity"
            toggle={onlyUserLiquidity}
            clean
            setToggle={() => updatePoolsViewSettings({ onlyUserLiquidity: !onlyUserLiquidity })}
          />
          {"Approved"}
          {/*`My Liquidity Positions ${userMarkets.length > 0 ? `(${userMarkets.length})` : ''}`*/}
        </label>
        <SearchInput value={filter} onChange={(e) => setFilter(e.target.value)} clearValue={() => setFilter("")} />
      </ul>
      <SubCategoriesFilter
        {...{
          updateCategories: updatePoolsViewSettings,
          subCategories,
          primaryCategory,
        }}
      />
      <section>
        <article>
          <span>Instrument Name</span>

          {Object.keys(INSTRUMENT_SORT_TYPES).map((sortType) => (
            <SortableHeaderButton
              {...{
                sortType,
                setSortBy: (sortBy) => updatePoolsViewSettings({ sortBy }),
                sortBy,
                text: INSTRUMENT_SORT_TYPE_TEXT[sortType],
                key: `${sortType}-sortable-button`,
              }}
            />
          ))}
          <span />

        </article>
        <section>
          {Object.values(instruments).map((instrument: any) => (
            <InstrumentCard instrument={instrument} />
          ))}

        </section>
      </section>
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

export default LiquidityView;

interface SortableHeaderButtonProps {
  setSortBy: Function;
  sortBy: { type: string | null; direction: number };
  sortType: string;
  text: string;
  key?: string;
}

export const SortableHeaderButton = ({ setSortBy, sortBy, sortType, text }: SortableHeaderButtonProps): React.FC => (
  <button
    className={classNames({
      [Styles.Ascending]: sortBy.direction < 0,
    })}
    onClick={() => {
      switch (sortBy.type) {
        case sortType: {
          setSortBy({
            type: sortBy.direction < 0 ? null : sortType,
            direction: sortBy.direction < 0 ? 1 : -1,
          });
          break;
        }
        default: {
          setSortBy({
            type: sortType,
            direction: 1,
          });
          break;
        }
      }
    }}
  >
    {sortBy.type === sortType && Arrow} {text} {sortType === POOL_SORT_TYPES.REWARDS ? MaticIcon : null}
  </button>
);


export const PoolCollateralCard: React.FC = ({ collateral, wantSymbol }: { collateral: Collateral, wantSymbol: string }) => {
  const { address, tokenId, borrowAmount, maxAmount, isERC20, symbol } = collateral; // should get tokenURI

  return (
    <div className={Styles.poolCollateralCard}>
      <section>
        <div>
        <RammCategoryLabel text={symbol} />
        {!isERC20 &&
          <span>
            TokenId: {tokenId}
          </span>
        }
        </div>
        
        
        <span>
          <ExternalLink URL={"https://mumbai.polygonscan.com/address/" + address} label={address} icon={true} />
        </span>


      </section>
      <section>
        <ValueLabel  label={"Borrowable amount per unit collateral"} value={handleValue(borrowAmount, wantSymbol)} />
        <ValueLabel  label={"Liquidation cap per unit collateral"} value={handleValue(maxAmount, wantSymbol)} />
      </section>
    </div>
  )
}