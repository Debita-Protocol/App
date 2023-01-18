import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";

// @ts-ignore
import Styles from "./market-view.styles.less";

// @ts-ignore
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
import {Sidebar} from "../sidebar/sidebar";
// const collateralLink =()=>{
//     return( 
//       <a href={getChainExplorerLink(chainId, link, "transaction")} target="_blank" rel="noopener noreferrer">
//         {LinkIcon}
//       </a>)

// }
export const InstrumentBreakDownFormat = ({instrumentType, field = null})=>{
  if (instrumentType==1){

    return [{    
            heading: "Additional Information",
            infoNumbers: [
              {
                label: "Strike Price",
                value: field[0],
              },
              {
                label: "Collateral supplied by protocol",
                value: field[2],
              },
              {
                label: "Total Premium received from selling",
                value: field[1],             
              },
               {
                label: "Price per option contract",
                value: field[3],
                
              },
              {
                label: "Assessment Remaining Minutes",
                value: Math.floor(field[4]/60),
              },
            ],
          }]
  }
  else if(instrumentType == 2){
    let infos = []; 
    for(let i=0; i< field?.length; i++){
      infos[i] = {
            heading: "Collateral Information",
            infoNumbers: [
              {
                label: "Collateral Addresses",
                value: field[i][0],
                //value: collateralLink
              },
              {
                label: "Collateral type",
                value: field[i][1] == true? "ERC20": "ERC721",
              },
              { 
                label: "Collateral Name",
                value: field[i][2],
                

              },
              { 
                label: "Max Borrowable underlying per unit collateral",
                value: field[i][3],
                
              }, 
              { 
                label: "TokenId",
                value: field[i][1] == true? "-": field[i][4],
                
              }
            ],
          }


    }
    return infos; 
  }
  else return 0; 
}
export const InstrumentOverviewFormat = ({ instrumenType}) =>{
  if (instrumenType == 1){
    return "Managers who think the price of the underlying asset would be below the proposed strike price by maturity should buy longZCB. When the option is not exercised, the proposed estimated return will be fully paid by the utilizer, and redemption price of longZCB will be 1. "
  }
  else {
    return" Managers who think, with the collateral of this lending pool and the given pool parameters the lendingPool will stay solvent should buy longZCB. By doing so, they will automatically earn junior tranche of the yields generated by the lendingPool. "
  }
}

export const InstumentDescriptionFormat = ({instrumenType})=>{
  const fields =["ETH", "1100", "1/20/2023", "1" ]
  if (instrumenType == 1){
    return "The covered call instrument for "+ fields[0] + " has a strike price of "
    + fields[1] + " and a maturity date at " +fields[2] + ". The redemption price of longZCB of this bet, if correct, is "
    + fields[3] + ". Given the payoff, If you want to bet on the price of ETH to be below "
    + fields[1] + " by " + fields[2] +" then buy longZCB."
    
  }
  else if(instrumenType==2){
    return "The conditional lendingPool has the following tokens as collateral." 

  }
  else return null; 
}
export const InstrumentField = ({instrumentType, instrument})=>{
  let fields = []
  if(!instrument) return null; 

  if(instrumentType==2){
    const collateralinfo = instrument?.collaterals; 
    for(let i=0; i< collateralinfo.length;  i++){
      fields[i] = [collateralinfo[i].address,collateralinfo[i].isERC20, 
      collateralinfo[i].name, collateralinfo[i].maxAmount, collateralinfo[i].tokenId ]
    }
    return fields; 
  }
  else if(instrumentType == 1){
    const curtime = Math.floor((new Date()).getTime() / 1000) ; 
    const{strikePrice, shortCollateral,tradeTime, pricePerContract} = instrument; 
    fields[0] = strikePrice; 
    fields[1] = roundDown(shortCollateral * pricePerContract,2); 
    fields[2] = shortCollateral; 
    fields[3] = pricePerContract; 
    fields[4] = Number(tradeTime) > curtime ? 
    String(Number(tradeTime) - curtime): "Assessment Period Ended"

    return fields; 
  }
  else{
    return null; 
  }
}

