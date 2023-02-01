import React, { useState, useEffect, useMemo } from "react";
import classNames from "classnames";
import Highcharts from "highcharts/highstock";

// @ts-ignore
import Styles from "./market-liquidity-view.styles.less";
// @ts-ignore
import CommonStyles from "../modal/modal.styles.less";

// @ts-ignore
import ButtonStyles from "../common/buttons.styles.less";

// @ts-ignore
import LiqStyles from "./liquidity-view.styles.less";
import { useHistory, useLocation } from "react-router";
import { InfoNumbers, ApprovalButton } from "../market/trading-form";
import { BigNumber as BN } from "bignumber.js";
import { TabNavItem, TabContent } from "../common/tabs"
import _ from "lodash";
import {
  ContractCalls,
  useDataStore,
  useUserStore,
  Components,
  Utils,
  Constants,
  useApprovalStatus,
  createBigNumber,
  useAppStatusStore,
  useScrollToTopOnMount,
  useDataStore2,
  ApprovalHooks,
  GRAPH_QUERIES
} from "@augurproject/comps";
import { AddMetaMaskToken, handleValue } from "../common/labels";
import { Slippage, Leverage } from "../common/slippage";

import { InstrumentInfos, VaultInfos, CoreInstrumentData, AmmOutcome, MarketInfo, Cash, LiquidityBreakdown, DataState } from "@augurproject/comps/build/types";
import { SimplifiedStore, useSimplifiedStore } from "../stores/simplified";
import {
  MODAL_CONFIRM_TRANSACTION,
  LIQUIDITY,
  MARKET_LIQUIDITY,
  CREATE,
  ADD,
  REMOVE,
  SHARES,
  USDC, POOL_SORT_TYPES,
  POOL_SORT_TYPE_TEXT,
  INSTRUMENT_SORT_TYPES, INSTRUMENT_SORT_TYPE_TEXT
} from "../constants";
import { InstrumentCard, SortableHeaderButton } from "./liquidity-view";
import { useQuery } from '@apollo/client';
import { GET_VAULT_SNAPSHOTS } from "@augurproject/comps/build/apollo-ramm/queries";
import { constants } from "buffer";
import { VaultChartSection, VaultHistoryChart } from "../common/charts";
import { getDayFormat, getTimeFormat } from "@augurproject/comps/build/utils/date-utils";
import { formatCashPrice, optionsBlank } from "@augurproject/comps/build/utils/format-number";


const {
  useIsTokenApprovedSpender } = ApprovalHooks;

const {
  ButtonComps: { SecondaryThemeButton, TinyThemeButton },
  LabelComps: { generateTooltip, CategoryIcon, WarningBanner },
  MarketCardComps: { MarketTitleArea, orderOutcomesForDisplay, unOrderOutcomesForDisplay },
  InputComps: { AmountInput, isInvalidNumber, OutcomesGrid },
  Links: { MarketLink },
  Icons: { WarningIcon, BackIcon, MaticIcon, USDCIcon },
} = Components;
const {
  checkConvertLiquidityProperties,
  doRemoveLiquidity,
  addLiquidityPool,
  estimateAddLiquidityPool,
  getRemoveLiquidity,
  mintCompleteSets,
  isMarketPoolWhacked,
  maxWhackedCollateralAmount,
  estimateResetPrices,
  doResetPrices,
  mintVaultDS,
  faucetUnderlying, redeemVault, getERC20Allowance
} = ContractCalls;
const {
  PathUtils: { makePath, parseQuery },
  Formatter: { formatDai, formatSimpleShares, formatEther, formatCash },
  Calculations: { calcPricesFromOdds },
} = Utils;
const {
  BUY,
  MARKET_ID_PARAM_NAME,
  ApprovalAction,
  ApprovalState,
  ERROR_AMOUNT,
  CONNECT_ACCOUNT,
  ENTER_AMOUNT,
  INSUFFICIENT_BALANCE,
  ZERO,
  SET_PRICES,
  MINT_SETS,
  RESET_PRICES,
  ONE,
  INVALID_PRICE,
  INVALID_PRICE_GREATER_THAN_SUBTEXT,
  INVALID_PRICE_ADD_UP_SUBTEXT,
  TX_STATUS,
} = Constants;

const defaultAddLiquidityBreakdown: LiquidityBreakdown = {
  lpTokens: "0",
  cashAmount: "0",
  minAmounts: [],
};
const MIN_PRICE = 0.02;


const TRADING_FEE_OPTIONS = [
  {
    id: 0,
    label: "0.0%",
    value: 0,
  },
  {
    id: 1,
    label: "0.5%",
    value: 0.5,
  },
  {
    id: 2,
    label: "1%",
    value: 1,
  },
  {
    id: 3,
    label: "2%",
    value: 2,
  },
];


const getLeverageBreakdown = (
  // totalVaultExposure: string, 

) => {
  // {<p>Total Vault Exposure: {"3"}</p>}
  // {<p>Borrowed shares: {"3"}</p>}
  // {<p>My underlying: {"3"}</p>}
  // {<p>Borrowed underlying: {"3"}</p>}
  return [
    {
      label: "Total Vault Exposure",
      value: "0",
      tooltipText: "Tooltip",
      tooltipKey: "tooltip",
    },
    {
      label: "Underlying supplied",
      value: "0",
      tooltipText: "Tooltip",
      tooltipKey: "tooltip",
    },
    {
      label: "Underlying borrowed",
      value: "0",
      tooltipText: "Tooltip",
      tooltipKey: "tooltip",
    },
    {
      label: "Vault Shares Owed",
      value: "0",
      tooltipText: "Amount of shares needed to repay to pay all debt",
      tooltipKey: "tooltip",
    },
  ];
};


function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

export function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}


const REMOVE_FOOTER_TEXT = `Removing liquidity may return shares; these shares may be sold for USDC if there is still liquidity in the pool. Winning shares can be redeemed for USDC after the market has finalized.`;

