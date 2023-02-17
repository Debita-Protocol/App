import React, { ReactNode, useEffect, useMemo, useState, useCallback } from "react";

// @ts-ignore
import Styles from "../market/trading-form.styles.less";

// @ts-ignore
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
  useDataStore2, marketManager, leverageManager
} from "@augurproject/comps";
import type { AmmOutcome, Cash, EstimateTradeResult, AmmExchange, Instrument, CoreMarketInfo, VaultInfo } from "@augurproject/comps/build/types";
import { Slippage, Leverage, LimitOrderSelector } from "../common/slippage";
import getUSDC from "../../utils/get-usdc";
import { AddMetaMaskToken } from "modules/common/labels";
import { BaseSlider } from "modules/common/slider";
import { MarketStage, getMarketStage, round } from "utils/helpers";
import { RammButtonSwitch, RammBuyLabel, ToggleSwitch } from "@augurproject/comps/build/components/common/toggle-switch";
import { SingleCheckbox, SingleRammCheckbox } from "@augurproject/comps/build/components/common/selection";

const { estimateBuyTrade, estimateSellTrade, getRewardsContractAddress,
  canBuy, doZCBTrade,
  //estimateZCBBuyTrade, 
  redeemZCB, getTraderBudget, getHedgeQuantity,
  getERCBalance, getVaultTokenBalance, tradeZCB, estimateTrade,
  approveERC20, setUpManager, getERC20Allowance } = ContractCalls;
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
  ERROR_PRICE,
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
function roundDown(number, decimals) {
  decimals = decimals || 0;
  return (Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals));
}
interface InfoNumbersProps {
  infoNumbers: InfoNumberType[];
  unedited?: boolean;
}

