import React, { useEffect, useMemo, useState } from "react";
import Styles from "./tables.styles.less";
import classNames from "classnames";
import { getClaimAllMessage } from "../portfolio/portfolio-view";
import {
  useAppStatusStore,
  useDataStore,
  useUserStore,
  Constants,
  DateUtils,
  Formatter,
  ContractCalls,
  Components,
  useDataStore2, 
} from "@augurproject/comps";
import {
  AmmExchange,
  AmmTransaction,
  MarketInfo,
  PositionBalance,
  Winnings,
  UserState,
  FormattedNumber,
  RewardsInfo,
  PendingUserReward,
} from "@augurproject/comps/build/types";
import getUSDC from "../../utils/get-usdc";
import { useSimplifiedStore } from "../stores/simplified";
const {
  LabelComps: { MovementLabel, generateTooltip, WarningBanner, ReportingStateLabel },
  PaginationComps: { sliceByPage, Pagination, useQueryPagination },
  ButtonComps: { PrimaryThemeButton, SecondaryThemeButton, TinyThemeButton },
  SelectionComps: { SmallDropdown },
  Links: { AddressLink, MarketLink, ReceiptLink },
  Icons: { EthIcon, UpArrow, UsdIcon, MaticIcon },
  InputComps: { SearchInput },
} = Components;
const { claimWinnings, getCompleteSetsAmount, cashOutAllShares, redeemPoolZCB } = ContractCalls;
const { formatDai, formatCash, formatSimplePrice, formatSimpleShares, formatPercent, formatToken } = Formatter;
const { timeSinceTimestamp, getMarketEndtimeFull, timeTogo, getMarketEndtimeDate } = DateUtils;
const { USDC, POSITIONS, LIQUIDITY, ALL, ADD, REMOVE, TRADES, TX_STATUS, TransactionTypes, MARKET_STATUS } = Constants;




export const redeem = ({
  account, loginAccount, marketId, amount
})=>{
  redeemPoolZCB(account, loginAccount.library, marketId, amount).then((response)=> {console.log(response)}); 
}

const MarketTableHeader = ({
  timeFormat,
  market: { startTimestamp, title, description, marketId, reportingState },
  ammExchange,
}: {
  timeFormat: string;
  market: MarketInfo;
  ammExchange: AmmExchange;
}) => (
  <div className={Styles.MarketTableHeader}>
    <MarketLink id={marketId}>
      <span className={Styles.MarketTitle}>
        {!!title && <span>{title}</span>}
        {!!description && <span>{description}</span>}
      </span>
      {reportingState !== MARKET_STATUS.TRADING && <ReportingStateLabel {...{ reportingState }} />}
      {/*{ammExchange.cash.name === USDC ? UsdIcon : "DS"}*/}
    </MarketLink>
    {!!startTimestamp && <div>{getMarketEndtimeFull(startTimestamp, timeFormat)}</div>}
  </div>
);

const PortfolioHeader = ()=>{
return (
    <ul className={Styles.PositionHeader}>
    <li>Market Id</li>
    <li>type</li>

    <li>
    Amount
    {generateTooltip(
      "Display values might be rounded. Dashes are displayed when liquidity is depleted.",
      "pnltip-positionheader"
    )}
  </li> 
  </ul>
  );
};

const PositionHeader = () => {
  const { isMobile } = useAppStatusStore();
  return (
    <ul className={Styles.PositionHeader}>
    <li>type</li>
      <li>Average Price</li>
      
        <li>
        Amount
        {generateTooltip(
          "Display values might be rounded. Dashes are displayed when liquidity is depleted.",
          "pnltip-positionheader"
        )}
      </li> 
    

     {/* <li>
        {isMobile ? (
          <>
            avg.
            <br />
            price
          </>
        ) : (
          "avg. price paid"
        )}
      </li>
      <li>init. value</li>
      <li>cur.{isMobile ? <br /> : " "}value</li>
      <li>
        p/l{" "}
        {generateTooltip(
          "Display values might be rounded. Dashes are displayed when liquidity is depleted.",
          "pnltip-positionheader"
        )}
      </li> */}

    </ul>
  );
};

