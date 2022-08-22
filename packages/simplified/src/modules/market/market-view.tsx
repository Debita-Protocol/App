import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";
import Styles from "./market-view.styles.less";
import ButtonStyles from "../common/buttons.styles.less";
import classNames from "classnames";
import SimpleChartSection from "../common/charts";
import { PositionsLiquidityViewSwitcher, TransactionsTable } from "../common/tables";
import TradingForm from "./trading-form";
import {
  Constants,
  useAppStatusStore,
  useDataStore,
  useScrollToTopOnMount,
  Utils,
  Components,
  DerivedMarketData,
  ProcessData,
  Stores,
  ContractCalls, 
  useUserStore
} from "@augurproject/comps";
import type { MarketInfo, AmmOutcome, MarketOutcome, AmmExchange } from "@augurproject/comps/build/types";
import { MARKETS_LIST_HEAD_TAGS } from "../seo-config";
import { useSimplifiedStore } from "../stores/simplified";
import makePath from "@augurproject/comps/build/utils/links/make-path";
import { MARKETS } from "modules/constants";
import { Link } from "react-router-dom";
const {
  SEO,
  LabelComps: { CategoryIcon, CategoryLabel, ReportingStateLabel, NetworkMismatchBanner },
  Icons: { ConfirmedCheck },
  ButtonComps: { SecondaryThemeButton },
  InputComps: { OutcomesGrid },
} = Components;
const { getResolutionRules } = DerivedMarketData;
const { BUY, MARKET_ID_PARAM_NAME, DefaultMarketOutcomes } = Constants;
const {
  Utils: { isMarketFinal },
} = Stores;
const {
  DateUtils: { getMarketEndtimeFull },
  Formatter: { formatDai, formatLiquidity },
  PathUtils: { parseQuery },
} = Utils;
const { getCombinedMarketTransactionsFormatted } = ProcessData;
const{ fetchTradeData, getHedgePrice, getInstrumentData_, getTotalCollateral, redeemZCB, getZCBBalances, approveUtilizer, 
canApproveUtilizer} = ContractCalls; 

let timeoutId = null;

export const combineOutcomeData = (ammOutcomes: AmmOutcome[], marketOutcomes: MarketOutcome[]) => {
  if (!ammOutcomes || ammOutcomes.length === 0) return [];
  return marketOutcomes.map((mOutcome, index) => ({
    ...mOutcome,
    ...ammOutcomes[index],
  }));
};

export const getWinningOutcome = (ammOutcomes: AmmOutcome[], marketOutcomes: MarketOutcome[]) =>
  combineOutcomeData(ammOutcomes, marketOutcomes).filter(
    ({ payoutNumerator }) => payoutNumerator !== null && payoutNumerator !== "0"
  );

const WinningOutcomeLabel = ({ winningOutcome }) => (
  <span className={Styles.WinningOutcomeLabel}>
    <span>Instrument Status</span>
    <span>
      {/*winningOutcome.name*/}
      {'Success'}
      {ConfirmedCheck}
    </span>
  </span>
);

export const useMarketQueryId = () => {
  const location = useLocation();
  const { [MARKET_ID_PARAM_NAME]: marketId } = parseQuery(location.search);
  return marketId;
};

const EmptyMarketView = () => {
  return (
    <div className={classNames(Styles.MarketView, Styles.EmptyMarketView)}>
      <section>
        <section>
          <div />
          <div />
          <div />
        </section>
        <section>
          <div />
          <div />
          <div />
        </section>
        <section>
          <div />
          <div />
          <div />
          <div />
        </section>
        <section>
          <div />
          <div />
          <div />
          <div />
        </section>
        <section>
          <div />
        </section>
      </section>
      <section>
        <div />
        <div />
        <div />
      </section>
    </div>
  );
};

const NonexistingMarketView = ({ text, showLink = false }) => {
  return (
    <div className={classNames(Styles.MarketView, Styles.NonexistingMarketView)}>
      <section>
        <section>
          <span>{text}</span>
          {showLink && (
            <Link placeholder="Markets" to={makePath(MARKETS)}>
              Return to markets list
            </Link>
          )}
        </section>
      </section>
      <section></section>
    </div>
  );
};

const getAddress =async({
  account, loginAccount, marketId
}) =>{
  return ""; 
}

