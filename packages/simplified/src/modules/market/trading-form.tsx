import React, { ReactNode, useEffect, useMemo, useState, useCallback } from "react";
import Styles from "../market/trading-form.styles.less";
import ButtonStyles from "../common/buttons.styles.less";
import classNames from "classnames";
import { useSimplifiedStore } from "../stores/simplified";
import { BigNumber as BN } from "bignumber.js";
import {
  Formatter,
  Constants,
  ContractCalls,
  useAppStatusStore,
  useUserStore,
  useDataStore,
  Components,
  useApprovalStatus,
  ApprovalHooks,
  PARA_CONFIG,
  useDataStore2, marketManager
} from "@augurproject/comps";
import type { AmmOutcome, Cash, EstimateTradeResult, AmmExchange } from "@augurproject/comps/build/types";
import { Slippage,Leverage, LimitOrderSelector} from "../common/slippage";
import getUSDC from "../../utils/get-usdc";
const { estimateBuyTrade, estimateSellTrade,getRewardsContractAddress, 
  canBuy,doZCBTrade,
  //estimateZCBBuyTrade, 
  redeemZCB, getTraderBudget, getHedgeQuantity,
   getERCBalance, getVaultTokenBalance, tradeZCB, estimateTrade,
    approveERC20, setUpManager, getERC20Allowance} = ContractCalls;
const { approveERC20Contract } = ApprovalHooks;

const {
  Icons: { CloseIcon },
  LabelComps: { WarningBanner, generateTooltip },
  InputComps: { AmountInput, OutcomesGrid },
  ButtonComps: { SecondaryThemeButton, TinyThemeButton },
  SelectionComps: { BuySellToggleSwitch },
} = Components;
const { formatCash, formatCashPrice, formatPercent, formatSimpleShares } = Formatter;
const {
  ApprovalAction,
  ApprovalState,
  SHARES,
  INSUFFICIENT_LIQUIDITY,
  ENTER_AMOUNT,
  ERROR_AMOUNT,
  TX_STATUS,
  BUY,
  SELL,
  TradingDirection,
  RESOLVED_MARKET,
} = Constants;

const AVG_PRICE_TIP = "The difference between the market price and estimated price due to trade size.";
const RATE_WARNING_THRESHOLD = 10;

export interface InfoNumberType {
  label: string;
  value: string;
  tooltipText?: string;
  tooltipKey?: string;
  svg?: ReactNode;
}

interface InfoNumbersProps {
  infoNumbers: InfoNumberType[];
  unedited?: boolean;
}

export const InfoNumbers = ({ infoNumbers, unedited }: InfoNumbersProps) => {
  return (
    <div
      className={classNames(Styles.OrderInfo, {
        [Styles.Populated]: !unedited,
      })}
    >
      {infoNumbers.map((infoNumber) => (
        <div key={infoNumber.label}>
          <span>
            {infoNumber.label}
            {infoNumber.tooltipText &&
              infoNumber.tooltipKey &&
              generateTooltip(infoNumber.tooltipText, infoNumber.tooltipKey)}
          </span>
          <span>
            {infoNumber.value}
            {infoNumber.svg && infoNumber.svg}
          </span>
        </div>
      ))}
    </div>
  );
};

const getEnterBreakdown = (isUnderlying: boolean, breakdown: EstimateTradeResult | null, cash: Cash) => {
  return [
    {
      label: "Average Price",
      value: !isNaN(Number(breakdown?.averagePrice))
        ? formatCashPrice(breakdown?.averagePrice || 0, cash?.name).full
        : "-",
      tooltipText: AVG_PRICE_TIP,
      tooltipKey: "averagePrice",
    },
    {
      label: isUnderlying? "Estimated ZCB returned": "Estimated Underlying required",
      value: !isNaN(Number(breakdown?.outputValue)) ? formatSimpleShares(breakdown?.outputValue || 0).full : "-",
    },
    // {
    //   label: "Estimated Returns",
    //   value: !isNaN(Number(breakdown?.maxProfit)) ? formatCash(breakdown?.maxProfit || 0, cash?.name).full : "-",
    // },
    {
      //label: `Estimated Fees (${cash.name})`,
      label: `Estimated Fees`,
      value: !isNaN(Number(breakdown?.tradeFees)) ? formatCash(breakdown?.tradeFees || 0, cash?.name).full : "-",
    },
  ];
};

