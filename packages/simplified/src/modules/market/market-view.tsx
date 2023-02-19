import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "react-router";

// @ts-ignore
import Styles from "./market-view.styles.less";

// @ts-ignore
import ButtonStyles from "../common/buttons.styles.less";
import classNames from "classnames";
import { ZCBPriceChartSection } from "../common/charts";
import { PositionsLiquidityViewSwitcher, TransactionsTable } from "../common/tables";
import { AddMetaMaskToken, handleValue } from "../common/labels";
import { PositionsView } from "../common/positions";
import { ManagerWarning } from "../liquidity/market-liquidity-view"
import { TradingForm } from "./trading-form";
import { useQuery } from "@apollo/client";
import { BigNumber as BN } from "bignumber.js";
import moment from "moment";
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
  useUserStore, useDataStore2, GRAPH_QUERIES, SelectionComps
} from "@augurproject/comps";
import type {
  MarketInfo, AmmOutcome, MarketOutcome, AmmExchange,
  InstrumentInfos, VaultInfos, CoreInstrumentData, PoolInstrument
} from "@augurproject/comps/build/types";
import { MARKETS_LIST_HEAD_TAGS } from "../seo-config";
import { useSimplifiedStore } from "../stores/simplified";
import makePath from "@augurproject/comps/build/utils/links/make-path";
import { MARKETS } from "modules/constants";
import { Link } from "react-router-dom";
import { Sidebar } from "../sidebar/sidebar";
import { ExternalLink, InstrumentLink } from "@augurproject/comps/build/utils/links/links";
import { BaseSlider, InstrumentStatusSlider } from "../common/slider";
import { Leverage } from "../common/slippage";
import { fetchAssetSymbol } from "@augurproject/comps/build/utils/contract-calls-new";
import { TabContent, TabNavItem } from "modules/common/tabs";
import { convertOnChainSharesToDisplayShareAmount } from "@augurproject/comps/build/utils/format-number";
import { CreditlineDetails, PoolCollateralCard, PoolDetails } from "modules/liquidity/liquidity-view";
import { getInstrumentType, getMarketStage, InstrumentType as IType, MarketStage } from "utils/helpers";

import { redeem, redeemPoolLongZCB, redeemShortZCB, redeemPerpShortZCB, redeemLeveredBond, redeemLeveredPerpLongZCB } from "@augurproject/comps/build/utils/contract-calls-new";
// const collateralLink =()=>{
//     return( 
//       <a href={getChainExplorerLink(chainId, link, "transaction")} target="_blank" rel="noopener noreferrer">
//         {LinkIcon}
//       </a>)

// }
export const InstrumentBreakDownFormat = ({ instrumentType, field = null }) => {
  if (instrumentType == 1) {

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
          value: Math.floor(field[4] / 60),
        },
      ],
    }]
  }
  else if (instrumentType == 2) {
    let infos = [];
    for (let i = 0; i < field?.length; i++) {
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
            value: field[i][1] == true ? "ERC20" : "ERC721",
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
            value: field[i][1] == true ? "-" : field[i][4],

          }
        ],
      }


    }
    return infos;
  } else if (instrumentType == 0) {
    return [{
      heading: "Additional Information",
      infoNumbers: [
        {
          label: "Borrower",
          value: field[0],
        },
        {
          label: "Collateral",
          value: field[1],
        },
        {
          label: "Rate paid by borrower",
          value: field[2],
        },
        {
          label: "Assessment Remaining Minutes",
          value: Math.floor(field[3] / 60),
        },
      ],
    }]
  }
  else return 0;
}
export const InstrumentOverviewFormat = ({ instrumenType }) => {
  if (instrumenType == 1) {
    return "Managers who think the price of the underlying asset would be below the proposed strike price by maturity should buy longZCB. When the option is not exercised, the proposed estimated return will be fully paid by the utilizer, and redemption price of longZCB will be 1. "
  } else if (instrumenType == 0) {
    return "As a manager, those who think the given collateral or credit conditions of the borrower is sound enough for the requested principal or interest rate should buy longZCB. Otherwise, vault holders can buy shortZCB to hedge.    "
  }
  else {
    return " Managers who think, with the collateral of this lending pool and the given pool parameters the lendingPool will stay solvent should buy longZCB. By doing so, they will automatically earn junior tranche of the yields generated by the lendingPool. "
  }
}

export const InstumentDescriptionFormat = ({ instrumenType, fields }) => {
  // const fields =["ETH", "1100", "1/20/2023", "1" ]

  if (instrumenType == 1) {
    const date = timeConverter(fields[5]);
    return "This covered call short instrument has a strike price of "
      + fields[0] + " and a maturity date at " + date + ". The redemption price of longZCB of this bet, if correct, is "
      + "1" + ". Given the payoff, If you want to bet on the price of ETH to be below "
      + fields[0] + " by " + date + " then buy longZCB."

  }
  else if (instrumenType == 2) {
    return "The conditional lendingPool has the following tokens as collateral."

  }
  else return null;
}
export const InstrumentField = ({ instrumentType, instrument }) => {
  let fields = []
  if (!instrument) return null;

  if (instrumentType == 2) {
    const collateralinfo = instrument?.collaterals;
    for (let i = 0; i < collateralinfo.length; i++) {
      fields[i] = [collateralinfo[i].address, collateralinfo[i].isERC20,
      collateralinfo[i].name, collateralinfo[i].maxAmount, collateralinfo[i].tokenId]
    }
    return fields;
  }
  else if (instrumentType == 1) {
    const curtime = Math.floor((new Date()).getTime() / 1000);
    const { strikePrice, shortCollateral, tradeTime, pricePerContract, maturityDate } = instrument;
    fields[0] = strikePrice;
    fields[1] = roundDown(shortCollateral * pricePerContract, 2);
    fields[2] = shortCollateral;
    fields[3] = pricePerContract;
    fields[4] = Number(tradeTime) > curtime ?
      String(Number(tradeTime) - curtime) : "Assessment Period Ended"
    fields[5] = Number(maturityDate);
    return fields;
  } else if (instrumentType == 0) {
    const curtime = Math.floor((new Date()).getTime() / 1000);
    const { collateral, utilizer, expectedYield, duration, principal } = instrument;
    fields[0] = utilizer;
    fields[1] = collateral;
    fields[2] = String(roundDown(100 * (365 / (Number(duration) / 86400)) * Number(expectedYield) / Number(principal), 2)) + "% APR"
    fields[3] = "-"
    return fields;
  }
  else {
    return null;
  }
}
export const InstrumentType = ({ instrumenType }) => {
  let types = [];
  if (instrumenType == 0) {
    return "Creditline";
  }
  else if (instrumenType == 1) {
    return "Covered Call";
  }
  else if (instrumenType == 2) {
    return "Conditional Lending Pool"
  }
  else {
    return "none";
  }
}