export const MarketLiquidityView = () => {
  const {
    poolsViewSettings,
    actions: { updatePoolsViewSettings },
    settings: { timeFormat },
  } = useSimplifiedStore();
  const {
    actions: { closeModal },
  } = useAppStatusStore();
  const { marketTypeFilter, sortBy, primaryCategory, subCategories, onlyUserLiquidity } = poolsViewSettings;

  const { balances } = useUserStore();
  const location = useLocation();
  const history = useHistory();
  const { [MARKET_ID_PARAM_NAME]: marketId, [MARKET_LIQUIDITY]: actionType = ADD } = parseQuery(location.search);
  const { markets } = useDataStore();
  const market = markets?.[marketId];
  const [selectedAction, setSelectedAction] = useState(actionType);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  useScrollToTopOnMount();

  const isRemove = selectedAction === REMOVE;
  const isResetPrices = selectedAction === RESET_PRICES;
  const maxWhackedCollateral = market && maxWhackedCollateralAmount(market?.amm);
  const shareBalance =
    balances &&
    balances.lpTokens &&
    balances.lpTokens[market?.amm?.marketId] &&
    balances.lpTokens[market?.amm?.marketId].balance;
  const [amount, setAmount] = useState(
    isRemove ? shareBalance : isResetPrices ? maxWhackedCollateral?.collateralUsd : ""
  );

  const vaultId = marketId;
  const { vaults: vaults, instruments: instruments, prices }: { vaults: VaultInfos, instruments: InstrumentInfos, prices: any } = useDataStore2();
  let filteredInstruments = Object.values(instruments).map((instrument: any) => {
    return instrument
  })
  filteredInstruments = filteredInstruments.filter((instrument) => instrument.vaultId == vaultId);

  const vault = vaults[Number(vaultId)]


  if (!vault) {
    return <div className={classNames(Styles.MarketLiquidityView)}>Vault Not Found.</div>;
  }

  const {name, description, exchangeRate, want} = vault;

  const vault_address = vault?.address;
  const underlying_address = vault?.want.address;
  const underlyingSymbol = vault?.want.symbol;
  // const exchangeRate = Number(vault.totalShares) == 0 ? 1 : Number(vault.totalAssets) / Number(vault.totalShares);
  function roundDown(number, decimals) {
    decimals = decimals || 0;
    return (Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals));
  }
  const BackToLPPageAction = () => {
    history.push({
      pathname: makePath(LIQUIDITY),
    });
    closeModal();
  };

  return (
    <div className={classNames(Styles.MarketLiquidityView)}>
      {/*<BackBar {...{ market, selectedAction, setSelectedAction, BackToLPPageAction, setAmount, maxWhackedCollateral }} />*/}
      <MarketLink id={marketId} dontGoToMarket={true}>


        {/*<CategoryIcon {...{ categories }} />
        <MarketTitleArea {...{ ...market, timeFormat }} />*/}
      </MarketLink>
      <div
        className={classNames(Styles.Details, {
          [Styles.isClosed]: !showMoreDetails,
        })}
      >
        <h4>{name}</h4>
        <h5>{description}</h5>
        <p>{"Vault/Underlying Tokens: "}</p>
        <AddMetaMaskToken tokenSymbol={"Vault" + vaultId} tokenAddress={vault_address} />
        <AddMetaMaskToken tokenSymbol={underlyingSymbol} tokenAddress={underlying_address} />
        {/* {(
          <button onClick={() => setShowMoreDetails(!showMoreDetails)}>
            {showMoreDetails ? "Read Less" : "Read More"}
          </button>
        )}
        <p>{"details"}</p> */}

        <ul className={Styles.StatsRow}>
          <li>
            <span>TVL</span>
            <span>{"In USD: "}{handleValue(convertToUSD(vault.totalAssets, want.symbol, prices) || "0.00")}</span>
            <span>{handleValue(vault.totalAssets, want.symbol)}</span>
          </li>
          <li>
            <span>(Estimated) APR</span>
            {generateTooltip(
              "APR with 0 leverage, senior exposure to all connected instruments",
              "slippageToleranceInfo"
            )}
            <span>{vaults[vaultId].goalAPR}{"%"}</span>
          </li>
          <li>
            <span>Number of Instruments</span>
            <span>{filteredInstruments.length}</span>
          </li>

          <li>
            <span>Vault Underlying</span>
            <span>{vaults[vaultId].want.name}</span>
            {/*<span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD || "0.00").full}</span>*/}
          </li>
          {/*inception price,inception time, current value prices, current mark prices*/}

        </ul>

        <ul className={Styles.StatsRow}>
          <li>
            <span>Total Circulating Shares </span>
            <span>{vault.totalShares}</span>

            {/*<span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD/10 || "0.00").full}</span> */}
          </li>
          <li>
            <span>Exchange Rate w/ underlying</span>
            <span>{exchangeRate}</span>
          </li>

          <li>
            <span>Vault Utilization Rate</span>
            <span>{roundDown(100 * Number(vault.utilizationRate), 2)}{"%"}</span>
          </li>

          <li>
            <span>Total First Loss Capital</span>
            {generateTooltip(
              "Total amount of insurance in vault's underlying. Loss from instruments will be first deducted from this amount",
              "firstloss"
            )}
            <span>{handleValue(String(roundDown(vault.totalProtection, 2)), want.symbol)
            }</span>

            {/*<span>{marketHasNoLiquidity ? "-" : formatLiquidity(amm?.liquidityUSD || "0.00").full}</span>*/}
          </li>
          {/*inception price,inception time, current value prices, current mark prices*/}

        </ul>

        <h4></h4>
        {/*<h4>Vault Performance</h4>*/}

      </div>
      <section>
        <div>
        <ExchangeChartSection vault={vault} prices={prices}/>
        <ChartsSection vault={vault} prices={prices}/>
        </div>
        
      <MintForm {...{
        vaultId, selectedAction, setSelectedAction, amount, setAmount,
        underlying_address, exchangeRate: Number(exchangeRate)
      }} />
      </section>


      {/*<LiquidityForm {...{ market, selectedAction, setSelectedAction, BackToLPPageAction, amount, setAmount }} />
      {selectedAction !== MINT_SETS && selectedAction !== RESET_PRICES && <LiquidityWarningFooter />}*/ }
      {/*<LiquidityWarningFooter />*/}

      <div className={LiqStyles.LiquidityView}>
        <h4>Instruments</h4>

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
          {Object.values(filteredInstruments).map((instrument: any) => (
            <InstrumentCard instrument={instrument} />

          ))}
        </section>
      </div>
      {/* <ChartsSection vault={vault} prices={prices} /> */}
    </div>
  );
};

const BackBar = ({ BackToLPPageAction, selectedAction, setSelectedAction, setAmount, market, maxWhackedCollateral }) => {
  const isMint = selectedAction === MINT_SETS;
  const isReset = selectedAction === RESET_PRICES;
  const isWhacked = isMarketPoolWhacked(market.amm);
  return (
    <div className={Styles.BackBar}>
      <button onClick={BackToLPPageAction}>{BackIcon} Back To Pools</button>
      {(isWhacked || (isReset && !isWhacked)) && (
        <TinyThemeButton
          action={() => {
            setSelectedAction(isReset ? ADD : RESET_PRICES);
            if (isReset) {
              setAmount("");
            } else {
              setAmount(maxWhackedCollateral.collateralUsd);
            }
          }}
          text={isReset ? "Add/Remove" : "Reset Prices"}
          small
        />
      )}
      <TinyThemeButton
        action={() => {
          setSelectedAction(isMint ? ADD : MINT_SETS);
          !isMint && setAmount("");
        }}
        text={isMint ? "Add/Remove Liquidity" : "Mint Complete Sets"}
        small
      />
    </div>
  );
};

const LiquidityWarningFooter = () => (
  <article className={Styles.LiquidityWarningFooter}>
    <span>
      {WarningIcon} Remove liquidity before the winning outcome is known. Failure to do so can result in a total loss of
      funds.
    </span>
  </article>
);

export const ManagerWarning = () => (
  <article className={Styles.LiquidityWarningFooter}>
    <span>
      {WarningIcon} Account is not a verified manager, first apply to be verified from the community(discord).
    </span>

  </article>
);


interface LiquidityFormProps {
  market: MarketInfo;
  selectedAction: string;
  setSelectedAction: Function;
  BackToLPPageAction: () => void;
  amount: string;
  setAmount: (string) => void;
}

const orderMinAmountsForDisplay = (
  items: { amount: string; outcomeId: number; hide: boolean }[] = []
): { amount: string; outcomeId: number; hide: boolean }[] =>
  items.length > 0 && items[0].outcomeId === 0 ? items.slice(1).concat(items.slice(0, 1)) : items;

const getCreateBreakdown = (breakdown, market, balances, isRemove = false) => {
  const fullBreakdown = [
    ...orderMinAmountsForDisplay(breakdown.minAmounts)
      .filter((m) => !m.hide)
      .map((m) => ({
        label: `${market.outcomes[m.outcomeId]?.name} Shares`,
        value: `${formatSimpleShares(m.amount).formatted}`,
        svg: null,
      })),
    {
      label: isRemove ? "USDC" : "LP tokens",
      value: `${breakdown?.amount
        ? isRemove
          ? formatCash(breakdown.amount, USDC).full
          : formatSimpleShares(breakdown.amount).formatted
        : "-"
        }`,
      svg: isRemove ? USDCIcon : null,
    },
  ];
  const userRewards = balances?.pendingRewards?.[market.marketId];
  const pendingRewards = userRewards ? userRewards.balance : "0";
  const bonusRewards =
    userRewards && new Date().getTime() / 1000 >= userRewards.endBonusTimestamp ? userRewards.pendingBonusRewards : "0";
  const totalRewards = new BN(pendingRewards).plus(new BN(bonusRewards));
  if (totalRewards.gt(ZERO)) {
    fullBreakdown.push({
      label: `LP Rewards`,
      value: `${formatEther(totalRewards).formatted}`,
      svg: MaticIcon,
    });
  }
  return fullBreakdown;
};