const getExitBreakdown = (breakdown: EstimateTradeResult | null, cash: Cash) => {
  return [
    {
      label: "Average Price",
      value: !isNaN(Number(breakdown?.averagePrice))
        ? formatCashPrice(breakdown?.averagePrice || 0, cash?.name).full
        : "-",
      tooltipText: AVG_PRICE_TIP,
      tooltipKey: "averagePrice",
    },
    {
      label: `Amount You'll Recieve`,
      value: !isNaN(Number(breakdown?.outputValue)) ? formatCash(breakdown?.outputValue || 0, cash?.name).full : "-",
    },
    {
      label: "Remaining Shares",
      value: !isNaN(Number(breakdown?.remainingShares))
        ? formatSimpleShares(breakdown?.remainingShares || 0).full
        : "-",
    },
    {
      label: "Estimated Fees (Shares)",
      value: !isNaN(Number(breakdown?.tradeFees)) ? formatSimpleShares(breakdown?.tradeFees || 0).full : "-",
    },
  ];
};

const formatBreakdown = (isUnderlying:boolean, isBuy: boolean, breakdown: EstimateTradeResult | null, cash: Cash) =>
  isBuy ? getEnterBreakdown(isUnderlying, breakdown, cash) : getExitBreakdown(breakdown, cash);


interface TradingFormProps {
  amm: any;
  initialSelectedOutcome: AmmOutcome | any;
  marketId: string; 
  isApproved: boolean; 
}

interface CanTradeProps {
  disabled: boolean;
  actionText: string;
  subText?: string | null;
}
// export interface MarketOutcome {
//   id: number;
//   isFinalNumerator?: boolean;
//   payoutNumerator?: string;
//   name: string;
//   symbol?: string;
//   isInvalid?: boolean;
//   isWinner?: boolean;
//   subOutcomes?: SubOutcome[];
//   marketId?: string;
// }

// export interface AmmOutcome extends MarketOutcome {
//   price: string;
//   ratioRaw: string;
//   ratio: string;
//   balanceRaw: string;
//   balance: string;
//   marketId?: string;
//   shareToken?: string;
//   defaultPrice?: string;
// }
function roundDown(number, decimals) {
    decimals = decimals || 0;
    return ( Math.floor( number * Math.pow(10, decimals) ) / Math.pow(10, decimals) );
}
const getOutcomes = (price) =>{
  const outcome = {} as AmmOutcome
  outcome.id = 0; 
  outcome.price = price; 
  outcome.name = "longZCB"
  const outcome2 = {} as AmmOutcome
  outcome2.id = 1; 
  outcome2.price = roundDown(1-price, 4).toString(); 
  outcome2.name = "shortZCB"
  const outcomes = [outcome, outcome2]
  return outcomes; 
  // return outcomes.map((o, i) => ({
  //     ...o,
  //     price: pools[i].ammOutcomes[OUTCOME_YES_ID].price,
  //     marketId: o.marketId,
  //   })),

}