const FormAmountInput = ({ amount, updateAmount, prepend }) => {

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
  LabelComps: { generateTooltip, WarningBanner, RammCategoryLabel, CategoryLabel, ReportingStateLabel, NetworkMismatchBanner },
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
const { fetchTradeData, getHedgePrice, getInstrumentData_,
  // getTotalCollateral, 
  redeemZCB, getZCBBalances, approveUtilizer,
  canApproveUtilizer, getERCBalance, testVerifyToggle,  } = ContractCalls;
const { testApproveMarket } = ContractCalls2;

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




//   <span>
//   {/*winningOutcome.name*/}
//   {winningOutcome == 0 ?
//     type == 1 ? 'Assessment remaining time: ' + remainingTime + " minutes" : 'Assessment: ' : winningOutcome == 1 ? "Approval Condition Met" : "Approved"}
//   {winningOutcome == 2 && ConfirmedCheck}
// </span>

export const InstrumentStatusLabel: React.FC = ({ label, small=false }: {label: string, small: boolean}) => (
  <span className={classNames(Styles.WinningOutcomeLabel,{
    [Styles.Small]: small
  })}>
    <span>
      Instrument Status
    </span>
    <span>
      {label}
      {label === "Approved" && ConfirmedCheck}
    </span>
  </span>
)

const WinningOutcomeLabel = ({ winningOutcome, type, remainingTime }) => (
  <span className={Styles.WinningOutcomeLabel}>
    <span>Instrument Status</span>

    <span>
      {/*winningOutcome.name*/}

      {winningOutcome == 0 ?
        'Assessment ' : winningOutcome == 1 ? "Approval Condition Met" : "Approved"}
      {winningOutcome == 2 && ConfirmedCheck}
    </span>

  </span>
);
const estimatedReturnsPerp = (
  promised_return: number,
  leverageFactor: number,
  inceptionPrice: number,
  returns: number) => {//returns is in decimals, 0.1 is 10% apr 

  // (BASE_UNIT+ vars.leverageFactor).mulWadDown(previewMint(BASE_UNIT.mulWadDown(vars.inceptionPrice))) 
  //       -  vars.srpPlusOne.mulWadDown(vars.leverageFactor)
  //totalassets/totalshares * amount totalassets*10/totalshares * amount * 
  // inceptionPrice * 1+returns
  // vars.inceptionPrice.mulWadDown((BASE_UNIT+ vars.promised_return)
  // .rpow(block.timestamp - vars.inceptionTime, BASE_UNIT))    
  const srpPlusOne = inceptionPrice * ((1 + promised_return / 1e18) ** (31536000));
  const term1 = (1 + Number(leverageFactor));
  const term2 = (inceptionPrice * (1 + returns));
  // console.log('srpplusone', srpPlusOne,  (inceptionPrice* (1+ returns)),(1 + promised_return), (1 + leverageFactor) * (inceptionPrice* (1+ returns)), 
  //  (srpPlusOne* leverageFactor)); 
  // console.log('leverageFactor', term1, term2, term1 * term2, promised_return, returns, srpPlusOne, leverageFactor);
  return 100 * (term1 * term2 - (srpPlusOne * leverageFactor) - inceptionPrice) / inceptionPrice;
  //return ((1 + leverageFactor) * (inceptionPrice* (1+ returns)) - (srpPlusOne* leverageFactor) - inceptionPrice)/inceptionPrice; 
  // 1+lev * inception - 15* lev 
  // inception + levinception - inception*lev = inception 

}
const estimatedReturnsFixed = (
  totalSupply: number, principal: number,
  expectedYield: number, managerExpectedYield: number, alpha: number, price: number) => {

  let totalSupply_ = (principal * alpha) / price;
  const extra_gain = Number(managerExpectedYield) > Number(expectedYield) ? Number(managerExpectedYield) - Number(expectedYield) : 0;
  const loss = Number(managerExpectedYield) > Number(expectedYield) ? 0 : Number(expectedYield) + Number(principal) -
    (Number(principal) + Number(managerExpectedYield));
  console.log('extragain/loss', totalSupply, principal, expectedYield, managerExpectedYield, extra_gain, loss);

  let redemption_price;
  if (extra_gain > 0) redemption_price = 1 + extra_gain / totalSupply_
  else {
    if (1 <= loss / totalSupply_) return 0;
    else redemption_price = 1 - loss / totalSupply_;
  }


  return redemption_price;
}
const estimateReturnsCoveredCall = (
  strikePrice: number,
  managerStrikePrice: number,
  totalSupply: number, principal: number, expectedYield: number, alpha: number, price: number
) => {
  // if price below strike price, expected yield is proposed yield 

  const managerExpectedYield = managerStrikePrice <= strikePrice ? expectedYield
    : Number(expectedYield) + (principal * strikePrice) / managerStrikePrice - principal

  return estimatedReturnsFixed(totalSupply, principal, expectedYield, managerExpectedYield,
    alpha, price);

  // 500 ETH as collateral 500*1600 = 800000. 800000/1660 = 490 500-490 = yield. 
  //1660-1600 1660/
}

function roundDown(number, decimals) {
  decimals = decimals || 0;
  return (Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals));
}