const getMintBreakdown = (outcomes, amount) => {
  return outcomes.map((outcome) => ({
    label: `${outcome.name} Shares`,
    value: `${formatSimpleShares(amount).rounded}`,
    svg: null,
  }));
};

const getResetBreakdown = (breakdown, market) => {
  const fullBreakdown = [
    ...orderMinAmountsForDisplay(breakdown.minAmounts)
      .filter((m) => !m.hide)
      .map((m) => ({
        label: `${market.outcomes[m.outcomeId]?.name} Shares`,
        value: `${formatSimpleShares(m.amount).formatted}`,
        svg: null,
      }))
  ];
  return fullBreakdown;
};

const getResetedPricesBreakdown = (outcomes) => {
  return outcomes.map((outcome) => ({
    label: `${outcome.name}`,
    value: `${formatCash(outcome.defaultPrice).full}`,
    svg: null,
  }));
};
const confirmMintVault = async ({
  account, loginAccount, vaultId, amount, leverageFactor, addTransaction

}) => {
  mintVaultDS(account, loginAccount.library, vaultId, amount, leverageFactor)
    .then((response) => {
      const { hash } = response;
      addTransaction({
        hash,
        chainId: loginAccount.chainId,
        seen: false,
        status: TX_STATUS.PENDING,
        from: account,
        addedTime: new Date().getTime(),
        message: `Mint Vault`,
        marketDescription: 'VaultId/leverageFactor: ' + vaultId + "/" + String(leverageFactor),
      });
    }).catch((error) => {
      console.log("minting failure", error?.message);
      addTransaction({
        hash: "Mint failed",
        chainId: loginAccount.chainId,
        seen: false,
        status: TX_STATUS.FAILURE,
        from: account,
        addedTime: new Date().getTime(),
        message: `Mint Vault`,
        marketDescription: 'VaultId/leverageFactor: ' + vaultId + "/" + String(leverageFactor),
      });
    })
    ;

}
const confirmRedemVault = async ({
  account, loginAccount, vaultId, amount, addTransaction
}) => {
  await redeemVault(account, loginAccount.library, vaultId, amount)
    .then((response) => {
      const { hash } = response;
      addTransaction({
        hash,
        chainId: loginAccount.chainId,
        seen: false,
        status: TX_STATUS.PENDING,
        from: account,
        addedTime: new Date().getTime(),
        message: `Redeem Vault`,
        marketDescription: 'VaultId: ' + vaultId,
      });
    }).catch((error) => {
      console.log("minting failure", error?.message);
      addTransaction({
        hash: "Redeem failed",
        chainId: loginAccount.chainId,
        seen: false,
        status: TX_STATUS.FAILURE,
        from: account,
        addedTime: new Date().getTime(),
        message: `Redeem Vault`,
        marketDescription: 'VaultId: ' + vaultId,
      });
    })
    ;

}
const faucet = async ({
  account, loginAccount, underlying_address, addTransaction
}) => {
  faucetUnderlying(account, loginAccount.library, underlying_address)
    .then((response) => {
      const { hash } = response;
      addTransaction({
        hash,
        chainId: loginAccount.chainId,
        seen: false,
        status: TX_STATUS.PENDING,
        from: account,
        addedTime: new Date().getTime(),
        message: `Faucet Underlying`,
        marketDescription: underlying_address,
      });
    }).catch((error) => {
      console.log("minting failure", error?.message);
      addTransaction({
        hash: "Mint failed",
        chainId: loginAccount.chainId,
        seen: false,
        status: TX_STATUS.FAILURE,
        from: account,
        addedTime: new Date().getTime(),
        message: `Faucet Underlying`,
        marketDescription: underlying_address,
      });
    })
}
interface MintFormProps {
  vaultId: string;
  // market: MarketInfo;
  selectedAction: string;
  setSelectedAction: Function;
  // BackToLPPageAction: () => void;
  amount: string;
  setAmount: (string) => void;
  underlying_address: string;
  exchangeRate: number;
}
const MintForm = ({
  vaultId,
  selectedAction,
  setSelectedAction,
  amount,
  setAmount,
  underlying_address,
  exchangeRate
}: MintFormProps) => {
  const {
    account,
    balances,
    loginAccount,
    actions: { addTransaction },
    ramm: { reputationScore, vaultBalances, zcbBalances }
  } = useUserStore();
  const [vaultAllowance, setVaultAllowance] = useState(false);


  const {
    actions: { setModal },
    // isMobile
  } = useAppStatusStore();
  const dimensions = useWindowDimensions();
  const isMobile = dimensions.width < 1200;
  const { vaults: vaults, instruments: instruments }: { vaults: VaultInfos, instruments: InstrumentInfos } = useDataStore2();
  // const {vaultId} = vaults; 
  // console.log('vaults', vaults[vaultId], instruments); 
  const isAdd = selectedAction === ADD;
  const isRemove = selectedAction === REMOVE;
  const isMint = selectedAction === "mint";
  const isResetPrices = selectedAction === RESET_PRICES;

  const initialOutcomes = []

  const [outcomes, setOutcomes] = useState<AmmOutcome[]>(orderOutcomesForDisplay(initialOutcomes));

  const [chosenCash, updateCash] = useState<string>(vaults[vaultId].want.name);
  const [breakdown, setBreakdown] = useState(defaultAddLiquidityBreakdown);
  const [estimatedLpAmount, setEstimatedLpAmount] = useState<string>("0");
  const [leverageFactor, setLeverageFactor] = useState(0);
  const setPrices = (price, index) => {
    const newOutcomes = outcomes;
    newOutcomes[index].price = price;
    setOutcomes([...newOutcomes]);
  };

  useEffect(() => {
    const fetchAllowance =  async () => {
      const maxUint = 2 ** 255
      const allowance = await getERC20Allowance(
        vaults[vaultId]?.want.address,
        loginAccount.library,
        account,
        vaults[vaultId]?.address
      )
      if (allowance && Number(allowance) >= maxUint) {
        setVaultAllowance(true);
      }
    }
     if (account) {
      fetchAllowance();
    }
  }, [account, amount, vaults, instruments])

  const amountLabel = !isMint ? "Shares" : vaults[vaultId]?.want.symbol;
  const approvalActionType = ApprovalAction.MINT_SETS
  // isRemove
  // ? ApprovalAction.REMOVE_LIQUIDITY
  // : isMint
  // ? ApprovalAction.MINT_SETS
  // : isResetPrices
  // ? ApprovalAction.RESET_PRICES
  // : ApprovalAction.ADD_LIQUIDITY;
  const isApproved = false;
  const infoNumbers = []
  const { inputFormError } = MintRedeemError({ account })
  const vault = vaults[Number(vaultId)]

  // isMint
  //   ? getMintBreakdown(outcomes, amount)
  //   : isResetPrices
  //   ? getResetBreakdown(breakdown, market)
  //   : getCreateBreakdown(breakdown, market, balances, isRemove);
  let cash: Cash;
  const userMaxAmount = isAdd ? vaultBalances[vaultId]?.base :
    isMint ? vaultBalances[vaultId]?.shares : vaultBalances[vaultId]?.shares

  // const vaultApproved = useIsTokenApprovedSpender(vault[vaultId]?.want.address, vault[vaultId]?.address);

  // {isMobile && (<button
  //   className={classNames({ [Styles.selected]: false })}
  //   onClick={() => {
  //     setAmount("0");

  //     if (isAdd) {
  //       setSelectedAction("mint");
  //     }
  //     else if (isMint) {
  //       setSelectedAction(REMOVE);
  //     }
  //     else if (isRemove) {
  //       setSelectedAction(ADD);
  //     }
  //   }}
  // >
  //   {isMint ? "Manage Leverage Form" : isRemove ? "Mint Form" : "Redeem Form"}
  // </button>)}
  return (
    <section
      className={classNames(Styles.LiquidityForm, {
        [Styles.isRemove]: false,
        [Styles.isMint]: isMint || isAdd,
        [Styles.isResetPrices]: isResetPrices,
      })}
    >
      <header>
        {(<button
          className={classNames({ [Styles.selected]: isAdd })}
          onClick={() => {
            setAmount(amount);
            setSelectedAction(ADD);
          }}
        >
          {"Mint"}
        </button>)}

        { (<button
          className={classNames({ [Styles.selected]: isMint })}
          onClick={() => {
            setAmount("0");
            setSelectedAction("mint");
          }}
        >
          Redeem
        </button>)}
        {(
          <button
            className={classNames({ [Styles.selected]: isRemove })}
            onClick={() => {
              setAmount("0");
              setSelectedAction(REMOVE);
            }}
          >
            Leverage
          </button>
        )}
        {/*!shareBalance && notMintOrReset && earlyBonus && <span>Eligible for bonus rewards</span>*/}
      </header>
      <main>

        {isRemove && (<AmountInput
          heading={"Rewind Amount"}
          ammCash={cash}
          updateInitialAmount={(amount) => setAmount(amount)}
          initialAmount={""}
          maxValue={userMaxAmount}
          chosenCash={isRemove ? SHARES : chosenCash}
          updateCash={updateCash}
          updateAmountError={() => null}
          disabled={false}
        //error={hasAmountErrors}
        />)}

        {isRemove && <div className={Styles.PricesAndOutcomes}>

          <span className={Styles.PriceInstructions}>

            <span>{"Leverage Position Info"}</span>

            <InfoNumbers

              infoNumbers={getLeverageBreakdown()}
            />


          </span>
          {/*<span className={Styles.PriceInstructions}>
            <span>{ "P&L"}</span>
            {<p>Borrowed Amount: {"3"}</p>}

            {<span>(between 0.02 - 1.0). Total price of all outcomes must add up to 1.</span>}
            {<span>(between 0.02 - 1.0). Total price of all outcomes must add up to 1.</span>}
            {<span>(between 0.02 - 1.0). Total price of all outcomes must add up to 1.</span>}

          </span>*/}

          <OutcomesGrid
            outcomes={[]}
            selectedOutcome={null}
            setSelectedOutcome={() => null}
            orderType={BUY}
            nonSelectable
            editable={true}//mustSetPrices && !hasInitialOdds}
            setEditableValue={(price, index) => setPrices(price, index)}
            ammCash={cash}
            dontFilterInvalid
            hasLiquidity={true}//!mustSetPrices || hasInitialOdds}
            // marketFactoryType={market?.marketFactoryType}
            isGrouped={false}//market?.isGrouped}
          />

        </div>}

        <section className={Styles.BreakdownAndAction}>
          {!isRemove && (<AmountInput
            heading={!isMint ? "Deposit Amount" : "Redeem Amount"}
            ammCash={cash}
            updateInitialAmount={(amount) => setAmount(amount)}
            initialAmount={""}
            maxValue={userMaxAmount}
            chosenCash={isRemove ? SHARES : !isMint ? chosenCash : SHARES}
            updateCash={updateCash}
            updateAmountError={() => null}
            disabled={false}
          //error={hasAmountErrors}
          />)}
          {isAdd && <Leverage leverageFactor={leverageFactor} setLeverageFactor={setLeverageFactor} />}
          {
            isAdd && leverageFactor > 0 && (
              <WarningBanner
                className={CommonStyles.ErrorBorder}
                title="Not enough liquidity in lendingpool to borrow"
                subtitle={
                  "Not enough liquidity"
                }
              />
            )
          }
          {true && (
            <>
              {isAdd && (<div className={Styles.Breakdown}>
                <InfoNumbers
                  infoNumbers={[
                    {
                      label: "Underlying Borrowing",
                      value: (Number(leverageFactor) * Number(amount)).toString()
                    },
                    {
                      label: "Total Underlying Exposure",
                      value: ((Number(leverageFactor) + 1) * Number(amount)).toString()
                    },
                    {
                      label: "Current borrow rate",
                      value: "2.3% APR",
                      tooltipText: "Only applicable with non 0 leverage",
                      tooltipKey: "borrowrate",
                    },

                    {
                      label: "Estimated APR",
                      value: String((leverageFactor + 1) * Number(vaults[vaultId].goalAPR)),
                      tooltipText: "(Vault Estimated APR - borrow rate) * leverage multiplier ",
                      tooltipKey: "estimatedapr",
                      // isRemove? (Number(amount)* exchangeRate).toString()
                      // : (Number(amount)/exchangeRate).toString()
                      //value:`${formatCash(amount, USDC).full}`,
                      //svg: USDCIcon,
                    },

                  ]}
                />
              </div>)}
              <div className={Styles.Breakdown}>
                <span>{!isRemove ? "You'll receive" : "Debt remaining after"}</span>
                {leverageFactor == 0 ? (<InfoNumbers
                  infoNumbers={[
                    {
                      label: amountLabel,
                      value: isMint
                        ? (Number(amount) * exchangeRate).toString()
                        : isRemove ? (Number(amount) / exchangeRate).toString()
                          : (Number(amount) / exchangeRate).toString()
                      //value:`${formatCash(amount, USDC).full}`,
                      //svg: USDCIcon,
                    },

                  ]}
                />) :
                  (<InfoNumbers
                    infoNumbers={[
                      {
                        label: "Shares Total",
                        value: isMint
                          ? (Number(amount) * exchangeRate).toString()
                          : isRemove ? (Number(amount) / exchangeRate).toString()
                            : (Number(amount) / exchangeRate).toString()

                      },
                      {
                        label: "Debt(Shares) Total",
                        value: isMint
                          ? (Number(amount) * exchangeRate).toString()
                          : isRemove ? (Number(amount) / exchangeRate).toString()
                            : (Number(amount) / exchangeRate).toString()

                      }
                    ]}
                  />)
                }

              </div>
            </>
          )}
          <div className={Styles.Breakdown}>
            {isRemove && (
              <WarningBanner
                className={CommonStyles.ErrorBorder}
                title="Removing liquidity may not be viable given the utilization rate"
                subtitle={
                  "In order withdraw, you may have to wait until there is available liquidity"
                }
              />
            )}
            { /* <span>{isRemove ? "Remove All Liquidity" : "You'll Receive"}</span>
                  <InfoNumbers infoNumbers={infoNumbers} /> */}
          </div>
          <div className={Styles.ActionButtons}>
            {!isApproved && (
              <SecondaryThemeButton
                action={() => faucet({ account, loginAccount, underlying_address, addTransaction })}
                text={"Faucet Underlying"}
              />

              // <ApprovalButton
              //   amm={null}
              //   cash={cash}
              //   actionType={approvalActionType}
              //   customClass={ButtonStyles.ReviewTransactionButton}
              //   ds = {true}
              // />
            )}
            {!vaultAllowance ?
              (<ApprovalButton
                {...{
                  spender_: vaults[vaultId]?.address,
                  underlyingAddress: vaults[vaultId]?.want.address,
                }}
              />) :
              (<SecondaryThemeButton
                action={() => isAdd
                  ? confirmMintVault({ account, loginAccount, vaultId, amount, leverageFactor, addTransaction })
                  : isMint
                    ? confirmRedemVault({ account, loginAccount, vaultId, amount, addTransaction })
                    : confirmRedemVault({ account, loginAccount, vaultId, amount, addTransaction })}


                disabled={false}//!isApproved || inputFormError !== ""}
                error={inputFormError}//buttonError}
                text={isAdd ? "Mint" : isMint ? "Redeem" : "Rewind"
                  //inputFormError === "" ? (buttonError ? buttonError : actionButtonText) : inputFormError}
                }
                subText={""
                  // buttonError === INVALID_PRICE
                  //   ? lessThanMinPrice
                  //     ? INVALID_PRICE_GREATER_THAN_SUBTEXT
                  //     : INVALID_PRICE_ADD_UP_SUBTEXT
                  //   : null
                }
                customClass={ButtonStyles.ReviewTransactionButton}
              />)}

          </div>
        </section>
      </main>
    </section>
  );
}

