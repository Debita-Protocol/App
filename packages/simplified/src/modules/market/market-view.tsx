import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";
import Styles from "./market-view.styles.less";
import ButtonStyles from "../common/buttons.styles.less";
import classNames from "classnames";
import SimpleChartSection from "../common/charts";
import { PositionsLiquidityViewSwitcher, TransactionsTable } from "../common/tables";
import {  AddMetaMaskToken } from "../common/labels";
import {PositionsView} from "../common/positions"; 
import {ManagerWarning} from "../liquidity/market-liquidity-view"
import {TradingForm,IssueForm} from "./trading-form";
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
  ContractCalls2, 
  useUserStore, useDataStore2
} from "@augurproject/comps";
import type { MarketInfo, AmmOutcome, MarketOutcome, AmmExchange, 
InstrumentInfos, VaultInfos, CoreInstrumentData } from "@augurproject/comps/build/types";
import { MARKETS_LIST_HEAD_TAGS } from "../seo-config";
import { useSimplifiedStore } from "../stores/simplified";
import makePath from "@augurproject/comps/build/utils/links/make-path";
import { MARKETS } from "modules/constants";
import { Link } from "react-router-dom";
import {FormAmountInput} from "../pool-proposal/pool-proposal-view";

const {
  SEO,
  LabelComps: { generateTooltip, WarningBanner, CategoryIcon, CategoryLabel, ReportingStateLabel, NetworkMismatchBanner },
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
const{ fetchTradeData, getHedgePrice, getInstrumentData_, 
  // getTotalCollateral, 
  redeemZCB, getZCBBalances, approveUtilizer, 
canApproveUtilizer, getERCBalance} = ContractCalls; 
const{testApproveMarket} = ContractCalls2; 

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

      {winningOutcome==0?'Assessment': winningOutcome==1? "Approval Condition Met": "Approved"}
      {winningOutcome==2 && ConfirmedCheck}
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
  const [Yield, setYield] = useState("");
  const [estimatedYield, setEstimatedYield] = useState(0); 


  const marketId = useMarketQueryId();
  const { isMobile } = useAppStatusStore();
  const {
    settings: { timeFormat },
    showTradingForm,
    actions: { setShowTradingForm },
  } = useSimplifiedStore();
  const { cashes, markets, ammExchanges, blocknumber,transactions } = useDataStore();
  useScrollToTopOnMount();
  //let market: MarketInfo//!!defaultMarket ? defaultMarket : markets[marketId];
  const market = {} as MarketInfo;
  const amm: AmmExchange = ammExchanges[marketId];
  const hasInvalid = Boolean(amm?.ammOutcomes.find((o) => o.isInvalid));
  // const selectedOutcome = market ? (hasInvalid ? market.outcomes[1] : market.outcomes[0]) : DefaultMarketOutcomes[1];
  const selectedOutcome = DefaultMarketOutcomes[1];

  // console.log('amm', amm, amm?.ammOutcomes)

  const {
      account,
      loginAccount,
      balances,
      actions: { addTransaction },
    ramm: { reputationScore, vaultBalances, zcbBalances}

    } = useUserStore();
  const Id = Number(marketId)
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

  const { vaults: vaults, instruments: instruments, markets: market_ } = useDataStore2()
  console.log('instruments', instruments, market_); 
  // if (!instruments) {
  //   return <div >Vault Not Found.</div>;
  // }

  // const { isPool, poolData, duration, expectedYield, principal} = instruments? instruments[Id]: null
  const isPool = instruments[Id]?.isPool? true:false; 
  const poolData = instruments[Id]
  const duration = instruments[Id]?.duration
  const expectedYield = instruments[Id]?.expectedYield
  const principal = instruments[Id]?.principal
  const trusted = instruments[Id]?.trusted? 0: 1; 
  const totalCollateral = market_[Id]?.totalCollateral; 
  const alpha = market_[Id]?.parameters.alpha; 
  const isApproved = (!market_[Id]?.phase.duringAssessment && market_[Id]?.phase.alive); 
  const canbeApproved = market_[Id]?.marketConditionMet 
  const outcomeLabel = isApproved? 2: (canbeApproved&&!isApproved) ?1 : 0; 
  const longZCBSupply = market_[Id]?.longZCBsupply; 
  const instrumentBalance = instruments[Id]?.balance; 
  const instrumenType = 
    console.log('isApproved', isApproved, canbeApproved)

  // console.log('poolData',  instruments[Id],vaults, poolData,market_ , instruments?.Id); 

  const longZCB_ad = market_[marketId]?.longZCB
  const shortZCB_ad = market_[marketId]?.shortZCB; 
  // console.log('vaults', vaults, instruments, market_[marketId].longZCB)
  // console.log('account, looginaccoint, balances,actions', account, loginAccount, balances)
  // useEffect(async() =>{
  //   let stored; 
  //   let instrument;

  //   try{stored = await getHedgePrice(account, loginAccount?.library, String(market?.amm?.turboId));
  //   instrument = await getInstrumentData_(account, loginAccount?.library, String(market?.amm?.turboId))
  // }
  //     catch (err){console.log("status error", err)}

  //   setstoredCollateral(stored);
  //   setPrincipal(instrument?.principal.toString());
  //   setYield(instrument?.expectedYield.toString()); 
  //   const dur = Number(instrument?.duration.toString()); 
  //   setDuration(String(dur)); 


  // }, [])
  // useEffect(async ()=> {
  //   let tc; 
  //   let bal; 
  //   let lbal; 

  //     try{
  //     //stored = await fetchTradeData(loginAccount.library,account, market.amm.turboId);
  //     //stored = await getHedgePrice(account, loginAccount.library, String(market.amm.turboId));
  //    // instrument = await getInstrumentData_(account, loginAccount.library, String(market.amm.turboId)); 
  //     //tc = await getTotalCollateral(account, loginAccount?.library, String(market?.amm.turboId)); 
  //     tc = 0;
  //     bal = await getZCBBalances( account, loginAccount?.library, String(market?.amm.turboId)); 
  //     lbal = await getERCBalance(account, loginAccount?.library, "0x7C49b76207F71Ebd1D7E5a9661f82908E0055131" ); 
  //    // canbeApproved = await canApproveUtilizer(account, loginAccount.library, String(market.amm.turboId))
  
  //    // console.log('instruments', instrument); 
  //   }
  //   catch (err){console.log("status error", err)
  //  return;}
  //   // setstoredCollateral(stored);
  //   // setPrincipal(instrument.principal.toString());
  //   // setYield(instrument.expectedYield.toString()); 
  //   // const dur = Number(instrument.duration.toString()); 
  //   // setDuration(String(dur)); 
  //   setTotalCollateral(tc); 
  //   setLongBalance(Number(lbal.toString())/(10**18)); 
  //   setShortBalance(bal[1]); 
  //   console.log('here')
  // }, [blocknumber, transactions]);

 

  //Example types 
  const types = ["Discretionary Loan", "Isolated Lending", "Options Selling", "Leveraged Yield Farming", "Discretionary Loan", "Spot Allocation"]; 
  const titles = ["Flint Dao Creditline", "USDC lending in Fuse pool#3", "OTM BTC Put Short Position in weekly expiries", "Looping Yield Protocol fixed rate lending", "Kao Dao Creditline", "ETH+BTC Spot" ];
  const descriptions = ["Buy bonds issued by Flint Dao, or bet on its default", "Long or Short Isolated Lending Positions", "Long or Short Options selling positions", "Long or Short Leveraged Yield positions", "Buy bonds issued by Kao Dao, or bet on its default", "Long or Short Spot Positions"] 
  const marketisApproved = ["False", "False", "True", "False", "True", "True"]; 
  const principals = ["1000$", "3000$", "2500$","1400$", "4200$", "500$"]; 
  const aprs = ["100$", "120$","150$", "320$", "210$", "80$"]; 
  const durations = ["120 days", "1 Year", "30days", "60days", "1 Year", "10 days"]; 



  // if (marketNotFound) return <NonexistingMarketView text="Market does not exist." />;

  // if (!market) return <EmptyMarketView />;

 // const details = detailFromResolutionRules? getResolutionRules(market) : "No details";
  const details = "No details"; //getResolutionRules(market)

  // const { reportingState, title, description, startTimestamp, categories, winner } = market;
  const reportingState = null; 
  const title = null; 
  const description = null;
  const startTimestamp = 0; 
  const categories = null; 
  const winner = 0; 
  const marketTransactions = null//getCombinedMarketTransactionsFormatted(transactions, market, cashes);
  const { volume24hrTotalUSD = null, volumeTotalUSD = null } = transactions[marketId] || {};
  const isFinalized = false//isMarketFinal(market);
  const marketHasNoLiquidity = true//!amm?.id && !market.hasWinner;
  console.log('transactions,', transactions); 

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
  const testapprovemarket = ()=>{
    testApproveMarket(account, loginAccount.library, marketId).then((response)=>{
      console.log("testApproved")
    })
  }
  const utilizer_description = "Assess riskiness of lending to fuse isolated pool #3. Some of the collaterals in this pool are not liquid and may incur bad debt. ";
  const description1 = "This is a Zero Coupon Bond (ZCB) market for  " + "fuse pool #3, with a linear bonding curve AMM." +
   " Managers who buy these ZCB will hold a junior tranche position and outperform passive vault investors. "
  return (
    <div className={Styles.MarketView}>
      <SEO {...MARKETS_LIST_HEAD_TAGS} title={descriptions[0]} ogTitle={descriptions[0]} twitterTitle={descriptions[0]} />
      <section>

        <NetworkMismatchBanner />
          {!(reputationScore >0) && <ManagerWarning/>}

        {isMobile && <ReportingStateLabel {...{ reportingState, big: true }} />}
        <div className={Styles.topRow}>
          {/*<CategoryIcon big categories={categories} />
          {!isMobile && <ReportingStateLabel {...{ reportingState, big: true }} />} */}

        </div>
        {<h1>{"Instrument Name: " + (instruments[Id]?.name[0]!=0? instruments[Id]?.name[0] : "NFT Lending Pool")}</h1>}
        { <h4>{"Buy longZCB of this instrument if you think it will be profitable, shortZCB otherwise"}</h4>}
        <span>Instrument Type: {instruments[marketId]?.type? "Pool Instrument": "Fixed Rate/Term Instrument"}</span>
        <h3>Profit Mechanism</h3>
        <p>{isPool?
          "Profit made from longZCB is (realized instrument's return) - (promisedReturn), compounded every second. Participants can redeem their longZCB to realize profit. "
          : "longZCB can be redeemed after instrument's maturity. Redemption price is 1 if successful, but can go down to 0."}</p> 

        {startTimestamp ? <span>{getMarketEndtimeFull(startTimestamp, timeFormat)}</span> : <span />}
        {/*isFinalized && winningOutcome && <WinningOutcomeLabel winningOutcome={winningOutcome} />*/}

        {(<ul className={Styles.UpperStatsRow}>
         {/* <li>

            <p>(Senior) Promised Return</p>
            {generateTooltip(
                      "Returns made from the instrument that automatically is allocated to its parent vault, in APR",
                      "pr"
                    )}
            <span>{poolData?.promisedReturn}{" %"}</span> 

            {/*<span>{formatDai(totalCollateral/4.2/1e18  || "0.00").full}</span>
                        <span>{formatDai(principal/5/1e18 || "0.00").full}</span> */}
           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(storedCollateral/1000000 || "0.00").full}</span>
          </li>*/}
            <li>
              <p>{isPool? "Instrument's Estimated Return":"Instrument's Estimated Return" }</p>
                      {isPool? generateTooltip(
                      "Returns made from the instrument that automatically is allocated to its parent vault, in APR",
                      "pr"
                    ): generateTooltip(
                      "Yield generated from instrument, in notional amount. ",
                      "pr2")}
             <FormAmountInput
                updateAmount={(val) => {
                  console.log("val: ", estimatedYield);
                  if (/^\d*\.?\d*$/.test(val)) {
                    setEstimatedYield(
                      val
                      
                    )
                  }
                }}
                prepend={isPool?"%":""}
                amount={estimatedYield}
              />

            {/*<span>{formatDai(totalCollateral/4.2/1e18  || "0.00").full}</span>
                        <span>{formatDai(principal/5/1e18 || "0.00").full}</span> */}
           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(storedCollateral/1000000 || "0.00").full}</span> */}
          </li>
            <li>
            <p>{isPool? "longZCB Estimated Return": "longZCB estimated Redemption price"}</p>
              {isPool?generateTooltip(
                        "The returns longZCB would incur when the instrument makes its estimated returns. Instrument Expected Return - promisedReturn ",
                        "lexpected"
                      ): generateTooltip(
                        "The returns longZCB would incur when the instrument makes its estimated returns. Instrument Expected Return - promisedReturn ",
                        "lexpected")}
             
            <span>{String(estimatedYield)}{isPool&&" %"}</span> 

            {/*<span>{formatDai(totalCollateral/4.2/1e18  || "0.00").full}</span>
                        <span>{formatDai(principal/5/1e18 || "0.00").full}</span> */}
           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(storedCollateral/1000000 || "0.00").full}</span> */}
          </li>
        </ul>)}

        <WinningOutcomeLabel winningOutcome={outcomeLabel} />

        <div
          className={classNames(Styles.Details, {
            [Styles.isClosed]: !showMoreDetails,
          })}
        >
          <h4>Overview</h4>
          <p> {instruments[Id]?.description} </p>

          {/*details.map((detail, i) => (
            <p key={`${detail.substring(5, 25)}-${i}`}>{detail}</p>
          ))*/}
          {/*details.length > 1 && (
            <button onClick={() => setShowMoreDetails(!showMoreDetails)}>
              {showMoreDetails ? "Read Less" : "Read More"}
            </button>
          )*/}
          {/*showMoreDetails && 
           <div>



           </div>
         */}

        </div>

        <ul className={Styles.StatsRow}>
          <li>
            <span>Net Bought </span>
              {generateTooltip(
                        "Total amount of collateral used to buy (longZCB - shortZCB), denominated in underlying  ",
                        "net"
                      )}
            <span>{totalCollateral}</span> 
            {/*<span>{formatDai(totalCollateral/4.2/1e18  || "0.00").full}</span>
                        <span>{formatDai(principal/5/1e18 || "0.00").full}</span> */}
           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(storedCollateral/1000000 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Required Collateral</span>
              {generateTooltip(
                        "Amount of net ZCB needed to buy to approve(supply to) this instrument, denominated in underlying ",
                        "required net"
                      )}
            <span>{isPool?poolData?.saleAmount:Number(principal)*Number(alpha) }</span> 
          </li>

          <li>
            <span>longZCB Start Price </span>
            <span>{formatDai(0.818 || "0.00").full}</span>

            {/*<span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD/10 || "0.00").full}</span> */}
          </li>


          <li>
            <span>longZCB Price Now</span>
            <span>1</span>
            {/*<span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD || "0.00").full}</span>*/}
          </li>

        </ul>
        {!isPool ? (<ul className={Styles.StatsRow}>
          <li>
            <span>Principal </span>
            <span>{formatDai(principal || "0.00").full}</span>

           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(principal/1000000 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Expected Tot.Yield</span>
            <span>{formatDai(expectedYield  || "0.00").full}</span>
          {/* <span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD/10 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Duration(days) </span>
            <span>{duration}</span>
          </li>

          <li>
            <span>Start Date</span>
              <span>{"12/20/2022"}</span>

           {/* <span>{marketHasNoLiquidity ?"8/20/2022": formatLiquidity(amm?.liquidityUSD || "0.00").full}</span> */}
          </li>

          </ul>)
          :
          (<ul className={Styles.StatsRow}>
          <li>
            <span>Leverage Factor </span>
            <span>{poolData?.poolLeverageFactor}</span>

           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(principal/1000000 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Senior Promised Return</span>
            <span>{poolData?.promisedReturn}</span>

          {/* <span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD/10 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Manager Sale Amount </span>
            <span>{poolData?.saleAmount}</span>
          </li>

          <li>
            <span>Start Date</span>
              <span>{"8/20/2022"}</span>

           {/* <span>{marketHasNoLiquidity ?"8/20/2022": formatLiquidity(amm?.liquidityUSD || "0.00").full}</span> */}
          </li>

        </ul>)
      }
      {isPool && isApproved&& (<h4>Pool Info</h4>) }
      {isPool && isApproved && 
        (

          <ul className={Styles.StatsRow}>
          <li>
            <span>longZCB Issued </span>
            <span>{longZCBSupply}</span>

           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(principal/1000000 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Senior Capital Supplied </span>
            <span>{instrumentBalance}</span>
          {/* <span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD/10 || "0.00").full}</span> */}
          </li>
          <li>
            <span>First Loss Capital</span>
            <span>-</span>
          </li>

          <li>
            <span>Price of longZCB</span>
              <span>-</span>

           {/* <span>{marketHasNoLiquidity ?"8/20/2022": formatLiquidity(amm?.liquidityUSD || "0.00").full}</span> */}
          </li>

          </ul>)}

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
        <SimpleChartSection {...{ market, cash: amm?.cash, transactions: marketTransactions, timeFormat }} />
        {/*<PositionsLiquidityViewSwitcher ammExchange={amm} 
        lb={longBalance} sb={shortBalance} la={longZCBTokenAddress} sa={shortZCBTokenAddress}/> */}
        
        <PositionsView marketId = {marketId}/>

        <div
          className={classNames(Styles.Details, {
            [Styles.isClosed]: !showMoreDetails,
          })}
        >
          <h4>Open Orders</h4>
          <h4>Price History</h4>
          <h4>Details</h4>

          {/*details.map((detail, i) => (
            <p key={`${detail.substring(5, 25)}-${i}`}>{detail}</p>
          ))*/}
          {details.length > 1 && (
            <button onClick={() => setShowMoreDetails(!showMoreDetails)}>
              {showMoreDetails ? "Read Less" : "Read More"}
            </button>
          )}
          {details.length === 0 && <p>{description1}</p>}

        </div>
        <div className={Styles.TransactionsTable}>

         <span>Activity</span>
          {/*<TransactionsTable transactions={marketTransactions} />*/ }
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
        {/*!(isFinalized && winningOutcome )&& <TradingForm initialSelectedOutcome={selectedOutcome} amm={amm} />*/}
        {isFinalized && trusted==0 &&      <SecondaryThemeButton
          text="Redeem All ZCB"
          action={redeem}
          customClass={ButtonStyles.BuySellButton}
        />}
        { /*(!(isFinalized && winningOutcome ) && canbeApproved)&& <SecondaryThemeButton
          text="Approve Utilizer"
          action={approve_utilizer}
          customClass={ButtonStyles.TinyTransparentButton} 
        /> */}
        {/*<ManagerWarning/>*/}
          <WarningBanner
            //className={Styles.MarginTop}
            title="Reputation Gains  "
            subtitle={
              "Expected incremented reputation scores if instrument is profitable : 1"
            }
            // title2="Expected Profit "
            // subtitle2={"Expected Profit of longzcb to be made per second is profit of instrument - promisedReturn"}

           //onClose={() => updateSeenPositionWarning(marketAmmId, true, ADD)}
          />
     
        <TradingForm initialSelectedOutcome={selectedOutcome} amm={amm} marketId ={marketId}
        isApproved = {isApproved}/> 

<AddMetaMaskToken tokenSymbol = {"longZCB"} tokenAddress={longZCB_ad}  />
                <AddMetaMaskToken tokenSymbol = {"shortZCB"} tokenAddress={shortZCB_ad}  />
        {<SecondaryThemeButton
          text="Approve Instrument"
          action={testapprovemarket
            //() => setShowTradingForm(true)
          }
          customClass={ButtonStyles.BuySellButton}
        />}
      </section>
    </div>
  );
};

export default MarketView;