export const InfoNumbers = ({ infoNumbers, unedited }: InfoNumbersProps) => {
  console.log("InfoNumbers", infoNumbers)
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

const getEnterBreakdown = (isUnderlying: boolean, breakdown: EstimateTradeResult | null, cash: Cash, isLevered, isLimit) => {
  const isLeverage = Number(breakdown?.debt) > 0;

  if (isLimit) {
    return [];
  } else if (isLevered) {
    return [
      {
        label: "Total Underlying to pay",
        value: (Number(breakdown?.totalUnderlyingPosition) > 0
          ? formatSimpleShares(Number(breakdown?.totalUnderlyingPosition) - Number(breakdown?.debt) || 0).full : "-"),
        tooltipText: "Total Underlying I am depositing for this leveraged position",
        tooltipKey: "pay",
      },

      {
        label: "Total Underlying Position",
        value: (Number(breakdown?.totalUnderlyingPosition) > 0 ? formatSimpleShares(breakdown.totalUnderlyingPosition || 0).full : "-"),
        tooltipText: "How much total position, denominated in underlying, am I getting",
        tooltipKey: "Underlying Position"
      },

      {
        label: "Total Underlying Debt",
        value: (Number(breakdown?.debt) > 0 ? breakdown.debt : "-")
      },
      {
        label: "Total ZCB Position",
        value: !isNaN(Number(breakdown?.outputValue)) ? formatSimpleShares(breakdown?.outputValue || 0).full : "-",
      },

      {
        label: "Average Price",
        value: !isNaN(Number(breakdown?.averagePrice))
          ? formatCashPrice(breakdown?.averagePrice || 0, cash?.name).full
          : "-",
        tooltipText: AVG_PRICE_TIP,
        tooltipKey: "averagePrice",
      },
      {
        label: "Reputation Gains",
        value: "-",
      },
      {
        //label: `Estimated Fees (${cash.name})`,
        label: `Estimated Fees`,
        value: !isNaN(Number(breakdown?.tradeFees)) ? formatCash(breakdown?.tradeFees || 0, cash?.name).full : "-",
      },
    ]
  }
  return [
    {
      label: "Average Price",
      value: !isNaN(Number(breakdown?.averagePrice))
        ? formatCashPrice(breakdown?.averagePrice || 0, cash?.name).full
        : "-",
      tooltipText: AVG_PRICE_TIP,
      tooltipKey: "averagePrice",
    },
    !isLeverage && {
      label: isUnderlying ? "Estimated ZCB returned" : "Estimated Underlying required",
      value: !isNaN(Number(breakdown?.outputValue)) ? formatSimpleShares(breakdown?.outputValue || 0).full : "-",
    },
    {
      label: "Reputation Gains",
      value: "-",
    },
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

const formatBreakdown = (isUnderlying: boolean, isBuy: boolean, breakdown: EstimateTradeResult | null, cash: any, isLevered: boolean, isLimit: boolean) =>
  isBuy ? getEnterBreakdown(isUnderlying, breakdown, cash, isLevered, isLimit) : getExitBreakdown(breakdown, cash);


interface TradingFormProps {
  amm: any;
  initialSelectedOutcome: AmmOutcome | any;
  marketId: string;
  isApproved: boolean;
  instrument: Instrument;
  market: CoreMarketInfo;
  vault: VaultInfo;
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

const getOutcomes = (price, isPool) => {
  const outcome = {} as AmmOutcome
  outcome.id = 0;
  outcome.price = roundDown(price, 4).toString();
  outcome.name = "longZCB"
  if (isPool) { return [outcome]; }
  const outcome2 = {} as AmmOutcome
  outcome2.id = 1;
  outcome2.price = roundDown(1 - price, 4).toString();
  outcome2.name = "shortZCB"
  const outcomes = [outcome, outcome2]
  return outcomes;
  // return outcomes.map((o, i) => ({
  //     ...o,
  //     price: pools[i].ammOutcomes[OUTCOME_YES_ID].price,
  //     marketId: o.marketId,
  //   })),

}


type OrderType = "buy" | "redeem";

export const TradingForm = ({
  initialSelectedOutcome,
  amm,
  marketId,
  isApproved,
  market,
  instrument,
  vault
}: TradingFormProps) => {
  const { isLogged } = useAppStatusStore();
  const { cashes, blocknumber } = useDataStore();
  const { vaults: vaults, instruments: instruments, markets } = useDataStore2()

  const vaultId = markets[marketId]?.vaultId;
  const longZCB_ad = markets[marketId]?.bondPool?.longZCB?.address;
  const shortZCB_ad = markets[marketId]?.bondPool?.shortZCB?.address;
  const underlying_address = vaults[vaultId]?.want.address;
  const underlying_name = vaults[vaultId]?.want.name;

  // ZEKE
  const { bondPool: { longZCBPrice }, duringAssessment } = market;

  const [ orderPrice, setOrderPrice ] = useState(""); 

  const marketStage: MarketStage = getMarketStage(market);
  const { want: { symbol: underlyingSymbol } } = vault;

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
    ramm: { reputationScore, vaultBalances, zcbBalances }

  } = useUserStore();
  const [orderType, setOrderType] = useState<OrderType>(BUY);

  const [breakdown, setBreakdown] = useState<EstimateTradeResult>({});

  const shortZCBbalance = zcbBalances[marketId]?.shortZCB;
  const longZCBbalance = zcbBalances[marketId]?.longZCB;

  
  const [isApprovedTrade, setIsApprovedTrade] = useState(true);
  const [isNotVerified, setIsNotVerified] = useState(false);

  // const [bondbreakdown, setBondBreakDown] = useState<EstimateTradeResult | null>(null);
  const isPool = instruments[marketId]?.isPool;
  
  const isIssue = isPool && !duringAssessment;

  const outcomes = useMemo(() => (
    [
      {
        name: "longZCB",
        id: 0,
        price: round(longZCBPrice, 4)
      },
      {
        name: "shortZCB",
        id: 1,
        price: round(String(1 - Number(longZCBPrice)), 4)
      }
    ]
  ), [longZCBPrice]);



  const [selectedOutcome, setSelectedOutcome] = useState(outcomes[0]);

  // underlying for buying longzcb, shortzcb for buying shortzcb
  const isUnderlying = selectedOutcome.id == 0;

  const [amount, setAmount] = useState<string>("");
  const [waitingToSign, setWaitingToSign] = useState(false);
  const underlying = vault.want; //getUSDC(cashes);

  const isBuy = orderType === BUY;
  const approvalAction = isBuy ? ApprovalAction.ENTER_POSITION : ApprovalAction.EXIT_POSITION;
  const outcomeShareToken = selectedOutcome?.shareToken;
  const approvalStatus = true;

  const hasLiquidity = true;
  const selectedOutcomeId = selectedOutcome?.id;
  const marketShares = balances?.marketShares && balances?.marketShares[amm?.marketId];
  const hasWinner = amm?.market.hasWinner;
  const outcomeSharesRaw = JSON.stringify(marketShares?.outcomeSharesRaw);
  const amountError = amount !== "" && (isNaN(Number(amount)) || Number(amount) === 0 || Number(amount) < 0);
  const priceError = orderPrice !== "" && (isNaN(Number(orderPrice)) || Number(orderPrice) === 0 || Number(orderPrice) < 0 || Number(orderPrice) > 1);
  const buttonError = amountError ? ERROR_AMOUNT : (priceError ? ERROR_PRICE : "");

  const isLong = selectedOutcomeId == 0 ? true : false;
  const [isLevered, setIsLevered] = useState(false);
  const [isLimit, setIsLimit] = useState(false);

  const [canbuy, setCanBuy] = useState(true);
  const [canRedeem, setCanRedeem] = useState(false);
  const [hedgeQuantity, setHedgeQuantity] = useState("1");
  const [traderBudget, setTraderBudget] = useState("1");
  const [userBalance, setUserBalance] = useState("1");
  const [leverageFactor, setLeverageFactor] = useState(1);
  const [MMAllowance, setMMAllowance] = useState(false);
  const userMaxAmount = vaultBalances[vaultId]?.base

  useEffect(async () => {
    if (account && loginAccount) {
      const maxUint = 2 ** 255

      const allowance = await getERC20Allowance(
        underlying_address,
        loginAccount.library,
        account,
        marketManager
      )
      if (allowance && Number(allowance) >= maxUint)
        setMMAllowance(true);

      if (reputationScore == "0") setIsNotVerified(true);
      else setIsNotVerified(false);
    }
  }, [account, amount])


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

  const getEstimate = useCallback(async () => {
    const isShort = selectedOutcomeId == 0 ? false : true

    const breakdown = await estimateTrade(account, loginAccount.library, Number(marketId), amount, isLevered, leverageFactor, isUnderlying, isShort, isIssue, isLimit)
    console.log("breakdown fxn", breakdown)
    setBreakdown(breakdown);

  }, [breakdown, amount ,account, loginAccount, marketId, isLevered, leverageFactor, isUnderlying, isLong, selectedOutcome, isIssue, isLimit])
  
  useEffect(() => {
    let isMounted = true;

    if (amount && Number(amount) > 0 && orderType === "buy"
      // && new BN(amount).lte(new BN(userBalance))
    ) {
      getEstimate();

    } else if (breakdown !== null) {
      isMounted && setBreakdown({});
    }

    return () => {
      isMounted = false;
    };
  }, [orderType, selectedOutcomeId, amount, outcomeSharesRaw, account, isLevered, leverageFactor, isUnderlying, isIssue, selectedOutcome]);

  const canMakeTrade: CanTradeProps = useMemo(() => {
    let actionText = buttonError || (isLimit ? "Submit" : orderType);
    let subText: string | null = null;
    let disabled = false;
    if (!isLogged) {
      actionText = "Connect Wallet";
      disabled = true;
    } else if (isApproved && !isIssue && isPool) {
      actionText = "Can only mint after approved"
      disabled = true;
    } else if (typeof breakdown == "string") {
      console.log('breakdown', breakdown);
      if (breakdown == "execution reverted: ERC20: transfer amount exceeds allowance") {
        actionText = "Not approved";
        disabled = true;
        setIsApprovedTrade(false);
      }
      else if (breakdown == "execution reverted: budget") {
        actionText = "Not manager or not enough budget"
        subText = "Try verifing or increase reputation score to increase budget"
        disabled = true;
        setIsNotVerified(true)
      }
      else if (breakdown == "execution reverted: ERC20: insufficient allowance") {
        actionText = "Not approved";
        disabled = true;
        setIsApprovedTrade(false);
      }
      else {
        actionText = breakdown;
        disabled = isIssue ? false : true;
      }


    } else if (hasWinner) {
      actionText = RESOLVED_MARKET;
      disabled = true;
    } else if (!canbuy) {
      console.log('??')
      actionText = "Trade Restricted"
      disabled = isIssue ? false : true;
    } else if (isLimit && Number(orderPrice) == 0) {
      actionText = "Enter Price";
      disabled = true;
    } else if (Number(amount) === 0 || isNaN(Number(amount)) || amount === "") {
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
    else if (!isApproved && isIssue) {
      actionText = "Instrument Not Approved";
      disabled = true;
    }

    return {
      disabled,
      actionText,
      subText,
    };
  }, [MMAllowance, isIssue, orderType, amount, buttonError, breakdown, userBalance, hasLiquidity, waitingToSign, hasWinner, isLimit]);

  const testVerify = () => {
    setUpManager(account, loginAccount.library).then((response) => {
      setIsNotVerified(false)
    })
    setIsNotVerified(false)
  }

  const redeem = () => {
    redeemZCB(account, loginAccount.library, amm.turboId).then((response) => {
      console.log('tradingresponse', response)
    }).catch((error) => {
      console.log('Trading Error', error)
    });
  }
  // const toggleUnderlying = () => {
  //   setIsUnderlying(!isUnderlying);
  // }
  // const toggleIssueField = () => {
  //   setIsIssue(!isIssue);
  // }
  const makeTrade = useCallback(() => {
    // const minOutput = breakdown?.outputValue;
    // const outcomeShareTokensIn = breakdown?.outcomeShareTokensIn;
    const direction = isBuy ? TradingDirection.ENTRY : TradingDirection.EXIT;
    setWaitingToSign(true);
    setShowTradingForm(false);
    const isShort = selectedOutcomeId == 1 ? false : true

    tradeZCB(account, loginAccount.library, marketId, amount, isLong, orderType === "buy", isIssue, leverageFactor, 1, "", isLimit, orderPrice)
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
  
  },[account, instrument, market, vault, amount, isLong, isIssue, isLimit, leverageFactor, orderPrice, orderType]);

  const getRate = (): React.Fragment | null => {
    const priceImpact = formatPercent(breakdown?.priceImpact);
    const shares = !isNaN(Number(breakdown?.ratePerCash))
      ? `1 ${underlying?.name} = ${formatSimpleShares(breakdown?.ratePerCash || 0, {
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

  console.log("breakdown:", breakdown);
  console.log("canMakeTrade:", canMakeTrade);
  console.log("isLevered: ", isLevered);
  console.log("isIssue: ", isIssue);
  console.log("leverageFactor: ", leverageFactor);


  return (
    <div className={Styles.TradingForm}>
      <div>
        
        {/* <ToggleSwitch
          toggle={isBuy}
          setToggle={() => {
            if (isBuy) {
              setOrderType("redeem");
            } else {
              setOrderType("buy");
            }
            setBreakdown({});
            setIsLimit(false); // taker === limit!.
            setAmount("");
            setIsLevered(false);
            setOrderPrice("");
          }}
          button1Text={"Buy"}
          button2Text={"Redeem"}
          buySell={true}
        /> */}
        <RammBuyLabel label={"ZCB Purchase"}/>
        <div>
          {/* && marketStage == MarketStage.APPROVED */}
          {orderType === "buy"  && <LimitOrderSelector isLimit={isLimit} setIsLimit={setIsLimit} />}
        </div>
        <div
          onClick={() => {
            setShowTradingForm(false);
            setAmount("");
          }}>
          {CloseIcon}
        </div>

      </div>

      <div>
        {isIssue &&
          <WarningBanner
            title={"Issue New longZCB and automatic supply to this instrument"}
            subtitle={"Every 1 longZCB issued, leverageFactor * longZCB price underlying is supplied"} />}

        {!isIssue && <OutcomesGrid
          outcomes={outcomes}
          selectedOutcome={selectedOutcome}
          setSelectedOutcome={(outcome) => {
            setSelectedOutcome(outcome);
            setAmount("");
          }}
          orderType={orderType}
          ammCash={underlying}
          dontFilterInvalid
          hasLiquidity={hasLiquidity}
          marketFactoryType={amm?.market?.marketFactoryType}
          isGrouped={false}
          currencySymbol={underlyingSymbol}
        />}
        <div>
          <AddMetaMaskToken tokenSymbol={"longZCB"} tokenAddress={longZCB_ad} />
          {<AddMetaMaskToken tokenSymbol={"shortZCB"} tokenAddress={shortZCB_ad} />}
        </div>

        {/*<TinyThemeButton
          action={toggleUnderlying}
          text={!isUnderlying?"Specify in Underlying":"Specify in ZCB"}/>*/}
        <AmountInput
          heading={"Amount"}
          chosenCash={isLimit ? (isLong ? "longZCB" : "shortZCB") : (isLong ? underlyingSymbol : "shortZCB")}
          updateInitialAmount={setAmount}
          initialAmount={amount}
          error={amountError}
          maxValue={(isLimit ? (isLong ? longZCBbalance : shortZCBbalance) : (isLong ?  vaultBalances[vaultId]?.base : shortZCBbalance))}
          //disabled={!hasLiquidity || hasWinner}
          disabled={!canbuy}
          // rate={getRate()}
          isBuy={orderType === BUY}
          toggleUnderlying={null}
        />
        {isLimit && 
        (<AmountInput
          heading={"Order Price"}
          chosenCash={underlying?.name + " / " + (isLong ? "longZCB" : "shortZCB")}
          updateInitialAmount={setOrderPrice}
          initialAmount={orderPrice}
          error={priceError}
          maxValue={null}
          //disabled={!hasLiquidity || hasWinner}
          disabled={!canbuy}
          // rate={getRate()}
          isBuy={orderType === BUY}
        />)}
        {!isLimit && !isIssue && false && <Slippage />}
        {/* <Leverage leverageFactor = {leverageFactor} setLeverageFactor={setLeverageFactor}/> */}
        {(!isLimit && isLong) && <div className={classNames(Styles.LeverageSlider, {
          [Styles.showSelection]: isLevered && isBuy
        })}>
          <div>
            <div>
            <div>
              Leverage Factor
            </div>
            {generateTooltip("leverage factor description", "leverage factor")}
            </div>
            <SingleRammCheckbox label="" initialSelected={isLevered} updateSelected={(val) => setIsLevered(val)} />
          </div>
          <div>
            <div>
              {leverageFactor}x
            </div>
            <BaseSlider value={leverageFactor} onChange={(val) => setLeverageFactor(val)} max={5} min={1} defaultValue={1} step={0.01} />
          </div>
        </div>}

        <InfoNumbers infoNumbers={formatBreakdown(isUnderlying, isBuy, breakdown, underlying, isLevered, isLimit)} />

        {!MMAllowance &&
          (<ApprovalButton
            {...{
              spender_: marketManager,
              underlyingAddress: underlying_address,
            }}
          />)}

        {!canRedeem && MMAllowance && (<SecondaryThemeButton
          disabled={canMakeTrade.disabled || !isApprovedTrade}
          action={makeTrade}
          text={isIssue ? "Issue New longZCB" : canMakeTrade.actionText}
          subText={canMakeTrade.subText}
          error={buttonError}
          customClass={ButtonStyles.BuySellButton}
        />)}

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

export const IssueForm = ({ initialSelectedOutcome, amm, marketId }: TradingFormProps) => {
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
    useCallback(async () => {
      let approvalAction = approveERC20;
      let address = "0xc90AfD78f79068184d79beA3b615cAB32D0DC45D";
      // let spender = marketManager//rewardContractAddress || ammFactory; 
      let spender = spender_;
      console.log('spender', spender, underlyingAddress);
      let text = "Approving Underlying";
      const tx = await approvalAction(underlyingAddress, text, spender, loginAccount)
        .then((response) => {
          const { hash } = response;
          addTransaction({
            hash,
            chainId: loginAccount.chainId,
            seen: false,
            status: TX_STATUS.PENDING,
            from: loginAccount.account,
            addedTime: new Date().getTime(),
            message: `Approving spender`,
            marketDescription: spender_,
          });
        }).catch((error) => {
          console.log("minting failure", error?.message);
          addTransaction({
            hash: "Approve failed",
            chainId: loginAccount.chainId,
            seen: false,
            status: TX_STATUS.FAILURE,
            from: loginAccount.account,
            addedTime: new Date().getTime(),
            message: `Approving spender`,
            marketDescription: spender_,
          });
        })
      setIsApprovedTrade && setIsApprovedTrade(true)

    }, [cash, loginAccount, shareToken, amm])

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