const LiquidityForm = ({
  market,
  selectedAction,
  setSelectedAction,
  BackToLPPageAction,
  amount,
  setAmount,
}: LiquidityFormProps) => {
  const {
    account,
    balances,
    loginAccount,
    actions: { addTransaction },
  } = useUserStore();
  const {
    actions: { setModal },
  } = useAppStatusStore();


  const { blocknumber, cashes }: DataState = useDataStore();
  const isRemove = selectedAction === REMOVE;
  const isMint = selectedAction === MINT_SETS;
  const isResetPrices = selectedAction === RESET_PRICES;
  const { amm, isGrouped, rewards } = market;
  const mustSetPrices = Boolean(!amm?.id);
  const hasInitialOdds = market?.initialOdds && market?.initialOdds?.length && mustSetPrices;
  const initialOutcomes = hasInitialOdds
    ? calcPricesFromOdds(market?.initialOdds, amm?.ammOutcomes)
    : amm?.ammOutcomes || [];

  const [outcomes, setOutcomes] = useState<AmmOutcome[]>(orderOutcomesForDisplay(initialOutcomes));

  const [chosenCash, updateCash] = useState<string>(USDC);
  const [breakdown, setBreakdown] = useState(defaultAddLiquidityBreakdown);
  const [estimatedLpAmount, setEstimatedLpAmount] = useState<string>("0");
  const tradingFeeSelection = TRADING_FEE_OPTIONS[2].id;
  // const cash: Cash = cashes ? Object.values(cashes).find((c) => c.name === USDC) : Object.values(cashes)[0];
  const cash: Cash = Object.values(cashes)[0];

  const userTokenBalance = cash?.name ? balances[cash?.name]?.balance : "0";
  const shareBalance =
    balances && balances.lpTokens && balances.lpTokens[amm?.marketId] && balances.lpTokens[amm?.marketId].balance;
  const liquidityUSD =
    (balances && balances.lpTokens && balances.lpTokens[amm?.marketId] && balances.lpTokens[amm?.marketId].usdValue) ||
    "0";
  const userMaxAmount = isRemove ? shareBalance : userTokenBalance;
  const approvedToTransfer = ApprovalState.APPROVED;
  const isApprovedToTransfer = approvedToTransfer === ApprovalState.APPROVED;
  const approvalActionType = isRemove
    ? ApprovalAction.REMOVE_LIQUIDITY
    : isMint
      ? ApprovalAction.MINT_SETS
      : isResetPrices
        ? ApprovalAction.RESET_PRICES
        : ApprovalAction.ADD_LIQUIDITY;
  const approvedMain = useApprovalStatus({
    cash,
    amm,
    refresh: blocknumber,
    actionType: approvalActionType,
  });
  const isApprovedMain = approvedMain === ApprovalState.APPROVED;
  const isApproved = isRemove ? isApprovedMain && isApprovedToTransfer : isApprovedMain;
  const totalPrice = outcomes.reduce((p, outcome) => (outcome.price === "" ? parseFloat(outcome.price) + p : p), 0);

  const onChainFee = useMemo(() => {
    const feeOption = TRADING_FEE_OPTIONS.find((t) => t.id === tradingFeeSelection);
    const feePercent = selectedAction === CREATE ? feeOption.value : amm?.feeInPercent;

    return String(new BN(feePercent).times(new BN(10)));
  }, [tradingFeeSelection, amm?.feeRaw]);

  const { buttonError, inputFormError, lessThanMinPrice, hasAmountErrors } = useErrorValidation({
    isRemove,
    outcomes,
    amount,
    actionType: selectedAction,
    isGrouped,
    userMaxAmount,
    account,
  });

  useEffect(() => {
    let isMounted = true;
    const priceErrorsWithEmptyString = isRemove
      ? []
      : outcomes.filter((outcome) => parseFloat(outcome.price) >= 1 || outcome.price === "");

    if (priceErrorsWithEmptyString.length > 0 || hasAmountErrors) {
      return isMounted && setBreakdown(defaultAddLiquidityBreakdown);
    }

    const valid = isRemove
      ? true
      : checkConvertLiquidityProperties(account, market.marketId, amount, onChainFee, outcomes, cash);
    if (!valid) {
      return isMounted && setBreakdown(defaultAddLiquidityBreakdown);
    }

    async function getResults() {
      let results: LiquidityBreakdown;
      if (isRemove) {
        results = await getRemoveLiquidity(amm, loginAccount?.library, amount, account, cash, market?.hasWinner);
      } else if (isResetPrices) {

        results = await estimateResetPrices(loginAccount?.library, account, amm);
      } else {

        results = await estimateAddLiquidityPool(account, loginAccount?.library, amm, cash, amount);
      }

      if (!results) {
        return isMounted && setBreakdown(defaultAddLiquidityBreakdown);
      }
      isMounted && setBreakdown(results);
      isMounted && setEstimatedLpAmount(results.lpTokens);
    }

    if (isApproved && !buttonError) getResults();

    return () => {
      isMounted = false;
    };
  }, [
    account,
    amount,
    tradingFeeSelection,
    cash,
    isApproved,
    buttonError,
    totalPrice,
    isRemove,
    selectedAction,
    isResetPrices,
  ]);

  const actionButtonText = !amount ? "Enter Amount" : "Review";
  const setPrices = (price, index) => {
    const newOutcomes = outcomes;
    newOutcomes[index].price = price;
    setOutcomes([...newOutcomes]);
  };

  const addTitle = isRemove
    ? "Increase Liqiudity"
    : isMint
      ? "Mint Complete Sets"
      : isResetPrices
        ? "Reset Prices"
        : "Add Liquidity";
  const now = Math.floor(new Date().getTime() / 1000);
  const pendingRewards = balances.pendingRewards?.[amm?.marketId];
  const hasPendingBonus =
    (pendingRewards &&
      now > pendingRewards.endEarlyBonusTimestamp &&
      now <= pendingRewards.endBonusTimestamp &&
      pendingRewards.pendingBonusRewards !== "0") ||
    !rewards.created;
  const earlyBonus = now < rewards.earlyDepositEndTimestamp || !rewards.earlyDepositEndTimestamp;
  const infoNumbers = isMint
    ? getMintBreakdown(outcomes, amount)
    : isResetPrices
      ? getResetBreakdown(breakdown, market)
      : getCreateBreakdown(breakdown, market, balances, isRemove);

  const notMintOrReset = !isMint && !isResetPrices;
  const resetPricesInfoNumbers = getResetedPricesBreakdown(outcomes);
  return (
    <section
      className={classNames(Styles.LiquidityForm, {
        [Styles.isRemove]: isRemove,
        [Styles.isMint]: isMint,
        [Styles.isResetPrices]: isResetPrices,
      })}
    >
      <header>
        <button
          className={classNames({ [Styles.selected]: !isRemove })}
          onClick={() => {
            setAmount(amount === userMaxAmount ? "" : amount);
            setSelectedAction(Boolean(amm?.id) ? ADD : CREATE);
          }}
        >
          {addTitle}
        </button>
        {shareBalance && notMintOrReset && (
          <button
            className={classNames({ [Styles.selected]: isRemove })}
            onClick={() => {
              setAmount(shareBalance);
              setSelectedAction(REMOVE);
            }}
          >
            Remove Liquidity
          </button>
        )}
        {!shareBalance && notMintOrReset && earlyBonus && <span>Eligible for bonus rewards</span>}
      </header>
      <main>
        <AmountInput
          heading="Deposit Amount"
          ammCash={cash}
          updateInitialAmount={(amount) => setAmount(amount)}
          initialAmount={""}
          maxValue={userMaxAmount}
          chosenCash={isRemove ? SHARES : chosenCash}
          updateCash={updateCash}
          updateAmountError={() => null}
          error={hasAmountErrors}
        />

        <div className={Styles.PricesAndOutcomes}>
          <span className={Styles.PriceInstructions}>
            <span>{mustSetPrices ? "Set the Price" : "Current Prices"}</span>
            {mustSetPrices && <span>(between 0.02 - 1.0). Total price of all outcomes must add up to 1.</span>}
          </span>
          <OutcomesGrid
            outcomes={outcomes}
            selectedOutcome={null}
            setSelectedOutcome={() => null}
            orderType={BUY}
            nonSelectable
            editable={mustSetPrices && !hasInitialOdds}
            setEditableValue={(price, index) => setPrices(price, index)}
            ammCash={cash}
            dontFilterInvalid
            hasLiquidity={!mustSetPrices || hasInitialOdds}
            marketFactoryType={market?.marketFactoryType}
            isGrouped={market?.isGrouped}
          />
        </div>
        <section className={Styles.BreakdownAndAction}>
          {isResetPrices && (
            <>
              <div className={Styles.Breakdown}>
                <span>Estimated APR</span>
                <InfoNumbers infoNumbers={resetPricesInfoNumbers} />
              </div>
              <div className={Styles.Breakdown}>
                <span>USDC Needed to reset the prices</span>
                <InfoNumbers
                  infoNumbers={[
                    {
                      label: "amount",
                      value: `${formatCash(amount, USDC).full}`,
                      svg: USDCIcon,
                    },
                  ]}
                />
              </div>
            </>
          )}
          <div className={Styles.Breakdown}>
            {
              true && true && (
                <WarningBanner
                  className={CommonStyles.ErrorBorder}
                  title="Not enough liquidity in lendingpool to borrow"
                  subtitle={
                    "Not enough liquidity"
                  }
                />
              )
            }
            {isRemove && hasPendingBonus && (
              <WarningBanner
                className={CommonStyles.ErrorBorder}
                title="Increasing or removing your liquidity on a market before the bonus time is complete will result in the loss of your bonus rewards."
                subtitle={
                  "In order to receive the bonus, your liquidity needs to remain unchanged until the bonus period is over."
                }
              />
            )}
            <span>{isRemove ? "Remove All Liquidity" : "You'll Receive"}</span>
            <InfoNumbers infoNumbers={infoNumbers} />
          </div>
          <div className={Styles.ActionButtons}>
            {/*!isApproved && (
              <ApprovalButton
                amm={amm}
                cash={cash}
                actionType={approvalActionType}
                customClass={ButtonStyles.ReviewTransactionButton}
                ds={true}
              />
            )*/}
            <SecondaryThemeButton
              action={() =>
                setModal({
                  type: MODAL_CONFIRM_TRANSACTION,
                  title: isRemove
                    ? "Remove Liquidity"
                    : isMint
                      ? "Mint Complete Sets"
                      : isResetPrices
                        ? "Reset Prices"
                        : "Add Liquidity",
                  transactionButtonText: isRemove ? "Remove" : isMint ? "Mint" : isResetPrices ? "Reset Prices" : "Add",
                  transactionAction: ({ onTrigger = null, onCancel = null }) => {
                    onTrigger && onTrigger();
                    confirmAction({
                      addTransaction,
                      breakdown,
                      setBreakdown,
                      account,
                      loginAccount,
                      market,
                      amount,
                      onChainFee,
                      outcomes,
                      cash,
                      amm,
                      isRemove,
                      estimatedLpAmount,
                      afterSigningAction: BackToLPPageAction,
                      onCancel,
                      isMint,
                      isResetPrices,
                    });
                  },
                  targetDescription: {
                    market,
                    label: isMint ? "Market" : "Pool",
                  },
                  footer: isRemove
                    ? {
                      text: REMOVE_FOOTER_TEXT,
                    }
                    : null,
                  breakdowns: isRemove
                    ? [
                      {
                        heading: "What you are removing:",
                        infoNumbers: [
                          {
                            label: "Pooled USDC",
                            value: `${formatCash(liquidityUSD, USDC).full}`,
                            svg: USDCIcon,
                          },
                        ],
                      },
                      {
                        heading: "What you'll recieve",
                        infoNumbers,
                      },
                    ]
                    : isMint
                      ? [
                        {
                          heading: "What you are depositing",
                          infoNumbers: [
                            {
                              label: "amount",
                              value: `${formatCash(amount, USDC).full}`,
                              svg: USDCIcon,
                            },
                          ],
                        },
                        {
                          heading: "What you'll recieve",
                          infoNumbers,
                        },
                      ]
                      : isResetPrices
                        ? [
                          {
                            heading: "New Prices",
                            infoNumbers: resetPricesInfoNumbers,
                          },
                          {
                            heading: "USDC Needed to reset the prices",
                            infoNumbers: [
                              {
                                label: "amount",
                                value: `${formatCash(amount, USDC).full}`,
                                svg: USDCIcon,
                              },
                            ],
                          },
                          {
                            heading: "What you'll recieve",
                            infoNumbers,
                          },
                        ]
                        : [
                          {
                            heading: "What you are depositing",
                            infoNumbers: [
                              {
                                label: "amount",
                                value: `${formatCash(amount, USDC).full}`,
                                svg: USDCIcon,
                              },
                            ],
                          },
                          {
                            heading: "What you'll recieve",
                            infoNumbers,
                          },
                          {
                            heading: "Pool Details",
                            infoNumbers: [
                              {
                                label: "Trading Fee",
                                value: `${amm?.feeInPercent}%`,
                              },
                            ],
                          },
                        ],
                })
              }
              disabled={!isApproved || inputFormError !== ""}
              error={buttonError}
              text={inputFormError === "" ? (buttonError ? buttonError : actionButtonText) : inputFormError}
              subText={
                buttonError === INVALID_PRICE
                  ? lessThanMinPrice
                    ? INVALID_PRICE_GREATER_THAN_SUBTEXT
                    : INVALID_PRICE_ADD_UP_SUBTEXT
                  : null
              }
              customClass={ButtonStyles.ReviewTransactionButton}
            />
          </div>
        </section>
      </main>
    </section>
  );
};