export const useMarketQueryId = () => {
  const location = useLocation();
  const { [MARKET_ID_PARAM_NAME]: marketId } = parseQuery(location.search);
  return marketId;
};

export const EmptyMarketView = () => {
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

export const NonexistingMarketView = ({ text, showLink = false }) => {
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

function timeConverter(UNIX_timestamp) {
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
const getAddress = async ({
  account, loginAccount, marketId
}) => {
  return "";
}

const MarketView = ({ defaultMarket = null }) => {
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [marketNotFound, setMarketNotFound] = useState(false);

  const marketId = useMarketQueryId();

  const { actions: { setModal }, isMobile } = useAppStatusStore();
  
  const {
    settings: { timeFormat },
    showTradingForm,
    actions: { setShowTradingForm },
  } = useSimplifiedStore();

  const { cashes, markets, ammExchanges, blocknumber, transactions } = useDataStore();
  useScrollToTopOnMount();
  //let market: MarketInfo//!!defaultMarket ? defaultMarket : markets[marketId];
  const market = {} as MarketInfo;
  const amm: AmmExchange = ammExchanges[marketId];
  // const hasInvalid = Boolean(amm?.ammOutcomes.find((o) => o.isInvalid));
  // const selectedOutcome = market ? (hasInvalid ? market.outcomes[1] : market.outcomes[0]) : DefaultMarketOutcomes[1];
  const selectedOutcome = DefaultMarketOutcomes[1];

  const { loading, error, data } = useQuery(GRAPH_QUERIES.GET_MARKET_PRICES, {
    variables: {
      marketId: marketId
    }
  })

  const {
    account,
    loginAccount,
    balances,
    actions: { addTransaction },
    ramm: { reputationScore, vaultBalances, zcbBalances }
  } = useUserStore();
  const isManager = reputationScore > 0;
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

  const { vaults: vaults, instruments: instruments, markets: market_, prices } = useDataStore2()

  const isPool = instruments[Id]?.isPool ? true : false;
  const poolData = instruments[Id]
  const duration = instruments[Id]?.duration
  const expectedYield = instruments[Id]?.expectedYield
  const principal = instruments[Id]?.principal

  const approvedPrincipal = market_[Id]?.approvedPrincipal;
  const approvedYield = market_[Id]?.approvedYield;

  const trusted = instruments[Id]?.trusted ? 0 : 1;
  const totalCollateral = market_[Id]?.totalCollateral;
  const alpha = market_[Id]?.parameters.alpha;
  const longZCBPrice = market_[Id]?.bondPool.longZCBPrice;
  const isApproved = (!market_[Id]?.duringAssessment && market_[Id]?.alive);
  const canbeApproved = market_[Id]?.marketConditionMet
  const outcomeLabel = isApproved ? 2 : (canbeApproved && !isApproved) ? 1 : 0;
  const longZCBSupply = market_[Id]?.bondPool.longZCB.balance;
  const shortZCBSupply = market_[Id]?.bondPool.shortZCB.balance;
  const instrumentBalance = instruments[Id]?.balance;
  const vaultId = instruments[Id]?.vaultId
  const asset = vaults[vaultId]?.want.name;
  const strikePrice = instruments[Id]?.strikePrice;
  const type = Number(instruments[Id]?.instrumentType);

  const longZCB_ad = market_[marketId]?.longZCB
  const shortZCB_ad = market_[marketId]?.shortZCB;


  const instrumentField = InstrumentField({ instrumentType: type, instrument: instruments[Id] });

  const instrumentOverview = InstrumentOverviewFormat({ instrumenType: type })
  const instrumentDescription = InstumentDescriptionFormat({ instrumenType: type, fields: instrumentField });
  const instrumentBreakDown = InstrumentBreakDownFormat({ instrumentType: type, field: instrumentField });
  const instrumentTypeWord = InstrumentType({ instrumenType: type });

  const remainingTime = (type == 1) ? roundDown(instrumentField[4] / 60, 0) : 1000

  // if (marketNotFound) return <NonexistingMarketView text="Market does not exist." />;


  //const details = "No details"; //getResolutionRules(market)

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

  // const managerExpectedYield =  isPool? estimatedReturnsPerp(instruments[marketId]?.promisedReturn, 
  //   poolData?.poolLeverageFactor,instruments[marketId]?.inceptionPrice, estimatedYield/100) 
  // : estimatedReturnsFixed(longZCBSupply, principal, expectedYield, estimatedYield, Number(alpha), Number(longZCBPrice)); 
  let managerExpectedYield = 0;
  if (type == 1) {
    console.log("input", strikePrice, estimatedYield, longZCBSupply, principal, expectedYield, Number(alpha), Number(longZCBPrice))
    managerExpectedYield = estimateReturnsCoveredCall(
      Number(strikePrice), estimatedYield, longZCBSupply, principal, expectedYield, Number(alpha), Number(longZCBPrice));
  } else if (type == 2) {
    managerExpectedYield = estimatedReturnsPerp(instruments[marketId]?.promisedReturn,
      poolData?.poolLeverageFactor, instruments[marketId]?.inceptionPrice, estimatedYield / 100)
  }

  const testVerifyToggle_ = () => {
    testVerifyToggle(account, loginAccount.library).then((response) => {
      console.log('tradingresponse', response)
    }).catch((error) => {
      console.log('Trading Error', error)
    });

  }
  // const redeem = () => {
  //   redeemZCB(account, loginAccount.library, String(market.amm.turboId)).then((response) => {
  //     console.log('tradingresponse', response)
  //   }).catch((error) => {
  //     console.log('Trading Error', error)
  //   });
  // }

  // const approve_utilizer = () => {
  //   approveUtilizer(account, loginAccount.library, String(market.amm.turboId)).then((response) => {
  //     console.log('tradingresponse', response)
  //   }).catch((error) => {
  //     console.log('Trading Error', error)
  //   });
  // }
  const testapprovemarket = () => {
    testApproveMarket(account, loginAccount.library, marketId).then((response) => {
      console.log("testApproved")
    })
  }
  const utilizer_description = "Assess riskiness of lending to fuse isolated pool #3. Some of the collaterals in this pool are not liquid and may incur bad debt. ";
  const description1 = "This is a Zero Coupon Bond (ZCB) market for  " + "fuse pool #3, with a linear bonding curve AMM." +
    " Managers who buy these ZCB will hold a junior tranche position and outperform passive vault investors. "



  const instrument = useMemo(() => instruments[marketId], [marketId, instruments]);
  const vault = useMemo(() => vaults[instrument?.vaultId], [instrument, vaults]);
  const rammMarket = useMemo(() => market_[marketId], [marketId, market_]);


  if (!rammMarket || Object.entries(market_[marketId]).length == 0 ) return <EmptyMarketView />;
  const marketStage = getMarketStage(rammMarket);
  const instrType = getInstrumentType(instrument);

  const canBuy = (instrType === IType.FIXED && marketStage === MarketStage.ASSESSMENT) || (instrType === IType.PERPETUAL);

  return (
    <div className={classNames(Styles.MarketView, {
      [Styles.PoolInstrument]: false,//instrType == IType.PERPETUAL,
      [Styles.CreditlineInstrument]: instrType == IType.FIXED
    })}>
      <SEO {...MARKETS_LIST_HEAD_TAGS} title={instruments[Id]?.name[0]} ogTitle={instruments[Id]?.name[0]} twitterTitle={instruments[Id]?.name[0]} />
      <section>
        <NetworkMismatchBanner />
        {!(reputationScore && isManager) && <ManagerWarning />}

        {isMobile && <ReportingStateLabel {...{ reportingState, big: true }} />}
        <div className={Styles.topRow}>
          <RammCategoryLabel big text={instrumentTypeWord} />
          <div>
            {!!instruments[Id]?.name && <h1>{instruments[Id]?.name}</h1>}
            {isPool && <InstrumentLink id={instruments[Id]?.marketId} path={"pool"} label={"To Pool"} paramName={"id"} />}
          </div>
        </div>


        { /*<p>{"Buy longZCB of this instrument if you think it will be profitable, shortZCB otherwise"}</p>*/}

        {/* <span>Instrument Type: {instrumentTypeWord}</span> */}
        {/* <h3>Profit Mechanism</h3>
        <p>{isPool ?
          "Buying longZCB will automatically supply capital to the instrument from its parent vault. Profit for longZCB is compounded every second. Participants can redeem their longZCB to realize profit. "
          : "Buy longZCB if you believe the borrower will repay by maturity or collateral can be liquidated in the event of default. longZCB can be redeemed after instrument's maturity. Redemption price is 1 if successful, but can go down to 0."}</p>

        {startTimestamp ? <span>{getMarketEndtimeFull(startTimestamp, timeFormat)}</span> : <span />}
        isFinalized && winningOutcome && <WinningOutcomeLabel winningOutcome={winningOutcome} />
        <div>
          <h4>Overview</h4>

          <p> {/*instruments[Id]?.description
            {instrumentOverview}</p>
          <SecondaryThemeButton
            text="More Info"
            action={() =>
              setModal({

                type: "MODAL_CONFIRM_TRANSACTION",
                title: "Instrument Information",
                includeButton: false,

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

                name: "Details",
                breakdowns: instrumentBreakDown
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
        </div> */}
        {type === 0 ? (
          <section>
            <CreditlineDetails vault={vault} market={rammMarket} instrument={instrument} />
            {/* <CreditlineRequestInfo instrument={instruments[Id]} vault={vaults[vaultId]} />
            <CreditlineLoanInfo instrument={instruments[Id]} vault={vaults[vaultId]} /> */}

          </section>
        ) : ((type === 2 && Object.entries(instruments).length > 0) ? <section>
          <PoolDetails market={rammMarket} instrument={instrument as PoolInstrument} vault={vault} />
        </section> : <section></section>)}


        {(type === 0 && Object.entries(market_).length > 0) && (
          <CreditlineSimulation market={market_[Id]} instrument={instruments[Id]} vault={vaults[vaultId]} />
        )}
        {type === 2 && (
          <PoolSimulation market={market_[Id]} instrument={instruments[Id]} vault={vaults[vaultId]} />
        )}
        <div>
          <h3>
            Zero Coupon Bond Info
          </h3>
          <div className={Styles.StatsTable}>
            <ul className={Styles.StatsRow}>

              <li>
                <span>Total Longs/Shorts</span>
                {generateTooltip(
                  "Total amount of collateral used to buy (longZCB - shortZCB), denominated in underlying  ",
                  "net"
                )}
                <span>{roundDown(market_[Id]?.bondPool.longZCB.balance, 3)}/{roundDown(market_[Id]?.bondPool.shortZCB.balance, 2)}</span>
              </li>

              <li>
                <span>longZCB Start Price </span>
                <span>{handleValue(roundDown(market_[Id]?.bondPool.b, 3), asset)}</span>
              </li>


              <li>
                <span>longZCB Price Now</span>
                <span>{handleValue(roundDown(longZCBPrice, 3), asset)}</span>
              </li>

            </ul>
            {!isPool ? (<ul className={Styles.StatsRow}>
              <li>
                <span>Net/Required Collateral</span>
                {generateTooltip(
                  "Total amount of collateral used to buy (longZCB - shortZCB), denominated in underlying + Amount of net ZCB needed to buy to approve(supply to) this instrument, denominated in underlying  ",
                  "net"
                )}
                <span>{handleValue(totalCollateral, asset, { decimals: 4 })}/{isPool ? handleValue(roundDown(poolData?.saleAmount, 3), asset) : handleValue(roundDown(Number(principal) * Number(alpha), 2), asset)}</span>
              </li>

              <li>
                <span>Principal </span>
                {generateTooltip(
                  "Total amount of underlying used by the instrument  ",
                  "principal"
                )}
                <span>{handleValue(roundDown(principal, 3), asset)}</span>
              </li>
              <li>
                <span>Expected Tot.Yield</span>
                {generateTooltip(
                  "Amount of underlying the utilizer proposed the instrument would incur, when Principal was invested ",
                  "yield"
                )}
                <span>{handleValue(roundDown(expectedYield, 3), asset)}</span>
              </li>

            </ul>)
              :
              (<ul className={Styles.StatsRow}>
                <li>
                  <span>Leverage Factor </span>
                  <span>{poolData?.poolLeverageFactor}</span>
                </li>
                <li>
                  <span>Senior Promised Return</span>
                  <span>{roundDown((((1 + poolData?.promisedReturn / 1e18) ** 31536000) - 1) * 100, 2)}{"%"}</span>
                </li>
                <li>
                  <span>Manager Sale Amount </span>
                  <span>{poolData?.saleAmount}</span>
                </li>
              </ul>)
            }
          </div>
        </div>


        {isPool && isApproved && (<h4>Pool Info</h4>)}
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


        {account && <RammPositionsSection market={market_[marketId]} assetName={asset} manager={account} instrument={instrument} vault={vault} />}

        {/* 
        <div
          className={classNames(Styles.Details, {
            [Styles.isClosed]: !showMoreDetails,
          })}
        >
        </div> */}
        {!loading && data.market && instrumentTypeWord !== "Creditline" && Object.entries(market_).length > 0 && (
          <div>
            <h4>
              Price History
            </h4>
            <ZCBPriceChartSection marketId={marketId} snapshots={data.market.snapshots} />
          </div>
        )
        }

        {/* <PositionsView marketId={marketId} isApproved={isApproved} /> */}

        {/* <div
          className={classNames(Styles.Details, {
            [Styles.isClosed]: !showMoreDetails,
          })}
        >
          {details.length === 0 && <p>{description1}</p>}

        </div> */}


        <div className={Styles.TransactionsTable}>
          <span>Activity</span>
          {/*<TransactionsTable transactions={marketTransactions} />*/}
          {account == "0x2C7Cb3cB22Ba9B322af60747017acb06deB10933" && <SecondaryThemeButton
            text="Approve Instrument"
            action={() => testapprovemarket()
              //() => setShowTradingForm(true)
            }
            customClass={ButtonStyles.BuySellButton}
          />}
          {account == "0x2C7Cb3cB22Ba9B322af60747017acb06deB10933" && <SecondaryThemeButton
            text="Verify Toggle"
            action={testVerifyToggle_
              //() => setShowTradingForm(true)
            }
            customClass={ButtonStyles.BuySellButton}
          />}
        </div>
        <SecondaryThemeButton
          text="Buy / Sell"
          action={() => setShowTradingForm(true)}
          customClass={ButtonStyles.BuySellButton}
        />
      </section>
      {(canBuy) && <section
        className={classNames({
          [Styles.ShowTradingForm]: showTradingForm,
        })}
      >
        {isFinalized && trusted == 0 && <SecondaryThemeButton
          text="Redeem All ZCB"
          action={redeem}
          customClass={ButtonStyles.BuySellButton}
        />}

        <TradingForm 
          marketId={marketId}
          isApproved={isApproved} 
          market={rammMarket} 
          instrument={instrument} 
          vault={vault}
          />
      </section>}
    </div>
  );
};

export default MarketView;


const CreditlineRequestInfo = ({
  instrument,
  vault
}) => {
  const { account, loginAccount } = useUserStore();
  const { collateral, duration, collateralType, oracle, principal, expectedYield, collateralBalance } = instrument;

  const [collateralSymbol, setCollateralSymbol] = useState("");
  const collateralTypeMapping = {
    0: "ERC20",
    1: "ERC721",
    2: "ownership",
    3: "none"
  }

  useEffect(() => {
    const fetchSymbol = async () => {
      return await fetchAssetSymbol(account, loginAccount.library, collateral)
    }
    if (collateral && Number(collateralType) === 0) {
      console.log("fetching...")
      fetchSymbol().then(
        (symbol) => {
          setCollateralSymbol(symbol)
        }
      )
    }

  }, [account, loginAccount, instrument])

  console.log("collateralSymbol: ", collateralSymbol)

  // <ExternalLink URL={"https://mumbai.polygonscan.com/address/" + item.address} label={label}>
  //               </ExternalLink>
  //const tenor = new BN(Number(duration) / 86400).toFixed(2); // days
  const tenor = moment().add(Number(duration), "seconds").fromNow(true);
  return (
    <section className={Styles.CreditlineTable}>
      <h3>
        Request Details
      </h3>
      <div>
        <span>Duration</span>
        <span>{tenor}</span>
      </div>
      <div>
        <span>Collateral Type</span>
        <span>{collateralTypeMapping[Number(collateralType)]}</span>
      </div>
      {(Number(collateralType) === 0 || Number(collateralType) === 1) &&
        <div>
          <span>Collateral</span>
          <span>
            <ExternalLink URL={"https://mumbai.polygonscan.com/address/" + collateral} label={"mumbai scan"} icon={true}>
            </ExternalLink>
          </span>
        </div>
      }
      {(Number(collateralType) === 0 || Number(collateralType) === 1) &&
        <div>
          <span>Collateral Required</span>
          <span>{handleValue(collateralBalance, "") + " " + collateralSymbol}</span>
        </div>
      }
      {(Number(collateralType) === 0 || Number(collateralType) === 1) &&
        <div>
          <span>Oracle</span>
          <span> <ExternalLink URL={"https://mumbai.polygonscan.com/address/" + collateral} label={"Chainlink"} icon={true}>
          </ExternalLink>
          </span>
        </div>
      }
      <div>
        <span>Requested Amount</span>
        <span>{handleValue(principal, vault.want.symbol)}</span>
      </div>
      <div>
        <span>Expected Yield</span>
        <span>{handleValue(expectedYield, vault.want.symbol)}</span>
      </div>
      {/* <div>
          <span>Amount Repaid</span>
          <span>{handleValue(amountRepaid, vault.want.symbol)}</span>
        </div> */}
    </section>
  )
}

const CreditlineLoanInfo = ({
  instrument,
  vault
}) => {
  const { collateral, duration, collateralType, oracle, principal, expectedYield, maturityDate, principalRepayed, interestRepayed } = instrument;
  console.log("collateral: ", collateral);
  const collateralTypeMapping = {
    0: "liquidatable",
    1: "nonLiquid",
    2: "ownership",
    3: "none"
  }

  // <ExternalLink URL={"https://mumbai.polygonscan.com/address/" + item.address} label={label}>
  //               </ExternalLink>
  const expiry = moment().add(duration, "seconds").fromNow(true);
  return (
    <section className={Styles.CreditlineLoanTable}>
      <h3>
        Loan Details
      </h3>
      <div>
        <span>Expiration</span>
        <span>{expiry} from now</span>
      </div>
      <div>
        <span>Expected Repayment</span>
        <span>{handleValue(String(Number(expectedYield) + Number(principal)), vault.want.symbol)}</span>
      </div>
      <div>
        <span>Amount Repaid</span>
        <span>{String(Number(principalRepayed) + Number(interestRepayed))}</span>
      </div>
    </section>
  )
}

const CreditlineSimulation = ({
  market,
  instrument,
  vault
}) => {
  const isApproved = (!market?.duringAssessment && market?.alive);
  const { approvedPrincipal, approvedYield, bondPool: { longZCB: { balance: longZCBSupply }, longZCBPrice } } = market;
  const { principal, expectedYield } = instrument;
  const faceValue = isApproved ? new BN(Number(approvedPrincipal) + Number(approvedYield)).toFixed(4) : new BN(Number(principal) + Number(expectedYield)).toFixed(4)
  const [simAmountRepaid, setSimAmountRepaid] = useState(0);
  const [leverageFactor, setLeverageFactor] = useState(1);

  const newRedemptionPrice = useMemo(() => {
    let loss = Number(faceValue) - Number(simAmountRepaid);
    return new BN(Math.max(1 - loss / Number(longZCBSupply), 0)).toFixed(4);
  }, [simAmountRepaid, longZCBSupply, faceValue])

  // const [ sliderMoved, setSliderMoved ] = useState(false);

  return (
    <section className={Styles.CreditlineSimulation}>
      <h3>
        Simulate Returns
      </h3>
      <div>
        <span>
          Amount Repaid
        </span>
        <span>{<input type="number" value={Number(simAmountRepaid)} onChange={(e) => {
          setSimAmountRepaid(Number(e.target.value) > 0 ? Number(e.target.value) : 0);
        }} />}  /{handleValue(faceValue, vault.want.symbol)}</span>
        <BaseSlider
          max={Number(faceValue)}
          min={Number(0)}
          value={simAmountRepaid}
          step={0.0001}
          onChange={(value) => {
            if ((Number(newRedemptionPrice) - Number(longZCBPrice)) / Number(longZCBPrice) * 100 * leverageFactor < -100) {
              return setLeverageFactor(1);
            }
            // setSliderMoved(true);
            setSimAmountRepaid(value)
          }}
        />
      </div>
      <div>
        <span>Current LongZCB Price</span>
        <span>{handleValue(longZCBPrice, vault.want.symbol)}</span>
      </div>
      <div>
        <span>Calculated LongZCB Redemption Price {generateTooltip("longZCB supply must not be zero", "redemptionPrice")}</span>
        <span>{Number(longZCBSupply) == 0 ? "-" : handleValue(newRedemptionPrice, vault.want.symbol)}</span>
      </div>
      <div>
        <span>LongZCB P/L % {generateTooltip("longZCB supply must not be zero", "redemptionPrice")}</span>
        <span>{Number(longZCBSupply) == 0 ? "-" : new BN((Number(newRedemptionPrice) - Number(longZCBPrice)) / Number(longZCBPrice) * 100).toFixed(3) + "%"}</span>
      </div>
      <div>
        <span>LongZCB P/L % with {leverageFactor}x Multiplier </span>
        <span>{Number(longZCBSupply) == 0 ? "-" : new BN((Number(newRedemptionPrice) - Number(longZCBPrice)) / Number(longZCBPrice) * 100 * leverageFactor).toFixed(3) + "%"}</span>
        <BaseSlider
          max={10}
          min={1}
          marks={[]}
          step={0.1}
          value={leverageFactor}
          onChange={(value) => {
            if ((Number(newRedemptionPrice) - Number(longZCBPrice)) / Number(longZCBPrice) * 100 * leverageFactor <= -100) {
              return setLeverageFactor(1);
            }
            setLeverageFactor(value)
          }}
        />
      </div>
    </section>
  )
}


const PoolSimulation = ({
  market,
  instrument,
  vault
}) => {
  const isApproved = (!market?.duringAssessment && market?.alive);
  let { borrowAPR, psu, pju, totalSuppliedAssets, utilizationRate: _utilizationRate, poolLeverageFactor, exchangeRate, inceptionPrice } = instrument;
  let { bondPool: { longZCB: { balance: longZCBSupply }, longZCBPrice } } = market
  const [leverageFactor, setLeverageFactor] = useState(1);
  // borrowAPR = 0.06;

  longZCBSupply = 10;
  totalSuppliedAssets = 10;

  const [utilizationRate, setUtilizationRate] = useState(Number(_utilizationRate) * 100);
  const longZCBRates = useMemo(
    () => {
      if (Number(totalSuppliedAssets) === 0 || Number(longZCBSupply) === 0) return {
        apr: new BN(0).toFixed(2),
        max: new BN(100).toFixed(2)
      };
      let poolAPR = Number(utilizationRate) * Number(borrowAPR) / 100;
      let seniorSupply = Number(poolLeverageFactor) * Number(longZCBSupply);
      let scaledAssets = (seniorSupply + Number(longZCBSupply)) * Number(exchangeRate) * Number(inceptionPrice);
      let delta = (scaledAssets * (1 + poolAPR) - Number(seniorSupply) * Number(psu)) / Number(longZCBSupply) - Number(pju);
      let maxDelta = (scaledAssets * (1 + borrowAPR) - Number(seniorSupply) * Number(psu)) / Number(longZCBSupply) - Number(pju)
      if (delta < 0) delta = 0;
      return {
        apr: new BN(delta / Number(pju) * 100).toFixed(2),
        max: new BN(maxDelta / Number(pju) * 100).toNumber()
      }
    }
    , [utilizationRate, borrowAPR, psu, longZCBSupply, totalSuppliedAssets, poolLeverageFactor, exchangeRate, inceptionPrice])
  // const [ sliderMoved, setSliderMoved ] = useState(false);

  return (
    <section className={Styles.PoolSimulation}>
      <h3>
        Simulate Returns
      </h3>
      <div>
        <span>
          Utilization Rate
        </span>
        <span>{<input type="number" value={Number(utilizationRate)} onChange={(e) => {
          setUtilizationRate(Number(e.target.value) > 0 ? Number(e.target.value) : 0);
        }} />}  /100%</span>
        <BaseSlider
          max={Number(100)}
          min={Number(0)}
          value={utilizationRate}
          step={0.0001}
          onChange={(value) => setUtilizationRate(value)}
        />
      </div>
      <div>
        <span>Current LongZCB Price</span>
        <span>{longZCBPrice}</span>
      </div>
      <div>
        <span>LongZCB P/L % {generateTooltip("longZCB supply must not be zero", "redemptionPrice")}</span>
        <span>{Number(longZCBSupply) == 0 ? "-" : longZCBRates.apr + "%"}</span>
      </div>
      <div>
        <span>LongZCB P/L % with {leverageFactor}x Multiplier </span>
        <span>{Number(longZCBSupply) == 0 ? "-" : new BN(Number(longZCBRates.apr) * leverageFactor).toFixed(3) + "%"}</span>
        <BaseSlider
          max={10}
          min={1}
          step={0.1}
          value={leverageFactor}
          onChange={(value) => {
            if (Number(longZCBRates.apr) * leverageFactor < -100) return
            setLeverageFactor(value)
          }}
        />
      </div>
    </section>
  )
}

export const RammPositionsSection = ({
  market,
  manager,
  instrument,
  assetName,
  vault
}) => {
  //   type( longzcb or shortzcb or levered longzcb), 
  // qty, value, entry price, cur price, debt, postion margin, unrealized P&L, realized P&L, redeem. 
  const [activeTab, setActiveTab] = useState("0");

  const marketId = market?.marketId;

  const { loading, error, data } = useQuery(GRAPH_QUERIES.GET_MANAGER_MARKET_PAIR, {
    variables: {
      id: marketId + "-" + manager.toLowerCase()
    }
  })

  const mm_pair = data?.managerMarketPair;

  return (
    <section className={Styles.RammPositionSection}>
      <div>
        <TabNavItem title="LongZCB" id="0" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabNavItem title="ShortZCB" id="1" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabNavItem title="Leveraged LongZCB" id="2" activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div>
        <RammPositionTable market={market} activeTab={activeTab} assetName={assetName} mm_pair={mm_pair} instrument={instrument} manager={manager} vault={vault} />
      </div>
    </section>
  )
}

const RammPositionTable = ({ market, activeTab, assetName, mm_pair, instrument, vault, manager }) => {
  const { ramm } = useUserStore();
  const { duringAssessment, alive, bondPool: { longZCBPrice, b, longZCB: { balance: longZCBbalance }, shortZCB: { balance: shortZCBbalance } } } = market;

  const { loginAccount } = useUserStore();

  let data_row = []; // values.

  const { actions: { setModal } } = useAppStatusStore();

  // const { longZCBCollateral, shortZCBCollateral } = mm_pair;
  let longZCBCollateral;
  let shortZCBCollateral;
  if (mm_pair) {
    longZCBCollateral = mm_pair.longZCBCollateral;
    shortZCBCollateral = mm_pair.shortZCBCollateral;
  }
  const leveragePositions = ramm?.leveragePositions;
  const { marketId } = market;

  const initPrice = instrument?.initPrice;

  const debt = leveragePositions && leveragePositions[marketId] ? leveragePositions[marketId].debt : 0;
  const amount = leveragePositions && leveragePositions[marketId] ? leveragePositions[marketId].amount : 0;

  const instrType = getInstrumentType(instrument);
  const marketStage = getMarketStage(market);

  let longEntryPrice = Number(longZCBbalance) > 0 ? new BN(Number(longZCBCollateral)).dividedBy(Number(longZCBbalance)) : 0;
  let shortEntryPrice = Number(shortZCBbalance) > 0 ? new BN(Number(shortZCBCollateral)).dividedBy(Number(shortZCBbalance)) : 0;
  // unrealized = handleValue(new BN(Number(longZCBPrice)).minus(longEntryPrice).multipliedBy(longZCBbalance).toFixed(3), assetName),
  let redeemButtonClick: () => void;
  let modalAction: (string) => void;
  let maxValue;
  let initialAmount = "";
  let inputDisabled = false;
  let label;
  let subLabel = "Successful resolution"
  if (activeTab === "0") {
    // longZCB

    data_row = [
      longZCBbalance,
      handleValue(new BN(Number(longZCBbalance) * Number(longZCBPrice)).toFixed(3), assetName),
      handleValue(longEntryPrice, assetName),
      handleValue(new BN(Number(longZCBPrice)).toFixed(3), assetName),
    ]
    
    instrType === IType.PERPETUAL && data_row.push(
      handleValue(new BN((Number(longZCBPrice) - Number(longEntryPrice)) * Number(longZCBbalance)).toFixed(4),assetName) // unrealized gains.
    )


    if (instrType === IType.FIXED) {
      modalAction = async () => {
        await redeem(manager, loginAccount.library, marketId);
      }
      initialAmount = longZCBbalance;
      inputDisabled = true;
      label = "Fixed Instrument"

    } else {
      modalAction = async (amount) => {
        await redeemPoolLongZCB(manager, loginAccount.library, marketId, amount);
      }
      maxValue = longZCBbalance;
      label = "Perpetual Instrument"
    }

    redeemButtonClick = () => {
      setModal(
        {
          type: "MODAL_REDEEM",
          title: "Redeem LongZCB",
          transactionAction: modalAction,
          transactionButtonText: "Redeem",
          maxValue,
          currencySymbol: "longZCB",
          initialAmount,
          breakdowns: [],
          inputDisabled,
          targetDescription: {
            label,
            subLabel
          },
        });
    }

  } else if (activeTab === "1") {
    data_row = [
      shortZCBbalance,
      handleValue(new BN(Number(shortZCBCollateral) * (1 - Number(longZCBPrice))).toFixed(3), assetName),
      handleValue(shortEntryPrice.toFixed(3), assetName),
      handleValue(new BN(1 - Number(longZCBPrice)).toFixed(3), assetName),
      // handleValue(new BN(1 - Number(longZCBPrice)).minus(shortEntryPrice).multipliedBy(shortZCBCollateral).toFixed(3), assetName)
    ]

    instrType === IType.PERPETUAL && data_row.push(
      handleValue(new BN((Number(1 - Number(longZCBPrice)) - Number(shortEntryPrice)) * Number(shortZCBbalance)).toFixed(4), assetName) // unrealized gains.
    )

    if (instrType === IType.FIXED) {
      modalAction = async () => {
        await redeemShortZCB(manager, loginAccount.library, marketId);
      }
      initialAmount = shortZCBbalance;
      inputDisabled = true;
      label = "Fixed Instrument"
    } else {
      modalAction = async (amount) => {
        await redeemPerpShortZCB(manager, loginAccount.library, marketId, amount);
      }
      maxValue = shortZCBbalance;
      label = "Perpetual Instrument"
    }

    redeemButtonClick = () => {
      setModal(
        {
          type: "MODAL_REDEEM",
          title: "Redeem shortZCB",
          transactionAction: modalAction,
          transactionButtonText: "Redeem",
          maxValue,
          currencySymbol: "shortZCB",
          initialAmount,
          breakdowns: [],
          inputDisabled,
          targetDescription: {
            label,
            subLabel
          },
        });
    }

  } else if (activeTab === "2") {
    // leveraged long tab
    data_row = [
      amount,
      handleValue(new BN(Number(amount) * Number(longZCBPrice)).toFixed(3), assetName),
      handleValue(debt, assetName),//handleValue(longEntryPrice, assetName),
      handleValue(Number(amount) > 0 ? String(Number(debt) / Number(amount)) : "0", assetName),
      handleValue(new BN(Number(longZCBPrice)).toFixed(3), assetName),
    ]

    let longLeveredEntryPrice = Number(amount) > 0 ? (Number(debt) / Number(amount)) : 0
    instrType === IType.PERPETUAL && data_row.push(
      handleValue(new BN((Number(longZCBPrice) - Number(longLeveredEntryPrice)) * Number(amount)).toFixed(4), assetName) // unrealized gains.
    )

    if (instrType === IType.FIXED) {
      modalAction = async () => {
        await redeemLeveredBond(manager, loginAccount.library, marketId);
      }
      initialAmount = amount;
      inputDisabled = true;
      label = "Fixed Instrument"
    } else {
      modalAction = async (amount) => {
        await redeemLeveredPerpLongZCB(manager, loginAccount.library, marketId, amount);
      }
      maxValue = amount;
      label = "Perpetual Instrument"
    }

    redeemButtonClick = () => {
      setModal(
        {
          type: "MODAL_REDEEM",
          title: "Redeem levered longZCB",
          transactionAction: modalAction,
          transactionButtonText: "Redeem",
          targetDescription: {
            label,
            subLabel
          },
          maxValue,
          currencySymbol: "longZCB",
          initialAmount,
          breakdowns: [],
          inputDisabled
        });
    }
  }


  /**
   *  if fixed -> for long and short -> qty, value, entry price, cur price , redeem
   *           -> for levered long -> qty, value, entry price, cur price, debt, postion margin, redeem.
   *  if perp -> for long -> qty, value, entry price, cur price, unrealized P&L, redeem.
   *          -> for short -> qty, value, entry price, cur price, redeem.
   * 
   * 
   * redeeming -> if fixed then no modal needed, just a confirmation modal.
   *           -> if perp then a modal with the option to redeem all or partial.
   * 
   *
   */
  let canRedeem = (instrType === IType.PERPETUAL && marketStage === MarketStage.APPROVED ) ||
  (instrType === IType.FIXED && marketStage === MarketStage.RESOLVED)

  return (
    <table className={Styles.RammPositionTable}>
      <thead>
        <tr>
          <th>
            Qty
          </th>
          <th>
            Value
          </th>
          {activeTab === "2" && (
            <>
              <th>
                Debt
              </th>
            </>
          )}
          <th>
            Entry Price
          </th>
          <th>
            Current Price
          </th>
          {instrType === IType.PERPETUAL && <th>
            Unrealized P&L
          </th>}
          <th>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          {data_row.map((val, i) => {
            return (
              <td>
                <div>
                  {val}
                </div>
              </td>
            )
          })}
          <td>
            {canRedeem && <button onClick={redeemButtonClick}>Redeem</button>}
          </td>
        </tr>
      </tbody>
    </table>
  )
}