const FormAmountInput = ({amount, updateAmount, prepend }) => {

    console.log('amountinput here', amount); 
  return (
    <div className={classNames(Styles.FormAmountInput, {
      [Styles.Edited]: amount !== ""
    })}>
      <span>
        {prepend}
      </span>
      <input
        type="number"
        value={amount}
        placeholder="0"
        onChange={(e) => {
          console.log('estimated yield here', e.target.value, amount)
          updateAmount(e.target.value);
        }} 
        onWheel={(e: any) => e?.target?.blur()}
      />
    </div>
    
  )
}


const {
  SEO,
  LabelComps: { generateTooltip, WarningBanner, CategoryIcon, CategoryLabel, ReportingStateLabel, NetworkMismatchBanner },
  Icons: { ConfirmedCheck, LinkIcon },
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
const estimatedReturnsPerp = (
  promised_return:number, 
  leverageFactor: number, 
  inceptionPrice: number,
  returns: number ) =>{//returns is in decimals, 0.1 is 10% apr 

// (BASE_UNIT+ vars.leverageFactor).mulWadDown(previewMint(BASE_UNIT.mulWadDown(vars.inceptionPrice))) 
//       -  vars.srpPlusOne.mulWadDown(vars.leverageFactor)
      //totalassets/totalshares * amount totalassets*10/totalshares * amount * 
      // inceptionPrice * 1+returns
      // vars.inceptionPrice.mulWadDown((BASE_UNIT+ vars.promised_return)
      // .rpow(block.timestamp - vars.inceptionTime, BASE_UNIT))    
  const srpPlusOne = inceptionPrice * ((1 + promised_return/1e18) ** (31536000)) ;
  const term1 = (1+Number(leverageFactor)); 
  const term2 =  (inceptionPrice* (1+ returns)); 
  // console.log('srpplusone', srpPlusOne,  (inceptionPrice* (1+ returns)),(1 + promised_return), (1 + leverageFactor) * (inceptionPrice* (1+ returns)), 
  //  (srpPlusOne* leverageFactor)); 
  console.log('leverageFactor', term1, term2, term1*term2 ,promised_return,  returns, srpPlusOne, leverageFactor); 
  return  100* (term1 * term2 - (srpPlusOne* leverageFactor)-inceptionPrice)/inceptionPrice; 
  //return ((1 + leverageFactor) * (inceptionPrice* (1+ returns)) - (srpPlusOne* leverageFactor) - inceptionPrice)/inceptionPrice; 
      // 1+lev * inception - 15* lev 
      // inception + levinception - inception*lev = inception 

}
const estimatedReturnsFixed = (
  totalSupply:number, principal: number, 
expectedYield: number, managerExpectedYield: number, alpha:number, price:number ) => {

  let totalSupply_ = (principal * alpha)/price; 
  const extra_gain = Number(managerExpectedYield)> Number(expectedYield)? Number(managerExpectedYield) - Number(expectedYield) : 0; 
  const loss = Number(managerExpectedYield)> Number(expectedYield)? 0: Number(expectedYield) + Number(principal) - 
   (Number(principal) +Number(managerExpectedYield)); 
  console.log('extragain/loss', totalSupply, principal, expectedYield, managerExpectedYield, extra_gain, loss); 

  let redemption_price; 
  if (extra_gain > 0) redemption_price = 1 + extra_gain/totalSupply_
  else{
    if(1 <= loss/totalSupply_) return 0; 
    else redemption_price = 1 - loss/totalSupply_; 
  }


  return redemption_price; 
}

  function roundDown(number, decimals) {
      decimals = decimals || 0;
      return ( Math.floor( number * Math.pow(10, decimals) ) / Math.pow(10, decimals) );
  }

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
function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year 
  //+' ' + hour + ':' + min + ':' + sec ;
  return time;
}
console.log(timeConverter(0));
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
  console.log('date',Math.floor((new Date()).getTime() / 1000)
 ); 

  const marketId = useMarketQueryId();

  const { actions: {setModal},isMobile } = useAppStatusStore();
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
  console.log('instruments!', instruments, market_, loginAccount); 
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
  const longZCBPrice = market_[Id]?.bondPool.longZCBPrice; 
  const isApproved = (!market_[Id]?.duringAssessment && market_[Id]?.alive); 
  const canbeApproved = market_[Id]?.marketConditionMet 
  const outcomeLabel = isApproved? 2: (canbeApproved&&!isApproved) ?1 : 0; 
  const longZCBSupply = market_[Id]?.bondPool.longZCB.longZCBsupply; 
  const instrumentBalance = instruments[Id]?.balance; 
  const instrumentTypeWord =  market_[Id]?.instrumentType; 
  const vaultId = instruments[Id]?.vaultId
  const asset = vaults[vaultId]?.want.name; 
  // const instrumenType = 
  //   console.log('isApproved', isApproved, canbeApproved)

  // console.log('poolData',  instruments[Id],vaults, poolData,market_ , instruments?.Id); 

  const longZCB_ad = market_[marketId]?.longZCB
  const shortZCB_ad = market_[marketId]?.shortZCB; 

  const type = market_[Id]?.instrumentType; 

  const instrumentField = InstrumentField({instrumentType: Number(type), instrument: instruments[Id]}); 
  console.log('field', instrumentField); 
  const instrumentOverview = InstrumentOverviewFormat({instrumenType: Number(type)})
  const instrumentDescription = InstumentDescriptionFormat({instrumenType: Number(type)}); 
  const instrumentBreakDown = InstrumentBreakDownFormat({instrumentType: Number(type), field: instrumentField }); 


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
  const [estimatedYield, setEstimatedYield] = useState(0); 
  console.log('promisedReturnee', instruments[marketId]?.promisedReturn); 
  const managerExpectedYield =  isPool? estimatedReturnsPerp(instruments[marketId]?.promisedReturn, 
    poolData?.poolLeverageFactor,instruments[marketId]?.inceptionPrice, estimatedYield/100) 
  : estimatedReturnsFixed(longZCBSupply, principal, expectedYield, estimatedYield, Number(alpha), Number(longZCBPrice)); 
    


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
      <SEO {...MARKETS_LIST_HEAD_TAGS} title={instruments[Id]?.name[0]} ogTitle={instruments[Id]?.name[0]} twitterTitle={instruments[Id]?.name[0]} />
      <section>
        <NetworkMismatchBanner />
          {!(reputationScore >0) && <ManagerWarning/>}

        {isMobile && <ReportingStateLabel {...{ reportingState, big: true }} />}
        <div className={Styles.topRow}>
          {/*<CategoryIcon big categories={categories} />
          {!isMobile && <ReportingStateLabel {...{ reportingState, big: true }} />} */}
          {<h2>{"Instrument: " + (instruments[Id]?.name!=0? instruments[Id]?.name : "NFT Lending Pool")}</h2>}


        </div>
          { <p>{"Buy longZCB of this instrument if you think it will be profitable, shortZCB otherwise"}</p>}

        <span>Instrument Type: {isPool? "Perpetual Instrument": "Fixed Rate/Term Instrument"}</span>
        <h3>Profit Mechanism</h3>
        <p>{isPool?
          "Buying longZCB will automatically supply capital to the instrument from its parent vault. Profit for longZCB is compounded every second. Participants can redeem their longZCB to realize profit. "
          : "Buy longZCB if you believe the price of " +asset +" will be below the strikePrice by maturity."+" longZCB can be redeemed after instrument's maturity. Redemption price is 1 if successful, but can go down to 0."}</p> 

        {startTimestamp ? <span>{getMarketEndtimeFull(startTimestamp, timeFormat)}</span> : <span />}
        {/*isFinalized && winningOutcome && <WinningOutcomeLabel winningOutcome={winningOutcome} />*/}
        <div>
              <h4>Overview</h4>

          <p> {/*instruments[Id]?.description*/}
          {instrumentOverview}</p>
          <SecondaryThemeButton
          text="More Info"
          action={() =>
        setModal({

          type: "MODAL_CONFIRM_TRANSACTION",
          title: "Instrument Information",
          includeButton : false, 
          // transactionButtonText: "Redeem",
          // transactionAction: ({ onTrigger = null, onCancel = null }) => 
          // {
          //   onTrigger && onTrigger();
          //   redeem({account, loginAccount, marketId, amount})
          
          // },
          targetDescription: {
            //market,
            label: "Overview",  //isMint ? "Market" : "Pool",
            subLabel: instrumentDescription
          },
          footer: 
             {
                text: "-",
            },
          
           name: "outcome", 
           breakdowns:  instrumentBreakDown
           // [
           //      instrumentBreakDown[0]

           //      // {
           //      //   heading: "What you'll recieve",
           //      //   infoNumbers: [
           //      //     {
           //      //       label: "Underlying",
           //      //       value: 1,                              
           //      //     },
           //      //   ],
           //      // },
           //    ]          
              
          })
        }
          customClass={ButtonStyles.TinyTransparentButton} 
        /> 
          </div>
        <h3>Simulate Returns</h3>
        {(<ul className={Styles.UpperStatsRow}>
    {!isPool &&type==1 &&(
            <li>
            <span>{"Price of "+ asset} </span>
            {generateTooltip(
              "Total amount of underlying used by the instrument  ",
              "principal"
                      )}
            <span>{roundDown(principal ,3)}</span>

           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(principal/1000000 || "0.00").full}</span> */}
          </li>)
        }
          {!isPool &&type==1 &&(
            <li>
            <span>Principal </span>
            {generateTooltip(
              "Total amount of underlying used by the instrument  ",
              "principal"
                      )}
            <span>{roundDown(principal ,3)}</span>

           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(principal/1000000 || "0.00").full}</span> */}
          </li>)
        }
          
         { !isPool&& (<li>
            <span>{"Proposed Estimated Return"}</span>
              {generateTooltip(
                "The yield the instrument would incur as proposed by the utilizer" ,
                "estimated return")
                }
             
            <span>{String(roundDown(expectedYield, 3))}</span> 

            {/*<span>{formatDai(totalCollateral/4.2/1e18  || "0.00").full}</span>
                        <span>{formatDai(principal/5/1e18 || "0.00").full}</span> */}
           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(storedCollateral/1000000 || "0.00").full}</span> */}
          </li>)}
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
              <span>{isPool? "Instrument's Estimated APR":"Instrument's Estimated Return" }</span>
                      {isPool? generateTooltip(
                      "Actual Returns made from the instrument in APR",
                      "pr"
                    ): generateTooltip(
                      "Actual return generated from instrument, denominated in its underlying. Min: -(principal), Max: +(Proposed estiamted return)",
                      "pr2")}
             <FormAmountInput
              
                updateAmount = {setEstimatedYield}
                // {
                //   (val) => {
                //   console.log("val: ", estimatedYield);
                //   setEstimatedYield(
                //       val
                      
                //     )
                //   // if (/^\d*\.?\d*$/.test(val)) {
                //   //   setEstimatedYield(
                //   //     val
                      
                //   //   )
                //   // }
                // }}
                prepend={isPool?"%":""}
                amount={estimatedYield}
              />

            {/*<span>{formatDai(totalCollateral/4.2/1e18  || "0.00").full}</span>
                        <span>{formatDai(principal/5/1e18 || "0.00").full}</span> */}
           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(storedCollateral/1000000 || "0.00").full}</span> */}
          </li>
            <li>
            <span>{isPool? "longZCB Estimated APR": "longZCB estimated Redemption price"}</span>
              {isPool?generateTooltip(
                        "The returns longZCB would incur when the instrument makes its estimated returns. Instrument Expected Return - promisedReturn ",
                        "lexpected"
                      ): generateTooltip(
                        "The redemption price of longZCB at maturity. Equals 1 if estimated return = prooposed return.   ",
                        "lexpected")}
             
            <span>{String(roundDown(managerExpectedYield, 3))}{isPool&&" %"}</span> 

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
            <span>Total Longs/Shorts</span>
              {generateTooltip(
                        "Total amount of collateral used to buy (longZCB - shortZCB), denominated in underlying  ",
                        "net"
                      )}
            <span>{roundDown(market_[Id]?.bondPool.longZCB.totalSupply,3)}/{roundDown(market_[Id]?.bondPool.shortZCB.totalSupply,2)}</span> 
            {/*<span>{formatDai(totalCollateral/4.2/1e18  || "0.00").full}</span>
                        <span>{formatDai(principal/5/1e18 || "0.00").full}</span> */}
           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(storedCollateral/1000000 || "0.00").full}</span> */}
          </li>

          <li>
            <span>Net Collateral/Required Collateral</span>
              {generateTooltip(
                        "Total amount of collateral used to buy (longZCB - shortZCB), denominated in underlying + Amount of net ZCB needed to buy to approve(supply to) this instrument, denominated in underlying  ",
                        "net"
                      )}
            <span>{totalCollateral}/{isPool?roundDown(poolData?.saleAmount, 3):roundDown(Number(principal)*Number(alpha),2) }</span> 
            {/*<span>{formatDai(totalCollateral/4.2/1e18  || "0.00").full}</span>
                        <span>{formatDai(principal/5/1e18 || "0.00").full}</span> */}
           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(storedCollateral/1000000 || "0.00").full}</span> */}
          </li>


          <li>
            <span>longZCB Start Price </span>
            <span>{roundDown(market_[Id]?.bondPool.b,3)}</span>

            {/*<span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD/10 || "0.00").full}</span> */}
          </li>


          <li>
            <span>longZCB Price Now</span>
            <span>{roundDown(longZCBPrice,3)}</span>
            {/*<span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD || "0.00").full}</span>*/}
          </li>

        </ul>
        {!isPool ? (<ul className={Styles.StatsRow}>
          <li>
            <span>Principal </span>
            {generateTooltip(
              "Total amount of underlying used by the instrument  ",
              "principal"
                      )}
            <span>{roundDown(principal ,3)}</span>

           {/* <span>{marketHasNoLiquidity ? "-" : formatDai(principal/1000000 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Expected Tot.Yield</span>
            {generateTooltip(
              "Amount of underlying the utilizer proposed the instrument would incur, when Principal was invested ",
              "yield"
                      )}
            <span>{roundDown(expectedYield , 3)}</span>
          {/* <span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD/10 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Duration(days) </span>
            <span>{roundDown(duration/86400,3)}</span>
          </li>

          <li>
            <span>Start Time</span>
              <span>{timeConverter(market_[Id]?.creationTimestamp)}</span>

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
            <span>{roundDown((((1+ poolData?.promisedReturn/1e18)**31536000) -1)*100, 2)}{"%"}</span>

          {/* <span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD/10 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Manager Sale Amount </span>
            <span>{poolData?.saleAmount}</span>
          </li>

          <li>
            <span>Start Date</span>
              <span>{timeConverter(market_[Id]?.creationTimestamp)}</span>

           {/* <span>{marketHasNoLiquidity ?"8/20/2022": formatLiquidity(amm?.liquidityUSD || "0.00").full}</span> */}
          </li>

        </ul>)
      }
      {isPool && isApproved&& (<h4>Pool Info</h4>) }
      {isPool && isApproved && 
        (

          <ul className={Styles.StatsRow}>
          <li>
            <span>--</span>
            <span>-</span>

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
            <span>--</span>
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
        
        <PositionsView marketId = {marketId} isApproved = {isApproved}/>

        <div
          className={classNames(Styles.Details, {
            [Styles.isClosed]: !showMoreDetails,
          })}
        >
          {/*<h4>Open Orders</h4>
          <h4>Price History</h4>
          <h4>Details</h4>*/}

          {/*details.map((detail, i) => (
            <p key={`${detail.substring(5, 25)}-${i}`}>{detail}</p>
          ))*/}
          {/*details.length > 1 && (
            <button onClick={() => setShowMoreDetails(!showMoreDetails)}>
              {showMoreDetails ? "Read Less" : "Read More"}
            </button>
          )*/}
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
        {account=="0x2C7Cb3cB22Ba9B322af60747017acb06deB10933" && <SecondaryThemeButton
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