export const TradingForm = ({ initialSelectedOutcome, amm, marketId, isApproved}: TradingFormProps) => {
  const { isLogged } = useAppStatusStore();
  const { cashes, blocknumber } = useDataStore();
  const { vaults: vaults, instruments: instruments, markets: market_ } = useDataStore2()
  const vaultId = market_[marketId]?.vaultId; 
  const underlying_address = vaults[vaultId]?.want.address; 
  const {
    showTradingForm,
    actions: { setShowTradingForm },
    settings: { slippage },
  } = useSimplifiedStore();
  const {
    account,
    loginAccount,
    balances,
    actions: { addTransaction },
  } = useUserStore();
  const [orderType, setOrderType] = useState(BUY);
  const [selectedOutcome, setSelectedOutcome] = useState(initialSelectedOutcome);
  const [breakdown, setBreakdown] = useState<EstimateTradeResult | null>(null);
  const [isLimit, setIsLimit] = useState(false); 
  const [isUnderlying, setIsUnderlying] = useState(true); 
  const [isIssue, setIsIssue] = useState(false); 
  const [isApprovedTrade, setIsApprovedTrade] = useState(true); 
  const [isNotVerified, setIsNotVerified] = useState(false); 

  const [bondbreakdown, setBondBreakDown] = useState<EstimateTradeResult | null>(null);

  const outcomes = getOutcomes(market_[marketId]?.longZCBprice);
  const [amount, setAmount] = useState<string>("");
  const [waitingToSign, setWaitingToSign] = useState(false);
  const ammCash = getUSDC(cashes);
  // const outcomes = amm?.ammOutcomes || [];
  const isBuy = orderType === BUY;
  const approvalAction = isBuy ? ApprovalAction.ENTER_POSITION : ApprovalAction.EXIT_POSITION;
  const outcomeShareToken = selectedOutcome?.shareToken;
  const approvalStatus = true; 
  // useApprovalStatus({
  //   cash: ammCash,
  //   amm,
  //   refresh: blocknumber,
  //   actionType: approvalAction,
  //   outcomeShareToken,
  // });


 // const { hasLiquidity } = amm;
  const hasLiquidity = true; 
  const selectedOutcomeId = selectedOutcome?.id;
  const marketShares = balances?.marketShares && balances?.marketShares[amm?.marketId];
  const hasWinner = amm?.market.hasWinner;
  const outcomeSharesRaw = JSON.stringify(marketShares?.outcomeSharesRaw);
  const amountError = amount !== "" && (isNaN(Number(amount)) || Number(amount) === 0 || Number(amount) < 0);
  const buttonError = amountError ? ERROR_AMOUNT : "";

  const [canbuy, setCanBuy] = useState(true);
  const [canRedeem, setCanRedeem] = useState(false);
  const [hedgeQuantity, setHedgeQuantity] = useState("1"); 
  const [traderBudget, setTraderBudget] = useState("1");
  const [userBalance, setUserBalance] = useState("1"); 
  const [leverageFactor, setLeverageFactor] = useState(0); 
  const [MMAllowance, setMMAllowance] = useState(false); 

  // const userBalance = String(
  //   useMemo(() => {
  //     return isBuy
  //       ? ammCash?.name
  //         ? balances[ammCash?.name]?.balance
  //         : "0"
  //       : marketShares?.outcomeShares
  //       ? marketShares?.outcomeShares[selectedOutcomeId]
  //       : "0";
  //   }, [orderType, ammCash?.name, amm?.id, selectedOutcomeId, balances])
  // );

  useEffect(async()=> {
    if(account && loginAccount ){
      const maxUint = 2**255
      
      const allowance = await getERC20Allowance(
        underlying_address, 
        loginAccount.library, 
        account, 
        marketManager
        )
      if (allowance && Number(allowance) >= maxUint)
        setMMAllowance(true); 
    }
  }, [account, amount, vaults, instruments,market_])


  useEffect(async() => {

          
    }, [ amount, orderType, ammCash?.name, amm?.id, selectedOutcomeId, balances])

  useEffect(() => {
    let isMounted = true;
    function handleShowTradingForm() {
      if (window.innerWidth >= 1200 && showTradingForm && isMounted) {
        setShowTradingForm(false);
        setAmount("");
      }
    }
    window.addEventListener("resize", handleShowTradingForm);
    isMounted && setShowTradingForm(false);
    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleShowTradingForm);
    };
  }, []);


  console.log('isapproved', isApproved); 
  useEffect(() => {
    let isMounted = true;
    const getEstimate = async()=>{
      const isShort = selectedOutcomeId ==0? false:true

      const breakdown = isBuy
        ? await estimateTrade(account, loginAccount.library, Number(marketId), amount, isUnderlying, isShort,true, isIssue)
        : await estimateTrade(account, loginAccount.library, Number(marketId), amount, isUnderlying, isShort, false, isIssue)
        isMounted&& setBreakdown(breakdown); 
    }
    // const getEstimate = async () => {
    //   const breakdown = isBuy
    //     ? estimateBuyTrade(amm, amount, selectedOutcomeId, ammCash)
    //     : estimateSellTrade(amm, amount, selectedOutcomeId, marketShares);

    //   isMounted && setBreakdown(breakdown);
    // };

    if (amount && Number(amount) > 0 
     // && new BN(amount).lte(new BN(userBalance))
      ) {
      getEstimate();

    } else if (breakdown !== null) {
      isMounted && setBreakdown(null);
    }

    return () => {
      isMounted = false;
    };
  }, [orderType, selectedOutcomeId, amount, outcomeSharesRaw, amm?.volumeTotal, amm?.liquidity, userBalance]);


  const canMakeTrade: CanTradeProps = useMemo(() => {
    let actionText = buttonError || orderType;
    let subText: string | null = null;
    let disabled = false;
    if (!isLogged) {
      actionText = "Connect Wallet";
      disabled = true;
    }  else if(isApproved && !isIssue){
      actionText = "Can only mint after approved"
      disabled = true; 
    }else if(typeof breakdown == "string" ){
      console.log('breakdown', breakdown); 
      if(breakdown == "execution reverted: ERC20: transfer amount exceeds allowance"){
        actionText = "Not approved";
        disabled = true;  
        setIsApprovedTrade(false); 
      }
      else if(breakdown == "execution reverted: budget"){
        actionText = "Not manager or not enough budget"
        subText = "Try verifing or increase reputation score to increase budget"
        disabled = true; 
        setIsNotVerified(true)
      }
      else if (breakdown == "execution reverted: ERC20: insufficient allowance"){
        actionText = "Not approved";
        disabled = true;  
        setIsApprovedTrade(false); 
      }
      else{
        actionText = breakdown; 
      disabled = isIssue? false: true; 
      }


    } else if (hasWinner) {
      actionText = RESOLVED_MARKET;
      disabled = true;
    } else if (!canbuy){
      console.log('??')
      actionText = "Trade Restricted"
      disabled = isIssue? false: true; 
    }
    //   else if (!hasLiquidity) {
    //   actionText = "Liquidity Depleted";
    //   disabled = true;
    // } 
    else if (Number(amount) === 0 || isNaN(Number(amount)) || amount === "") {
      actionText = ENTER_AMOUNT;
      disabled = true;
    // } else if (new BN(amount).gt(new BN(userBalance))) {
    //   // actionText = `Insufficient ${isBuy ? ammCash.name : "Share"} Balance`;
    //   actionText = `Insufficient Underlying Balance`; 
    //   disabled = false;
    } else if (breakdown?.maxSellAmount && breakdown?.maxSellAmount !== "0") {
      actionText = INSUFFICIENT_LIQUIDITY;
      subText = `Max Shares to Sell ${breakdown?.maxSellAmount}`;
      disabled = true;
    } else if (waitingToSign) {
      actionText = "Waiting for Confirmation";
      disabled = true;
      subText = "(Confirm the transaction in your wallet)";
    } else if (breakdown === null) {
      // todo: need better way to determine if there is liquidity
      actionText = INSUFFICIENT_LIQUIDITY;
      disabled = true;
    }
    else if(!isApproved && isIssue){
      actionText = "Instrument Not Approved"; 
      disabled = true; 
    }
    // else {
    //  actionText = "Trade Restricted"
    //   disabled = ;     }

    return {
      disabled,
      actionText,
      subText,
    };
  }, [isIssue, orderType, amount, buttonError, breakdown, userBalance, hasLiquidity, waitingToSign, hasWinner]);

  const testVerify = ()=>{
    setUpManager(account, loginAccount.library).then((response)=>{
    setIsNotVerified(false)
    })
    setIsNotVerified(false)
  }
  const redeem = () =>{
    redeemZCB(account, loginAccount.library, amm.turboId).then((response)=>{
      console.log('tradingresponse', response)}).catch((error)=>{
        console.log('Trading Error', error)
      }); 
  }
  const toggleUnderlying = ()=>{
    setIsUnderlying(!isUnderlying); 
  }
  const toggleIssueField = ()=>{
    setIsIssue(!isIssue); 
  }
  const makeTrade = () => {
    const minOutput = breakdown?.outputValue;
    const outcomeShareTokensIn = breakdown?.outcomeShareTokensIn;
    const direction = isBuy ? TradingDirection.ENTRY : TradingDirection.EXIT;
    const isClose = orderType==BUY?false: true; 
    setWaitingToSign(true);
    setShowTradingForm(false);
    const isShort = selectedOutcomeId ==1? false:true
    console.log('isissue', isIssue); 
    tradeZCB(account, loginAccount.library, marketId, amount, isShort ,isClose, isIssue )
      .then((response) => {
        console.log('trading response', response)
        if (response) {
          const { hash } = response;
          setAmount("");
          setWaitingToSign(false);
          addTransaction({
            hash,
            chainId: loginAccount.chainId,
            seen: false,
            status: TX_STATUS.PENDING,
            from: loginAccount.account,
            addedTime: new Date().getTime(),
            message: `${direction === TradingDirection.ENTRY ? "Buy" : "Sell"} ZCB`,
            marketDescription: `${amm?.market?.title} ${amm?.market?.description}`,
          });
        }
      })
      .catch((error) => {
        setWaitingToSign(false);
        console.log("Error when trying to trade: ", error?.message);
        addTransaction({
          hash: `trade-failure${Date.now()}`,
          chainId: loginAccount.chainId,
          seen: false,
          status: TX_STATUS.FAILURE,
          from: loginAccount.account,
          addedTime: new Date().getTime(),
          message: `${direction === TradingDirection.ENTRY ? "Buy" : "Sell"} Shares`,
          marketDescription: `${amm?.market?.title} ${amm?.market?.description}`,
        });
      });
    
    // doZCBTrade(account, loginAccount.library, amm.turboId, amount).then((response)=>{
    //   console.log('tradingresponse', response)}).catch((error)=>{
    //     console.log('Trading Error', error)
    //   });
    // doTrade(
    //   direction,
    //   loginAccount?.library,
    //   amm,
    //   minOutput,
    //   amount,
    //   selectedOutcomeId,
    //   account,
    //   ammCash,
    //   slippage,
    //   outcomeShareTokensIn
    // )
    //   .then((response) => {
    //     console.log('trading response', response)
    //     if (response) {
    //       const { hash } = response;
    //       setAmount("");
    //       setWaitingToSign(false);
    //       addTransaction({
    //         hash,
    //         chainId: loginAccount.chainId,
    //         seen: false,
    //         status: TX_STATUS.PENDING,
    //         from: loginAccount.account,
    //         addedTime: new Date().getTime(),
    //         message: `${direction === TradingDirection.ENTRY ? "Buy" : "Sell"} Shares`,
    //         marketDescription: `${amm?.market?.title} ${amm?.market?.description}`,
    //       });
    //     }
    //   })
    //   .catch((error) => {
    //     setWaitingToSign(false);
    //     console.log("Error when trying to trade: ", error?.message);
    //     addTransaction({
    //       hash: `trade-failure${Date.now()}`,
    //       chainId: loginAccount.chainId,
    //       seen: false,
    //       status: TX_STATUS.FAILURE,
    //       from: loginAccount.account,
    //       addedTime: new Date().getTime(),
    //       message: `${direction === TradingDirection.ENTRY ? "Buy" : "Sell"} Shares`,
    //       marketDescription: `${amm?.market?.title} ${amm?.market?.description}`,
    //     });
    //   });
  };
  console.log('instruments[marketId]?.isPool', instruments[marketId]?.isPool, marketId)
  const getRate = (): React.Fragment | null => {
    const priceImpact = formatPercent(breakdown?.priceImpact);
    const shares = !isNaN(Number(breakdown?.ratePerCash))
      ? `1 ${ammCash?.name} = ${
          formatSimpleShares(breakdown?.ratePerCash || 0, {
            denomination: (v) => `${v} Shares`,
          }).full
        }`
      : null;
    const rate = `(${priceImpact.full})`;
    return shares ? (
      <>
        <span>{shares}</span>
        <span
          className={classNames({
            [Styles.rateWarning]: Math.abs(Number(priceImpact.formatted)) >= RATE_WARNING_THRESHOLD,
          })}
        >
          {rate}
        </span>
      </>
    ) : null;
  };

  return (
    <div className={Styles.TradingForm}>
      <div>
        <BuySellToggleSwitch
          toggle={isBuy}
          setToggle={() => {
            if (isBuy) {
              setOrderType(SELL);
            } else {
              setOrderType(BUY);
            }
            setBreakdown(null);
            setAmount("");
          }}
        />

        <div>
          <span>Selling Fee: {formatPercent(amm?.feeInPercent).full}</span>
          <span>Budget: 1000</span>
        </div>
        {instruments[marketId]?.isPool && isApproved&& <TinyThemeButton
          action={toggleIssueField}
          text={!isIssue ? "Mint New LongZCB" : " Trade" }/>}
        <LimitOrderSelector isLimit = {isLimit} setIsLimit = {setIsLimit}/>
        <div
          onClick={() => {
            setShowTradingForm(false);
            setAmount("");
          }}
        >
          {CloseIcon}
        </div>

      </div>

      <div>
        {isIssue && 
          <WarningBanner 
          title={"Issue New longZCB and automatic supply to this instrument"} 
          subtitle = {"Every 1 longZCB issued, leverageFactor * longZCB price underlying is supplied"}/>}

        {!isIssue && <OutcomesGrid
          outcomes={outcomes}
          selectedOutcome={selectedOutcome}
          setSelectedOutcome={(outcome) => {
            setSelectedOutcome(outcome);
            setAmount("");
          }}
          orderType={orderType}
          ammCash={ammCash}
          dontFilterInvalid
          hasLiquidity={hasLiquidity}
          marketFactoryType={amm?.market?.marketFactoryType}
          isGrouped={amm?.market?.isGrouped}
        />}
        {/*<TinyThemeButton
          action={toggleUnderlying}
          text={!isUnderlying?"Specify in Underlying":"Specify in ZCB"}/>*/}
        {isUnderlying?(<AmountInput
          heading={"In Underlying"}
          chosenCash={ammCash?.name}
          updateInitialAmount={setAmount}
          initialAmount={amount}
          error={amountError}
          maxValue={null}
          ammCash={ammCash}
          //disabled={!hasLiquidity || hasWinner}
          disabled = {!canbuy}
          rate={getRate()}
          isBuy={orderType === BUY}
          toggleUnderlying={toggleUnderlying}
        />):
        (<AmountInput
          heading={"In ZCB"}
          chosenCash={"ZCB"}
          updateInitialAmount={setAmount}
          initialAmount={amount}
          error={amountError}
          maxValue={null}
          ammCash={ammCash}
          //disabled={!hasLiquidity || hasWinner}
          disabled = {!canbuy}
          rate={getRate()}
          isBuy={orderType === BUY}
          toggleUnderlying={toggleUnderlying}
        />)}
        {isLimit &&(<AmountInput
          heading={"Order Price"}
          chosenCash={isBuy ? ammCash?.name : SHARES}
          updateInitialAmount={setAmount}
          initialAmount={amount}
          error={amountError}
          maxValue={null}
          ammCash={ammCash}
          //disabled={!hasLiquidity || hasWinner}
          disabled = {!canbuy}
          rate={getRate()}
          isBuy={orderType === BUY}
        />)


        }
        {!isLimit && !isIssue && <Slippage />}
        <Leverage leverageFactor = {leverageFactor} setLeverageFactor={setLeverageFactor}/>
        {/* {isBuy && <Slippage />} */}
        {/*isBuy && (<Budget 
          {...{
            budget:traderBudget, 
            idx:0
          }}
          />)}
        {isBuy && (<Budget 
          {...{
            budget:hedgeQuantity, 
            idx:1
          }}
          />)*/}
       { /*<InfoNumbers infoNumbers={formatBreakdown(isBuy, breakdown, ammCash)} /> */}
        <InfoNumbers infoNumbers={formatBreakdown(isUnderlying, isBuy, breakdown, ammCash)} />

        {/*isLogged && 
          !isApprovedTrade && 
          (
          <ApprovalButton
            {...{
              amm,
              cash: ammCash,
              actionType: approvalAction,
              isApproved: isApprovedTrade,
              shareToken: outcomeShareToken,
              spender_: marketManager, 
              underlyingAddress: underlying_address, 
              amount: amount,
              setIsApprovedTrade: setIsApprovedTrade, 
            }}
          />
        )*/}
        {isLogged && isNotVerified &&(
          <TinyThemeButton 
          text = {"Test Verify"}
          action = {testVerify}
          />
          )}
        {!MMAllowance &&
            (<ApprovalButton
              {...{
              spender_: marketManager, 
              underlyingAddress:underlying_address, 
              }}
        />)}  

        {!canRedeem &&MMAllowance&&(<SecondaryThemeButton
          disabled={canMakeTrade.disabled || !isApprovedTrade}
          action={makeTrade}
          text={isIssue? "Issue New longZCB": canMakeTrade.actionText}
          subText={canMakeTrade.subText}
          error={buttonError}
          customClass={ButtonStyles.BuySellButton}
        />) }

        {canRedeem && (
          <SecondaryThemeButton
          disabled={false}
          action={redeem}
          text={'Redeem All ZCB'}
          subText={canMakeTrade.subText}
          error={buttonError}
          customClass={ButtonStyles.BuySellButton}
        />

        )}
      </div>
    </div>
  );
};
// export default TradingForm;