export default MarketLiquidityView;

const confirmAction = async ({
  addTransaction,
  breakdown,
  setBreakdown,
  account,
  loginAccount,
  market,
  amount,
  onChainFee,
  outcomes,
  cash,
  amm,
  isRemove,
  estimatedLpAmount,
  afterSigningAction = () => { },
  onCancel = null,
  isMint,
  isResetPrices,
}) => {
  const valid = checkConvertLiquidityProperties(account, market.marketId, amount, onChainFee, outcomes, cash);
  if (!valid) {
    setBreakdown(defaultAddLiquidityBreakdown);
  }
  if (isRemove) {
    doRemoveLiquidity(amm, loginAccount?.library, amount, breakdown.minAmountsRaw, account, cash, market?.hasWinner)
      .then((response) => {
        const { hash } = response;
        addTransaction({
          hash,
          chainId: loginAccount.chainId,
          seen: false,
          status: TX_STATUS.PENDING,
          from: account,
          addedTime: new Date().getTime(),
          message: `Remove Liquidity`,
          marketDescription: `${market?.title} ${market?.description}`,
        });
        afterSigningAction();
      })
      .catch((error) => {
        onCancel && onCancel();
        console.log("Error when trying to remove AMM liquidity: ", error?.message);
        addTransaction({
          hash: "remove-liquidity-failed",
          chainId: loginAccount.chainId,
          seen: false,
          status: TX_STATUS.FAILURE,
          from: account,
          addedTime: new Date().getTime(),
          message: `Remove Liquidity`,
          marketDescription: `${market?.title} ${market?.description}`,
        });
      });
  } else if (isMint) {
    await mintCompleteSets(amm, loginAccount?.library, amount, account)
      .then((response) => {
        const { hash } = response;
        addTransaction({
          hash,
          chainId: loginAccount.chainId,
          from: account,
          seen: false,
          status: TX_STATUS.PENDING,
          addedTime: new Date().getTime(),
          message: `Mint Complete Sets`,
          marketDescription: `${market?.title} ${market?.description}`,
        });
        afterSigningAction();
      })
      .catch((error) => {
        onCancel && onCancel();
        console.log("Error when trying to Mint Complete Sets: ", error?.message);
        addTransaction({
          hash: `mint-sets-failed${Date.now()}`,
          chainId: loginAccount.chainId,
          from: account,
          seen: false,
          status: TX_STATUS.FAILURE,
          addedTime: new Date().getTime(),
          message: `Mint Complete Sets`,
          marketDescription: `${market?.title} ${market?.description}`,
        });
      });
  } else if (isResetPrices) {
    await doResetPrices(loginAccount.library, account, amm)
      .then((response) => {
        const { hash } = response;
        addTransaction({
          hash,
          chainId: loginAccount.chainId,
          from: account,
          seen: false,
          status: TX_STATUS.PENDING,
          addedTime: new Date().getTime(),
          message: `Reset Prices`,
          marketDescription: `${market?.title} ${market?.description}`,
        });
        afterSigningAction();
      })
      .catch((error) => {
        onCancel && onCancel();
        console.log("Error when trying to Reset Prices: ", error?.message);
        addTransaction({
          hash: `reset-prices-failed-${Date.now()}`,
          chainId: loginAccount.chainId,
          from: account,
          seen: false,
          status: TX_STATUS.FAILURE,
          addedTime: new Date().getTime(),
          message: `Reset Prices`,
          marketDescription: `${market?.title} ${market?.description}`,
        });
      });
  } else {
    await addLiquidityPool(
      account,
      loginAccount?.library,
      amm,
      cash,
      amount,
      estimatedLpAmount,
      unOrderOutcomesForDisplay(outcomes)
    )
      .then((response) => {
        const { hash } = response;
        addTransaction({
          hash,
          chainId: loginAccount.chainId,
          from: account,
          seen: false,
          status: TX_STATUS.PENDING,
          addedTime: new Date().getTime(),
          message: `Add Liquidity`,
          marketDescription: `${market?.title} ${market?.description}`,
        });
        afterSigningAction();
      })
      .catch((error) => {
        onCancel && onCancel();
        console.log("Error when trying to add AMM liquidity: ", error?.message);
        addTransaction({
          hash: `add-liquidity-failed${Date.now()}`,
          chainId: loginAccount.chainId,
          from: account,
          seen: false,
          status: TX_STATUS.FAILURE,
          addedTime: new Date().getTime(),
          message: `Add Liquidity`,
          marketDescription: `${market?.title} ${market?.description}`,
        });
      });
  }
};