const PositionRow = ({
  marketId, 
  hasLiquidity = true,
  outcome = 'outcome', 
  address = "-", 
  quantity = '1', 
  averagePricePurchased = "0.9", 
  limitOrder = null, 
  claimable , 
  portfolio = false , 
  zcbAmount , 
isApproved, 
}: {
  zcbAmount?: string; 
  marketId?: string, 
  claimable?: boolean
  limitOrder?: number; 
  // position?: PositionBalance;
  hasLiquidity: boolean;
  key?: string;
  outcome?: string;
  quantity?: string; 
  averagePricePurchased?:string; 
  address?: string; 
  portfolio?: boolean; 
isApproved?:  boolean; 
}) => {
  const {actions: {setModal},} = useAppStatusStore(); 
  const {
    account,
    loginAccount,
    actions: { addTransaction },
    balances,
    transactions,
  } = useUserStore();
  const { instruments } = useDataStore2()

  const [amount, setAmount] = useState<string>("");
  const isPool = instruments[marketId]?.isPool; 
  const redeemPrice = 1; 
return (
  <ul className={Styles.PositionRow}>

    <li >{outcome}{limitOrder!=null? limitOrder==0?" Bid" : " Ask" : ""} </li>

    <li>{"-  "} </li>
    <li>{zcbAmount} </li>
    <li>{!portfolio?(<TinyThemeButton
    // action={() => {
    //   setTableView(null);
    //   setActivity && setActivity();
    // }}
    small = {true}
    text={limitOrder!=null ? (limitOrder ==0? "Claim Bid": "Claim Ask"): "Redeem"}
    selected={false}
    disabled = {!claimable}
    error = {!claimable?"error":""}
    action={() =>
        setModal({

          type: "MODAL_CONFIRM_TRANSACTION",
          title: "Redeem",
          transactionButtonText: "Redeem",
          transactionAction: ({ onTrigger = null, onCancel = null }) => 
          {
            onTrigger && onTrigger();
            redeem({account, loginAccount, marketId, amount})
          
          },
          targetDescription: {
            //market,
            label: "" //isMint ? "Market" : "Pool",
          },
          footer: 
             {
                text: "Redeeming will automatically withdraw capital from the instrument",
            },
            marketId: marketId, 
            amount: amount, 
            setAmount: setAmount, 
          includeInput: isPool, 
           maxValue: zcbAmount||0, 
           name: outcome, 
           disabled :false, 
           redeemPrice: redeemPrice, 
           breakdowns:  [
                {
                  heading: "What you are redeeming?:",
                  infoNumbers: [
                    {
                      label: "longZCB",
                      value: Number(zcbAmount),                              
                    },
                  ],
                },
                {
                  heading: "What you'll recieve",
                  infoNumbers: [
                    {
                      label: "Underlying",
                      value: (Number(zcbAmount) * redeemPrice),                              
                    },
                  ],
                },
              ]          
              
          })
        }
      />):
      ( <SecondaryThemeButton
      text={"Go to market"}
      selected={false}
      small = {true}

      />
        ) 

    }
    
    </li>
    

  {/*  <li>{position.outcomeName}</li>
    <li>{formatSimpleShares(position.quantity).formattedValue}</li>
    <li>{formatSimplePrice(position.avgPrice).full}</li>
    <li>{formatDai(position.initCostUsd).full}</li>
    <li>{hasLiquidity ? formatDai(position.usdValue).full : "-"}</li>
    <li>
      {hasLiquidity ? (
        <MovementLabel value={formatDai(position.totalChangeUsd)} numberValue={parseFloat(position.totalChangeUsd)} />
      ) : (
        "-"
      )}
    </li> */}
  </ul>
)};

interface PositionFooterProps {
  claimableWinnings?: Winnings;
  market: MarketInfo;
  showTradeButton?: boolean;
}