export const IssueForm = ({ initialSelectedOutcome, amm, marketId}: TradingFormProps) => {
   return (
    <div className={Styles.TradingForm}>
      <div>
        <BuySellToggleSwitch
          toggle={true}
          setToggle={() => {
            // if (true) {
            //   setOrderType(SELL);
            // } else {
            //   setOrderType(BUY);
            // }
            // setBreakdown(null);
            // setAmount("");
          }}
        />

        </div>
    </div>
  );
}


export const ApprovalButton = ({
  amm,
  cash,
  actionType,
  isApproved = false,
  shareToken = null,
  customClass = null,
  spender_, 
  underlyingAddress,
  setIsApprovedTrade = null,
}: {
  amm?: AmmExchange;
  cash?: Cash;
  spender_?: string; 
  underlyingAddress?: string; 
  amount?: string; 
  actionType?: string | number;
  isApproved?: boolean;
  shareToken?: string;
  customClass?: any;
  ds?: boolean; 
  setIsApprovedTrade?: Function
}) => {
  const [isPendingTx, setIsPendingTx] = useState(false);
  const {
    loginAccount,
    actions: { addTransaction },
  } = useUserStore();
  const marketCashType = cash?.name;
  const ammFactory = amm?.ammFactoryAddress;
  const marketDescription = `${amm?.market?.title} ${amm?.market?.description}`;
  const rewardContractAddress = " "//getRewardsContractAddress(amm.marketFactoryAddress);
  useEffect(() => {
    // make sure to flip local state off if we are approved, logged, pending
    if (isApproved && loginAccount && isPendingTx) {
      setIsPendingTx(false);
    }
  }, [isApproved, loginAccount, isPendingTx]);
  // console.log('?????', marketManager, underlyingAddress); 
  const approve = 
   useCallback(async()=>{
          let approvalAction = approveERC20;
          console.log('underlyingAddress', underlyingAddress)
    let address = "0xc90AfD78f79068184d79beA3b615cAB32D0DC45D";
    // let spender = marketManager//rewardContractAddress || ammFactory; 
    let spender = spender_; 
    let text = "Approving Underlying"; 
    const tx = await approvalAction(underlyingAddress, text, spender, loginAccount);
      addTransaction(tx);
      setIsApprovedTrade && setIsApprovedTrade(true)

  } ,[cash, loginAccount, shareToken, amm])

  // useCallback(async () => {
  //   try {
  //     setIsPendingTx(true);
  //     // defaults for ADD_LIQUIDITY/most used values.
  //     let approvalAction = approveERC20Contract;
  //     let address = cash?.address;
  //     let spender = ammFactory;
  //     let text = `Liquidity (${marketCashType})`;
  //     console.log('action_tyype!!')
  //     switch (actionType) {
  //       case ApprovalAction.EXIT_POSITION: {
  //         address = shareToken;
  //         text = `To Sell (${marketCashType})`;
  //         break;
  //       }
  //       case ApprovalAction.ENTER_POSITION: {
  //         text = `To Buy (${marketCashType})`;
  //         break;
  //       }
  //       case ApprovalAction.REMOVE_LIQUIDITY: {
  //         address = rewardContractAddress? null : amm?.id;
  //         spender = ammFactory;
  //         text = `Liquidity (${marketCashType})`;
  //         break;
  //       }
  //       case ApprovalAction.MINT_SETS: {
  //         address = amm?.cash?.address;
  //         spender = amm?.marketFactoryAddress;
  //         text = `Mint Complete Sets`;
  //         break;
  //       }
  //       case ApprovalAction.RESET_PRICES: {
  //         const { evenTheOdds } = PARA_CONFIG;
  //         address = amm?.cash?.address;
  //         spender = evenTheOdds;
  //         text = `Reset Prices`;
  //         break;
  //       }
  //       case ApprovalAction.ADD_LIQUIDITY:
  //       console.log('spender')
  //         spender = rewardContractAddress || ammFactory;
  //       break;
  //       default: {
  //         console.log('default!')
  //         break;
  //       }
  //     }
  //     console.log('address!')
  //     const tx = await approvalAction(address, text, spender, loginAccount);
  //     tx.marketDescription = marketDescription;
  //     addTransaction(tx);
  //   } catch (error) {
  //     setIsPendingTx(false);
  //     console.error(error);
  //   }
  // }, [cash, loginAccount, shareToken, amm]);

  if (!loginAccount || isApproved) {
    return null;
  }

  let buttonText = "";
  let subText = "";
  switch (actionType) {
    case ApprovalAction.ENTER_POSITION: {
      buttonText = "Approve to Buy";
      break;
    }
    case ApprovalAction.EXIT_POSITION: {
      buttonText = "Approve to Sell";
      break;
    }
    case ApprovalAction.REMOVE_LIQUIDITY: {
      buttonText = "Approve Removal";
      subText = "(approve to see removal estimation)";
      break;
    }
    default:
      buttonText = `Approve Underlying`;
      break;
  }
  console.log('buttontext', buttonText)
  return (
    <SecondaryThemeButton
      disabled={isPendingTx}
      text={isPendingTx ? "Approving..." : buttonText}
      subText={subText}
      action={() => approve()}
      customClass={customClass ? customClass : ButtonStyles.ApproveButton}
    />
  );
};