const MIN_LIQUIDITY_ADD_AMOUNT = "200.00";

const MintRedeemError = ({ account }) => {
  let inputFormError = "";
  if (!account) inputFormError = "Connect Account";
  return { inputFormError };

}
const useErrorValidation = ({ isRemove, outcomes, amount, actionType, isGrouped, userMaxAmount, account }) => {
  let buttonError = "";
  let inputFormError = "";
  let lessThanMinPrice = false;
  const priceErrors = isRemove
    ? []
    : outcomes.filter((outcome) => {
      return parseFloat(outcome.price) >= 1 || isInvalidNumber(outcome.price);
    });
  const hasPriceErrors = priceErrors.length > 0;
  const hasAmountErrors = isInvalidNumber(amount);
  if (hasAmountErrors) {
    buttonError = ERROR_AMOUNT;
  } else if (hasPriceErrors) {
    buttonError = "Price is not valid";
  }
  if (!account) inputFormError = CONNECT_ACCOUNT;
  else if (!amount || amount === "0" || amount === "") inputFormError = ENTER_AMOUNT;
  else if (new BN(amount).gt(new BN(userMaxAmount))) inputFormError = INSUFFICIENT_BALANCE;
  else if ([CREATE, ADD].includes(actionType)) {
    let totalPrice = ZERO;
    outcomes.forEach((outcome) => {
      const price = createBigNumber(outcome.price || 0);
      if (price.eq(ZERO)) {
        inputFormError = SET_PRICES;
      } else if (Number(price.toFixed(2)) < Number(MIN_PRICE) && actionType === CREATE) {
        buttonError = INVALID_PRICE;
        lessThanMinPrice = true;
      } else {
        totalPrice = totalPrice.plus(createBigNumber(price));
      }
    });
    const total = createBigNumber(totalPrice.toFixed(2));
    if (inputFormError === "" && !total.eq(ONE) && !isGrouped && actionType === CREATE) {
      buttonError = INVALID_PRICE;
    }
    if (amount) {
      if (new BN(amount).lt(new BN(MIN_LIQUIDITY_ADD_AMOUNT)))
        buttonError = `$${MIN_LIQUIDITY_ADD_AMOUNT} Minimum deposit`;
    }
  }

  return {
    buttonError,
    inputFormError,
    lessThanMinPrice,
    hasAmountErrors,
  };
};