const AWAITING_CONFIRM = "Waiting for Confirmation";
const AWAITING_CONFIRM_SUBTEXT = "(Confirm this transaction in your wallet)";
export const PositionFooter = ({
  claimableWinnings,
  market: { settlementFee, marketId, amm, marketFactoryAddress, turboId, title, description },
  showTradeButton,
}: PositionFooterProps) => {
  const { cashes } = useDataStore();
  const {
    account,
    loginAccount,
    actions: { addTransaction },
    balances,
    transactions,
  } = useUserStore();
  const [pendingCashOut, setPendingCashOut] = useState(false);
  const [pendingClaim, setPendingClaim] = useState(false);
  const [pendingCashOutHash, setPendingCashOutHash] = useState(null);
  const [pendingClaimHash, setPendingClaimHash] = useState(null);
  const ammCash = getUSDC(cashes);

  const hasWinner = amm?.market?.hasWinner;
  const disableClaim =
    pendingClaim ||
    Boolean(
      transactions.find(
        (t) =>
          t.status === TX_STATUS.PENDING && (t.hash === pendingClaimHash || t.message === getClaimAllMessage(ammCash))
      )
    );
  const disableCashOut =
    pendingCashOut ||
    (pendingCashOutHash &&
      Boolean(transactions.find((t) => t.hash === pendingCashOutHash && t.status === TX_STATUS.PENDING)));

  useEffect(() => {
    if (!disableClaim && pendingClaimHash) {
      setPendingClaimHash(null);
    }

    if (!disableCashOut && pendingCashOutHash) {
      setPendingCashOutHash(null);
    }
  }, [pendingCashOutHash, pendingClaimHash, disableClaim, disableCashOut, transactions]);

  const claim = async () => {
    if (amm && account) {
      setPendingClaim(true);
      claimWinnings(account, loginAccount?.library, [String(turboId)], marketFactoryAddress)
        .then((response) => {
          // handle transaction response here
          setPendingClaim(false);
          if (response) {
            const { hash } = response;
            addTransaction({
              hash,
              chainId: loginAccount?.chainId,
              seen: false,
              status: TX_STATUS.PENDING,
              from: account,
              addedTime: new Date().getTime(),
              message: `Claim Winnings`,
              marketDescription: `${title} ${description}`,
            });
            setPendingClaimHash(hash);
          }
        })
        .catch((error) => {
          setPendingClaim(false);
          console.error("Error when trying to claim winnings: ", error?.message);
          addTransaction({
            hash: `claim-failed${Date.now()}`,
            chainId: loginAccount?.chainId,
            seen: false,
            status: TX_STATUS.FAILURE,
            from: account,
            addedTime: new Date().getTime(),
            message: `Claim Winnings`,
            marketDescription: `${title} ${description}`,
          });
        });
    }
  };

  const cashOut = async () => {
    setPendingCashOut(true);
    cashOutAllShares(
      account,
      loginAccount?.library,
      balances?.marketShares[marketId]?.outcomeSharesRaw,
      String(turboId),
      amm?.shareFactor,
      amm?.marketFactoryAddress
    )
      .then((res) => {
        setPendingCashOut(false);
        if (res) {
          const { hash } = res;
          addTransaction({
            hash,
            chainId: loginAccount?.chainId,
            seen: false,
            status: TX_STATUS.PENDING,
            from: account,
            addedTime: new Date().getTime(),
            message: `Cashed Out Shares`,
            marketDescription: `${title} ${description}`,
          });
          setPendingCashOutHash(hash);
        }
      })
      .catch((error) => {
        setPendingCashOut(false);
        console.error("Error when trying to claim winnings: ", error?.message);
        addTransaction({
          hash: `cash-out-failed${Date.now()}`,
          chainId: loginAccount?.chainId,
          seen: false,
          status: TX_STATUS.FAILURE,
          from: account,
          addedTime: new Date().getTime(),
          message: `Cashed Out Shares`,
          marketDescription: `${title} ${description}`,
        });
      });
  };
  const hasCompleteSets =
    getCompleteSetsAmount(balances?.marketShares[marketId]?.outcomeShares, amm?.ammOutcomes) !== "0";

  if (!claimableWinnings && !showTradeButton && !hasCompleteSets) return null;

  return (
    <div className={Styles.PositionFooter}>
      <span>
        {claimableWinnings && <p>{`${formatPercent(settlementFee).full} fee charged on settlement`}</p>}
        {hasCompleteSets && <p>No fee charged when cashing out shares</p>}
      </span>
      {hasCompleteSets && !hasWinner && (
        <PrimaryThemeButton
          text={pendingCashOut ? AWAITING_CONFIRM : "Cash Out Shares"}
          action={cashOut}
          subText={pendingCashOut && AWAITING_CONFIRM_SUBTEXT}
          disabled={disableCashOut}
        />
      )}
      {claimableWinnings && (
        <>
          <PrimaryThemeButton
            text={
              !pendingClaim
                ? `Claim Winnings (${formatCash(claimableWinnings?.claimableBalance, amm?.cash?.name).full})`
                : AWAITING_CONFIRM
            }
            subText={pendingClaim && AWAITING_CONFIRM_SUBTEXT}
            action={claim}
            disabled={disableClaim}
          />
        </>
      )}
      {showTradeButton && (
        <MarketLink id={marketId} ammId={amm?.id}>
          <SecondaryThemeButton text={!hasWinner ? "trade" : "view"} />
        </MarketLink>
      )}
    </div>
  );
};