const MarketView = ({ defaultMarket = null }) => {
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [marketNotFound, setMarketNotFound] = useState(false);
  const [storedCollateral, setstoredCollateral] = useState(false);
  const [principal, setPrincipal] = useState("");
  const [Yield, setYield] = useState("");
  const [totalCollateral, setTotalCollateral] = useState("");


  const [duration, setDuration] = useState("");

  const marketId = useMarketQueryId();
  const { isMobile } = useAppStatusStore();
  const {
    settings: { timeFormat },
    showTradingForm,
    actions: { setShowTradingForm },
  } = useSimplifiedStore();
  const { cashes, markets, ammExchanges, transactions } = useDataStore();
  useScrollToTopOnMount();
  const market: MarketInfo = !!defaultMarket ? defaultMarket : markets[marketId];
  const amm: AmmExchange = ammExchanges[marketId];
  const hasInvalid = Boolean(amm?.ammOutcomes.find((o) => o.isInvalid));
  const selectedOutcome = market ? (hasInvalid ? market.outcomes[1] : market.outcomes[0]) : DefaultMarketOutcomes[1];
  // console.log('amm', amm, amm?.ammOutcomes)
  const longZCBTokenAddress = market?.shareTokens[0]; 
  const shortZCBTokenAddress = market?.shareTokens[1]; 
  const [longBalance, setLongBalance] = useState("0");
  const [shortBalance, setShortBalance] = useState("0"); 
  const {
      account,
      loginAccount,
      balances,
      actions: { addTransaction },
    } = useUserStore();

  useEffect(async ()=> {
    let stored ;
    let instrument;
    let tc; 
    let bal; 

      try{
      //stored = await fetchTradeData(loginAccount.library,account, market.amm.turboId);
      stored = await getHedgePrice(account, loginAccount.library, String(market.amm.turboId));
      instrument = await getInstrumentData_(account, loginAccount.library, String(market.amm.turboId)); 
      tc = await getTotalCollateral(account, loginAccount.library, String(market.amm.turboId)); 
      bal = await getZCBBalances( account, loginAccount.library, String(market.amm.turboId)); 
     // canbeApproved = await canApproveUtilizer(account, loginAccount.library, String(market.amm.turboId))
  
     // console.log('instruments', instrument); 
    }
    catch (err){console.log("status error", err)
   return;}
    setstoredCollateral(stored);
    setPrincipal(instrument.principal.toString());
    setYield(instrument.expectedYield.toString()); 
    const dur = Number(instrument.duration.toString())/1000000; 
    setDuration(String(dur)); 
    setTotalCollateral(tc); 
    setLongBalance(bal[0]); 
    setShortBalance(bal[1]); 
  });

  useEffect(() => {
    if (!market) {
      timeoutId = setTimeout(() => {
        if (!market && marketId) {
          setMarketNotFound(true);
        }
      }, 60 * 1000);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [marketId]);

  useEffect(() => {
    if (timeoutId && market) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }, [market]);





  if (marketNotFound) return <NonexistingMarketView text="Market does not exist." />;

  if (!market) return <EmptyMarketView />;
 // const details = detailFromResolutionRules? getResolutionRules(market) : "No details";
  const details = getResolutionRules(market)

  const { reportingState, title, description, startTimestamp, categories, winner } = market;
  const winningOutcome = market.amm?.ammOutcomes?.find((o) => o.id === winner);
  const marketTransactions = getCombinedMarketTransactionsFormatted(transactions, market, cashes);
  const { volume24hrTotalUSD = null, volumeTotalUSD = null } = transactions[marketId] || {};
  const isFinalized = isMarketFinal(market);
  const marketHasNoLiquidity = !amm?.id && !market.hasWinner;

  const redeem = () =>{
    redeemZCB(account, loginAccount.library, String(market.amm.turboId)).then((response)=>{
      console.log('tradingresponse', response)}).catch((error)=>{
        console.log('Trading Error', error)
      }); 
  }
  const approve_utilizer = ()=>{
    approveUtilizer(account, loginAccount.library, String(market.amm.turboId)).then((response)=>{
      console.log('tradingresponse', response)}).catch((error)=>{
        console.log('Trading Error', error)
      }); 
  }
  const canbeApproved = true; 
  const utilizer_description = "Assess whether x DAO is creditworthy ";
  const description1 = "This is a Zero Coupon Bond (ZCB) market for  " + "name, with a linear bonding curve AMM." +
   " Managers who buy these ZCB will hold a junior tranche position and outperform passive vault investors. "
  return (
    <div className={Styles.MarketView}>
      <SEO {...MARKETS_LIST_HEAD_TAGS} title={description} ogTitle={description} twitterTitle={description} />
      <section>
        <NetworkMismatchBanner />
        {isMobile && <ReportingStateLabel {...{ reportingState, big: true }} />}
        <div className={Styles.topRow}>
          <CategoryIcon big categories={categories} />
          <CategoryLabel big categories={categories} />
          {!isMobile && <ReportingStateLabel {...{ reportingState, big: true }} />}
        </div>
        {!!title && <h1>{title}</h1>}
        {!!description && <h2>{description}</h2>}
        {!!startTimestamp ? <span>{getMarketEndtimeFull(startTimestamp, timeFormat)}</span> : <span />}
        {isFinalized && winningOutcome && <WinningOutcomeLabel winningOutcome={winningOutcome} />}

        <div
          className={classNames(Styles.Details, {
            [Styles.isClosed]: !showMoreDetails,
          })}
        >
          <h4>Instrument Overview</h4>
          {details.map((detail, i) => (
            <p key={`${detail.substring(5, 25)}-${i}`}>{detail}</p>
          ))}
          {details.length > 1 && (
            <button onClick={() => setShowMoreDetails(!showMoreDetails)}>
              {showMoreDetails ? "Read Less" : "Read More"}
            </button>
          )}
          {details.length === 0 && 
           <div>
         { /* <p>ZCB Address</p> 
          <span> {longZCBTokenAddress} </span> */}
           <p>{utilizer_description}</p> </div>}
        </div>

        <ul className={Styles.StatsRow}>
<li>
            <span>Net ZCB Bought / Required</span>
            <span>{formatDai(totalCollateral/1000000 || "0.00").full}</span>
            <span>{formatDai(principal/5/1000000 || "0.00").full}</span>
           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(storedCollateral/1000000 || "0.00").full}</span> */}
          </li>
          <li>
            <span>ZCB Start Price </span>
            <span>{formatDai(0.818 || "0.00").full}</span>

            {/*<span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD/10 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Market Phase </span>
            <span>{"Assessment/a"}</span>
          </li>

          <li>
            <span>Hedge Price</span>
            <span>{formatDai(storedCollateral/1000000 || "0.00").full}</span>
            {/*<span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD || "0.00").full}</span>*/}
          </li>

        </ul>
        <ul className={Styles.StatsRow}>
          <li>
            <span>Principal </span>
            <span>{formatDai(principal/1000000 || "0.00").full}</span>

           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(principal/1000000 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Expected Tot.Yield</span>
            <span>{formatDai(Yield /1000000 || "0.00").full}</span>
          {/* <span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD/10 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Duration(days) </span>
            <span>{duration}</span>
          </li>

          <li>
            <span>Start Date</span>
            <span>{marketHasNoLiquidity ?"8/20/2022": formatLiquidity(amm?.liquidityUSD || "0.00").full}</span>
          </li>

        </ul>
      <div
          className={classNames(Styles.Details, {
            [Styles.isClosed]: !showMoreDetails,
          })}
        >
          {/*<h4>CDS Price History</h4> */}
        </div>

       {/* <OutcomesGrid
          outcomes={amm?.ammOutcomes}
          selectedOutcome={amm?.ammOutcomes[2]}
          showAllHighlighted
          setSelectedOutcome={() => null}
          orderType={BUY}
          ammCash={amm?.cash}
          dontFilterInvalid
          noClick
          hasLiquidity={amm?.hasLiquidity}
          marketFactoryType={amm?.market?.marketFactoryType}
        />
        <SimpleChartSection {...{ market, cash: amm?.cash, transactions: marketTransactions, timeFormat }} />*/}
        <PositionsLiquidityViewSwitcher ammExchange={amm} 
        lb={longBalance} sb={shortBalance} la={longZCBTokenAddress} sa={shortZCBTokenAddress}/> 

        <div
          className={classNames(Styles.Details, {
            [Styles.isClosed]: !showMoreDetails,
          })}
        >
          <h4>Market Details</h4>
          {details.map((detail, i) => (
            <p key={`${detail.substring(5, 25)}-${i}`}>{detail}</p>
          ))}
          {details.length > 1 && (
            <button onClick={() => setShowMoreDetails(!showMoreDetails)}>
              {showMoreDetails ? "Read Less" : "Read More"}
            </button>
          )}
          {details.length === 0 && <p>{description1}</p>}

        </div>
        <div className={Styles.TransactionsTable}>
         {/* <span>Activity</span>
          <TransactionsTable transactions={marketTransactions} /> */}
        </div>
        <SecondaryThemeButton
          text="Buy / Sell"
          action={() => setShowTradingForm(true)}
          customClass={ButtonStyles.BuySellButton}
        />
      </section>
      <section
        className={classNames({
          [Styles.ShowTradingForm]: showTradingForm,
        })}
      >
        {!(isFinalized && winningOutcome )&& <TradingForm initialSelectedOutcome={selectedOutcome} amm={amm} />}
        {isFinalized && winningOutcome &&      <SecondaryThemeButton
          text="Redeem All ZCB"
          action={redeem}
          customClass={ButtonStyles.BuySellButton}
        />}
        { (!(isFinalized && winningOutcome ) && canbeApproved)&& <SecondaryThemeButton
          text="Approve Utilizer"
          action={approve_utilizer}
          customClass={ButtonStyles.TinyTransparentButton}
        />}
        {/*<TradingForm initialSelectedOutcome={selectedOutcome} amm={amm} /> */}
      </section>
    </div>
  );
};

export default MarketView;