const ChartsSection = ({ vault, prices }) => {
  const { address, want } = vault;
  const [activeTab, setActiveTab] = useState("0");


  const { loading, error, data } = useQuery(GRAPH_QUERIES.GET_VAULT_SNAPSHOTS, {
    variables: {
      vaultAddress: address.toLowerCase()
    }
  })

  console.log("symbol:", want.symbol);
  console.log("vault: ", vault);
  console.log("prices: ", prices);


  let assetFormattedOutcomes = [
    {
      id: 1,
      label: "TVL",
      lastValue: convertToUSD(vault.totalAssets, want.symbol, prices),
      outcomeIdx: 0
    },
    {
      id: 2,
      label: "instrument holdings",
      lastValue: convertToUSD(vault.totalInstrumentHoldings, want.symbol, prices),
      outcomeIdx: 1
    },
    {
      id: 3,
      label: "accumulated protection",
      lastValue: convertToUSD(vault.totalProtection, want.symbol, prices),
      outcomeIdx: 2
    }
  ];

  let exchangeRateArray = [];
  let assetArray = [];
  let ratesArray = [];
  console.log("data: ", data);
  data && data.vault && _.forEach(data.vault.snapshots, (item) => {
    let timestamp = item.timestamp;
    exchangeRateArray.push({
      timestamp,
      value: item.exchangeRate,
      outcome: 1
    })

    assetArray = _.concat(assetArray,
      [{
        timestamp,
        value: convertToUSD(item.totalAssets, want.symbol, prices),
        outcome: 1
      },
      {
        timestamp,
        value: convertToUSD(item.totalInstrumentHoldings, want.symbol, prices),
        outcome: 2
      },
      {
        timestamp,
        value: convertToUSD(item.totalProtection, want.symbol, prices),
        outcome: 3
      }]
    )

    ratesArray = _.concat(ratesArray, [
      {
        timestamp,
        value: item.utilizationRate,
        outcome: 1
      },
      {
        timestamp,
        value: item.totalEstimatedAPR
      }
    ])
  })

  let options = useAssetGetOptions(assetArray);

  console.log("assetArray: ", assetArray);
  console.log("options: ", options);
  // exchange rate chart
  // let optionsExchange = useExchangeGetOptions(exchangeRateArray);
  // let creationTimestamp = data && data.vault && _.minBy(data.vault.snapshots, (item:any) => item.timestamp).timestamp;

  return (<section>
    {loading ? (
      <h2>
        Loading
      </h2>
    ) : (
      <div className={Styles.ChartsSection}>
        <div>
        <VaultChartSection title={"TVL"} options={options} vaultId={vault.vaultId} snapshots={assetArray} formattedOutcomes={assetFormattedOutcomes} />
        </div>
      </div>

    )
    }

  </section>)
}

export const convertToUSD = (amount: string, symbol: string, prices) => {
  return new BN(amount).multipliedBy(new BN(prices[symbol])).toFixed(4);
}