const applyFiltersAndSort = (passedInPositions, filter, setFilteredMarketPositions, claimableFirst) => {
  let updatedFilteredPositions = passedInPositions;
  if (filter !== "") {
    updatedFilteredPositions = updatedFilteredPositions.filter((position) => {
      const { title, description, categories, outcomes } = position?.ammExchange?.market;
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

  if (claimableFirst) {
    updatedFilteredPositions.sort((a, b) => (a?.claimableWinnings?.claimableBalance ? -1 : 1));
  }
  setFilteredMarketPositions(updatedFilteredPositions);
};



// TODO: the "40%"" below should be replaced with a real rewards calc to
// provide a 0%-100% string value to fill the progress bar.
export const BonusReward = ({
  pendingBonusRewards,
  rewardsInfo,
}: {
  pendingBonusRewards: PendingUserReward;
  rewardsInfo: RewardsInfo;
}) => {
  const DONE = 100;
  const bonusAmount = formatToken(pendingBonusRewards?.pendingBonusRewards || "0")?.formatted;
  const { beginTimestamp } = rewardsInfo;
  const now = Math.floor(new Date().getTime() / 1000);
  const endTimestamp: number = pendingBonusRewards?.endBonusTimestamp || 0;
  const secondsRemaining = endTimestamp - now;
  const totalSeconds = endTimestamp - beginTimestamp;
  let filled = (1 - secondsRemaining / totalSeconds) * 100;
  if (now > endTimestamp) filled = DONE;
  const dateOnly = getMarketEndtimeDate(endTimestamp);
  const countdownDuration = timeTogo(endTimestamp);
  return (
    <article className={Styles.BonusReward}>
      <h4>Bonus Reward</h4>
      <p>Keep your liquidity in the pool until the unlock period to get a bonus on top of your rewards</p>
      <span>
        <span style={{ width: `${filled}%` }} />
      </span>
      <h4>
        {filled === DONE ? `Bonus Unlocked` : `Bonus Locked`}: {bonusAmount} {MaticIcon}
      </h4>
      <p>{filled !== DONE ? `${dateOnly} (${countdownDuration})` : "Remove liquidity to claim"}</p>
    </article>
  );
};

interface PositionsLiquidityViewSwitcherProps {
  ammExchange?: AmmExchange;
  showActivityButton?: boolean;
  setActivity?: Function;
  setTables?: Function;
  claimableFirst?: boolean;
  lb?: string; 
  sb?: string; 
  la?: string; 
  sa?: string; 
}

const POSITIONS_LIQUIDITY_LIMIT = 50;

interface PositionsTableProps {
  marketId?: string;
  // market: MarketInfo;
  // ammExchange: AmmExchange;
  // positions: PositionBalance[];
  // claimableWinnings?: Winnings;
  singleMarket?: boolean;
  portfolioPage?: boolean; 
  isApproved?: boolean;
}

export const PositionTable = ({
  marketId,  

  singleMarket=true,
  portfolioPage = false, 
  isApproved, 
}: PositionsTableProps) => {
  const {
    seenPositionWarnings,
    actions: { updateSeenPositionWarning },
    ramm: { reputationScore, vaultBalances, zcbBalances}

  } = useUserStore();
  const {
    settings: { timeFormat },
  } = useSimplifiedStore();


  // let vaultIds ; 
  // let marketIds; 
 
  

console.log('zcbBalances', ); 
  let position; 
  return (
    <>
      <div className={Styles.PositionTable}>
        {/*!singleMarket && 
          <MarketTableHeader timeFormat={timeFormat} market={market} ammExchange={ammExchange} />*/}
        {!portfolioPage? (<PositionHeader />):
        <PortfolioHeader/>}
        {/*positions.length === 0 && <span>No positions to show</span>*/}
        {<PositionRow  marketId = {marketId} portfolio = {portfolioPage} 
        zcbAmount = {zcbBalances[marketId]?.longZCB} isApproved = {isApproved}
        claimable = {true} key={String(0)} hasLiquidity={true} outcome={"longZCB"} quantity={"lb"} averagePricePurchased={"0.9"} address={"."}/>}
        {<PositionRow  marketId = {marketId} portfolio = {portfolioPage} 
        zcbAmount = {zcbBalances[marketId]?.shortZCB }isApproved = {isApproved}
        claimable = {true} key={String(1)} hasLiquidity={true} outcome={"shortZCB"} quantity={"sb"} averagePricePurchased={"0.1"} address={"."}/>}
        
        {false &&!portfolioPage && <PositionRow claimable= {true} limitOrder={0} key={String(2)} hasLiquidity={true} outcome={"Limit Order"} quantity={"lb"} averagePricePurchased={"0.9"} address={"."}/>}

        {/*{positions &&
          positions
            .filter((p) => p.visible)
            .map((position, id) => <PositionRow key={String(id)} position={position} hasLiquidity={hasLiquidity} />)} */}
        {/*<PositionFooter showTradeButton={!singleMarket} market={market} claimableWinnings={claimableWinnings} />*/}
      </div>
      {/*!seenMarketPositionWarningAdd &&
        singleMarket &&
        positions.filter((position) => position.positionFromAddLiquidity).length > 0 && (
          <WarningBanner
            className={Styles.MarginTop}
            title="Why do I have a position after adding liquidity?"
            subtitle={
              "To maintain the Yes to No percentage ratio, a number of shares are returned to the liquidity provider."
            }
            onClose={() => updateSeenPositionWarning(marketAmmId, true, ADD)}
          />
        )*/}
      {/*!seenMarketPositionWarningRemove &&
        singleMarket &&
        positions.filter((position) => position.positionFromRemoveLiquidity).length > 0 && (
          <WarningBanner
            className={Styles.MarginTop}
            title="Why do I have a position after removing liquidity?"
            subtitle={`To give liquidity providers the most options available to manage their positions. Shares can be sold for ${market?.amm?.cash?.name}.`}
            onClose={() => updateSeenPositionWarning(marketAmmId, true, REMOVE)}
          />
        )*/}
    </>
  );
};

const AllPositionTable = ({ marketId, page, claimableFirst = false, portfolioPage}) => {
  const {
    balances: { marketShares },

  }= useUserStore();
  const {
    settings: { showResolvedPositions },
  } = useSimplifiedStore();
  const [filter, setFilter] = useState("");
  const [filteredMarketPositions, setFilteredMarketPositions] = useState([1,1]);

  // const positions = marketShares 
  //   ? ((Object.values(marketShares).filter((s) => s.positions.length) as unknown[]) as {
  //       ammExchange: AmmExchange;
  //       positions: PositionBalance[];
  //       claimableWinnings: Winnings;
  //       outcomeShares?: string[];
  //     }[]).filter(
  //       (position) =>
  //         showResolvedPositions ||
  //         position?.claimableWinnings ||
  //         (!showResolvedPositions && !position.ammExchange.market.hasWinner)
  //     )
  //   : [];

  // const handleFilterSort = () => {
  //   applyFiltersAndSort(positions, filter, setFilteredMarketPositions, claimableFirst);
  // };

  // useEffect(() => {
  //   handleFilterSort();
  // }, [filter]);

  // useEffect(() => {
  //   handleFilterSort();
  // }, [positions.length, Object.values(marketShares || {}).length]);

  const positionVis = sliceByPage(filteredMarketPositions, page, POSITIONS_LIQUIDITY_LIMIT).map((position) => {
    return (
      <PositionTable
        marketId = {marketId}
        portfolioPage = {portfolioPage}
        // key={`${position.ammExchange.marketId}-PositionsTable`}
        // market={position.ammExchange.market}
        // ammExchange={position.ammExchange}
        // positions={position.positions}
        // claimableWinnings={position.claimableWinnings}
      />  
    ) ;
  });

  return (
    <>
      {/*<SearchInput
        placeHolder="Search Positions"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        clearValue={() => setFilter("")}
      />*/}
      {positionVis}
    </>
  );
};

interface PositionsLiquidityViewSwitcherProps {
  marketId?: string; 
  showActivityButton?: boolean;
  setActivity?: Function;
  setTables?: Function;
  claimableFirst?: boolean;
  portfolioPage?: boolean; 

  isApproved?: boolean; 
}
export const PositionsView = ({
  marketId, 
  showActivityButton = true,
  setActivity = null,
  setTables=null,
  claimableFirst = false,
  portfolioPage = false, 
  isApproved, 
}: PositionsLiquidityViewSwitcherProps) => {
  const {
    balances: { lpTokens, marketShares },
  }: UserState = useUserStore();

  const {
    account,
    loginAccount,
    balances,
    actions: { addTransaction },
  } = useUserStore();
  const {
    settings: { showResolvedPositions },
  } = useSimplifiedStore();
  const { vaults: vaults, instruments: instruments, markets: market_ } = useDataStore2()

  const [tableView, setTableView] = useState(POSITIONS);
  const [page, setPage] = useQueryPagination({
    itemCount: 10,//tableView === POSITIONS ? positions.length : liquidities.length,
    itemsPerPage: POSITIONS_LIQUIDITY_LIMIT,
  });




  return (
    <div className={Styles.PositionsLiquidityViewSwitcher}>
      <div>
        <span
          onClick={() => {
            setTables && setTables();
            setTableView(POSITIONS);
          }}
          className={classNames({
            [Styles.Selected]: tableView === POSITIONS,
          })}
        >
          {"My Positions"}
        </span>
        <span />
        {showActivityButton && (
          <TinyThemeButton
            action={() => {
              setTableView(null);
              setActivity && setActivity();
            }}
            text="your activity"
            selected={tableView === null}
          />
        )}
      </div>
      {tableView !== null && (
        <div>
          {!marketId &&  (
            <>{tableView === POSITIONS && <AllPositionTable marketId = {marketId}
            page={page} claimableFirst={claimableFirst} portfolioPage = {portfolioPage}/>}</>
          )} 
          {!marketId &&
             (
              <Pagination
                page={page}
                useFull
                itemCount={10}//tableView === POSITIONS ? positions.length : liquidities.length}
                itemsPerPage={POSITIONS_LIQUIDITY_LIMIT}
                showPagination = {false}
                action={(page) => setPage(page)}
                updateLimit={() => null}
                usePageLocation
              />
            )}
          {marketId && (
            <>
              {tableView === POSITIONS && (
                <PositionTable
                  marketId = {marketId}
                  singleMarket
                  isApproved = {isApproved}
                  // market={market}
                  // ammExchange={ammExchange}
                  // positions={userPositions}
                  // claimableWinnings={winnings}
                  // lb={lb} sb={sb} la={la} sa={sa}
                />
              )}
            </>
          )}
        </div>
      )}
      {/*positions?.length === 0 && !marketId && tableView === POSITIONS && <span>No positions to show</span>}
      {liquidities?.length === 0 && !marketId && tableView === LIQUIDITY && <span>No liquidity to show</span>*/}
    </div>
  );

}