const ExchangeChartSection = ({ vault, prices }) => {
  const { address, want, vaultId } = vault;
  const [activeTab, setActiveTab] = useState("0");


  const { loading, error, data } = useQuery(GRAPH_QUERIES.GET_VAULT_SNAPSHOTS, {
    variables: {
      vaultAddress: address.toLowerCase()
    }
  })

  // console.log("symbol:", want.symbol);
  // console.log("vault: ", vault);
  // console.log("prices: ", prices);


  let exchangeFormattedOutcomes = [
    {
      id: 1,
      label: "exchange rate",
      lastValue: vault.exchangeRate,
      outcomeIdx: 0
    }
  ]

  let exchangeRateArray = [];
  let assetArray = [];
  let ratesArray = [];
  console.log("data Exchange: ", data);
  data && data.vault && _.forEach(data.vault.snapshots, (item) => {
    let timestamp = item.timestamp;
    exchangeRateArray.push({
      timestamp,
      value: item.exchangeRate,
      outcome: 1
    })

    assetArray = _.concat(assetArray,
      [{
        timestamp,
        value: convertToUSD(item.totalAssets, want.symbol, prices),
        outcome: 1
      },
      {
        timestamp,
        value: convertToUSD(item.totalInstrumentHoldings, want.symbol, prices),
        outcome: 2
      },
      {
        timestamp,
        value: convertToUSD(item.totalProtection, want.symbol, prices),
        outcome: 3
      }]
    )

    ratesArray = _.concat(ratesArray, [
      {
        timestamp,
        value: item.utilizationRate,
        outcome: 1
      },
      {
        timestamp,
        value: item.totalEstimatedAPR
      }
    ])
  })

  let options = useAssetGetOptions(assetArray);
  console.log("exchangeRateArray: ", exchangeRateArray);
  // exchange rate chart
  let optionsExchange = useExchangeGetOptions(exchangeRateArray);
  let creationTimestamp = data && data.vault && _.minBy(data.vault.snapshots, (item:any) => item.timestamp).timestamp;

  return (<section>
    {loading ? (
      <h2>
        Loading
      </h2>
    ) : (
      <div className={Styles.ChartsSection}>
        <div>
        <VaultChartSection title={"Exchange Rate History"} options={optionsExchange} vaultId={vaultId} snapshots={exchangeRateArray} formattedOutcomes={exchangeFormattedOutcomes} selectableOutcomes={false} />

        {/* <VaultHistoryChart {...{ rangeSelection: 3, selectedOutcomes: [true], creationTimestamp, options:optionsExchange, snapshots:exchangeRateArray, formattedOutcomes:exchangeFormattedOutcomes, colors:[1], gradients:[1]}}/> */}
        </div>
      </div>
    )
    }

  </section>)
}


const useAssetGetOptions = (arr) => {
  let maxItem = _.maxBy(_.flatten(arr), (item: any) => Number(item.value))
  let minItem = _.minBy(_.flatten(arr), (item: any) => Number(item.value))
  let maxValue;
  let minValue;
  // it max and min are the same, add 1 to max and subtract 1 from min
  if (maxItem && minItem && Number(maxItem.value) === Number(minItem.value) && Number(maxItem.value) === 0) {
    maxValue = 1;
    minValue = 0;
  } else if (maxItem && minItem && Number(maxItem.value) === Number(minItem.value)) {
    maxValue = Number(maxItem.value) + Number(maxItem.value)/2;
    minValue = Number(minItem.value) - Number(minItem.value)/2;
  } else if (maxItem && minItem){
    let delta = Number(maxItem.value) - Number(minItem.value);
    maxValue = Math.max(Number(maxItem.value) + delta/20,0);
    minValue = Math.max(Number(minItem.value) - delta/20,0);
  }


  return useMemo(() => {
    if (!maxItem || !minItem) {
      return {}
    } 
    let options = {
      lang: {
        noData: "No Chart Data",
      },
      title: {
        text: ""
      },
      chart: {
        alignTicks: false,
        backgroundColor: "transparent",
        type: "areaspline",
        styledMode: false,
        animation: true,
        reflow: true,
        spacing: [8, 0, 8, 0],
        panning: { enabled: false },
        zoomType: undefined,
        pinchType: undefined,
        panKey: undefined,
        zoomKey: undefined,
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        areaspline: {
          threshold: null,
          animation: true,
        },
      },
      scrollbar: { enabled: false },
      navigator: { enabled: false },
      xAxis: {
        ordinal: false,
        tickLength: 0,
        gridLineWidth: 0,
        gridLineColor: null,
        lineWidth: 0,
        labels: {
          formatter () {
            const that = this as any;
            let timestamp = that.value;
            const {
              settings: { timeFormat },
            } = SimplifiedStore.get();
            const date = `${getDayFormat(timestamp)}`;

            return date;
          }
        }
      },
      yAxis: {
        showEmpty: true,
        opposite: false,
        max: maxValue.toFixed(2),
        min: minValue.toFixed(2),
        gridLineWidth: 0,
        gridLineColor: null,
        labels: false,
      },
      tooltip: {
        enabled: true,
        shape: "square",
        shared: true,
        split: false,
        useHTML: true,
        valueDecimals: 4,
        formatter() {
          const {
            settings: { timeFormat },
          } = SimplifiedStore.get();
          const that = this as any;
          const date = `${getDayFormat(that.x)}, ${getTimeFormat(that.x, timeFormat)}`;
          let out = `<h5>${date}</h5><ul>`;
          that.points.forEach((point) => {
            out += `<li><span style="color:${point.color}">&#9679;</span><b>${point.series.name}</b><span>${formatCashPrice(createBigNumber(point.y), "USDC").full
              }</span></li>`;
          });
          out += "</ul>";
          return out;
      }},
      time: {
        useUTC: false,
      },
      rangeSelector: {
        enabled: false,
      }
    }
    return options;
  }, [maxValue, minValue])
}

const useExchangeGetOptions = (arr) => {
  let maxItem = _.maxBy(_.flatten(arr), (item: any) => Number(item.value))
  let minItem = _.minBy(_.flatten(arr), (item: any) => Number(item.value))
  let maxValue;
  let minValue;
  // it max and min are the same, add 1 to max and subtract 1 from min
  if (maxItem && minItem && Number(maxItem.value) === Number(minItem.value)) {
    maxValue = Number(maxItem.value) + Number(maxItem.value)/2;
    minValue = Number(minItem.value) - Number(minItem.value)/2;
  } else if (maxItem && minItem){
    let delta = Number(maxItem.value) - Number(minItem.value);
    maxValue = Math.max(Number(maxItem.value) + delta/20,0);
    minValue = Math.max(Number(minItem.value) - delta/20,0);
  }

  return useMemo(() => {
    if (!maxItem || !minItem) {
      return {}
    } 
    let options = {
      lang: {
        noData: "No Chart Data",
      },
      title: {
        text: "",
        style: {
          fontSize: '30px'
        }
      },
      chart: {
        alignTicks: false,
        backgroundColor: "transparent",
        type: "areaspline",
        styledMode: false,
        animation: true,
        reflow: true,
        spacing: [8, 0, 8, 0],
        panning: { enabled: false },
        zoomType: undefined,
        pinchType: undefined,
        panKey: undefined,
        zoomKey: undefined
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        areaspline: {
          threshold: null,
          animation: true,
        },
      },
      scrollbar: { enabled: false },
      navigator: { enabled: false },
      xAxis: {
        ordinal: false,
        tickLength: 0,
        gridLineWidth: 0,
        gridLineColor: null,
        lineWidth: 0,
        labels: {
          formatter () {
            const that = this as any;
            let timestamp = that.value;
            const {
              settings: { timeFormat },
            } = SimplifiedStore.get();
            const date = `${getDayFormat(timestamp)}`;

            return date;
          }
        }
      },
      yAxis: {
        showEmpty: true,
        opposite: false,
        max: maxValue.toFixed(2),
        min: minValue.toFixed(2),
        gridLineWidth: 0,
        gridLineColor: null,
        labels: false,
      },
      tooltip: {
        enabled: true,
        shape: "square",
        shared: true,
        split: false,
        useHTML: true,
        valueDecimals: 4,
        formatter() {
          const {
            settings: { timeFormat },
          } = SimplifiedStore.get();
          const that = this as any;
          const date = `${getDayFormat(that.x)}, ${getTimeFormat(that.x, timeFormat)}`;
          let out = `<h5>${date}</h5><ul>`;
          that.points.forEach((point) => {
            out += `<li><span style="color:${point.color}">&#9679;</span><b>${point.series.name}</b><span>${formatCashPrice(createBigNumber(point.y), "USDC").full
              }</span></li>`;
          });
          out += "</ul>";
          return out;
        }
      },
      time: {
        useUTC: false,
      },
      rangeSelector: {
        enabled: false,
      }
    }
    return options;
  }, [maxValue, minValue])
}