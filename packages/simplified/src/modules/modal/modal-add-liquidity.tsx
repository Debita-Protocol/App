// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import Styles from './modal.styles.less';
import { Header } from './common';
import { useHistory } from 'react-router';
import { InfoNumbers } from '../market/trading-form';
import classNames from 'classnames';
import { AmmOutcome, Cash, LiquidityBreakdown, MarketInfo } from '../types';
import { BigNumber as BN } from 'bignumber.js';
import {
  ContractCalls,
  createBigNumber,
  useAppStatusStore,
  useDataStore,
  useUserStore,
  useApprovalStatus,
  Formatter,
  Constants,
  Components,
} from '@augurproject/comps';
const {
  checkConvertLiquidityProperties,
  doRemoveLiquidity,
  addLiquidityPool,
  estimateLiquidityPool,
  getRemoveLiquidity,
} = ContractCalls;
const {
  convertDisplayShareAmountToOnChainShareAmount,
  formatPercent,
  convertOnChainSharesToDisplayShareAmount,
  formatSimpleShares,
  formatCash,
} = Formatter;
const {
  Icons: { BackIcon },
  ButtonComps: { ApprovalButton, BuySellButton },
  SelectionComps: { MultiButtonSelection },
  InputComps: {
    AmountInput,
    isInvalidNumber,
    OutcomesGrid,
  },
  LabelComps: {
    generateTooltip
  }
} = Components;
const {
  YES_NO,
  BUY,
  USDC,
  SHARES,
  MARKETS,
  ApprovalAction,
  ENTER_AMOUNT,
  YES_OUTCOME_ID,
  NO_OUTCOME_ID,
  CREATE,
  ADD,
  REMOVE,
  CONNECT_ACCOUNT,
  SET_PRICES,
  TX_STATUS,
  INSUFFICIENT_BALANCE,
  ONE,
  ERROR_AMOUNT,
  PORTION_OF_CASH_INVALID_POOL,
  ApprovalState,
} = Constants;

const TRADING_FEE_OPTIONS = [
  {
    id: 0,
    label: '0.0%',
    value: 0,
  },
  {
    id: 1,
    label: '0.5%',
    value: 0.5,
  },
  {
    id: 2,
    label: '1%',
    value: 1,
  },
  {
    id: 3,
    label: '2%',
    value: 2,
  },
];

const defaultAddLiquidityBreakdown: LiquidityBreakdown = {
  yesShares: '0',
  noShares: '0',
  lpTokens: '0',
  cashAmount: '0',
};

interface ModalAddLiquidityProps {
  market: MarketInfo;
  liquidityModalType: string;
  currency?: string;
}

const ModalAddLiquidity = ({
  market,
  liquidityModalType,
  currency,
}: ModalAddLiquidityProps) => {
  const {
    actions: { closeModal },
  } = useAppStatusStore();
  const {
    account,
    balances,
    loginAccount,
    actions: { addTransaction },
  } = useUserStore();
  const { cashes, ammExchanges, blocknumber } = useDataStore();
  const history = useHistory();

  let amm = ammExchanges[market.marketId];
  const mustSetPrices = Boolean(!amm?.id);
  const modalType = Boolean(amm?.id) ? ADD : CREATE;

  const [outcomes, setOutcomes] = useState<AmmOutcome[]>(amm.ammOutcomes);
  const [showBackView, setShowBackView] = useState(false);
  const [chosenCash, updateCash] = useState<string>(currency ? currency : USDC);
  const [breakdown, setBreakdown] = useState(defaultAddLiquidityBreakdown);
  const [estimatedLpAmount, setEstimatedLpAmount] = useState<string>('0');
  const [tradingFeeSelection, setTradingFeeSelection] = useState<number>(
    TRADING_FEE_OPTIONS[2].id
  );

  const cash: Cash = useMemo(() => {
    return cashes && chosenCash
      ? Object.values(cashes).find((c) => c.name === chosenCash)
      : Object.values(cashes)[0];
  }, [chosenCash]);
  const isRemove = modalType === REMOVE;
  const approvedToTransfer = ApprovalState.APPROVED;
  // const approvedToTransfer = useApprovalStatus({
  //   cash,
  //   amm,
  //   actionType: ApprovalAction.TRANSFER_LIQUIDITY,
  // });
  const isApprovedToTransfer = approvedToTransfer === ApprovalState.APPROVED;
  // const isApprovedMain = ApprovalState.APPROVED;
  const approvedMain = useApprovalStatus({
    cash,
    amm,
    refresh: blocknumber,
    actionType: !isRemove
    ? ApprovalAction.ADD_LIQUIDITY
    : ApprovalAction.REMOVE_LIQUIDITY
  });
  const isApprovedMain = approvedMain === ApprovalState.APPROVED;
  const isApproved = isRemove ? isApprovedMain && isApprovedToTransfer : isApprovedMain;
  const userTokenBalance = cash?.name ? balances[cash?.name]?.balance : '0';
  const shareBalance =
    balances &&
    balances.lpTokens &&
    balances.lpTokens[amm?.id] &&
    balances.lpTokens[amm?.id]?.balance;
  const userMaxAmount = isRemove ? shareBalance : userTokenBalance;

  const [amount, updateAmount] = useState(
    isRemove ? userMaxAmount : ''
  );

  const feePercentFormatted = useMemo(() => {
    const feeOption = TRADING_FEE_OPTIONS.find(
      (t) => t.id === tradingFeeSelection
    );
    const feePercent =
      modalType === CREATE ? feeOption.value : amm?.feeInPercent;
    return formatPercent(feePercent).full;
  }, [tradingFeeSelection, amm?.feeInPercent]);

  const onChainFee = useMemo(() => {
    const feeOption = TRADING_FEE_OPTIONS.find(
      (t) => t.id === tradingFeeSelection
    );
    const feePercent =
      modalType === CREATE ? feeOption.value : amm?.feeInPercent;

    return String(new BN(feePercent).times(new BN(10)));
  }, [tradingFeeSelection, amm?.feeRaw]);

  const userPercentOfPool = useMemo(() => {
    let userPercent = '100';
    const rawSupply = amm?.totalSupply;
    if (rawSupply) {
      if (modalType === ADD) {
        const displaySupply = convertOnChainSharesToDisplayShareAmount(
          rawSupply,
          cash?.decimals
        );
        userPercent = String(
          new BN(estimatedLpAmount)
            .plus(new BN(shareBalance || '0'))
            .div(new BN(displaySupply).plus(new BN(estimatedLpAmount)))
            .times(new BN(100))
        );
      } else if (isRemove) {
        const userBalanceLpTokens =
          balances && balances.lpTokens && balances.lpTokens[amm?.id];
        const userAmount = userBalanceLpTokens?.rawBalance || '0';
        const estUserAmount = convertDisplayShareAmountToOnChainShareAmount(
          amount,
          cash?.decimals
        );
        userPercent = String(
          new BN(userAmount || '0')
            .minus(new BN(estUserAmount))
            .div(new BN(rawSupply).minus(new BN(estUserAmount)))
        );
      }
    }

    return formatPercent(userPercent).full;
  }, [
    amm?.totalSupply,
    amount,
    balances,
    shareBalance,
    estimatedLpAmount,
    amm?.id,
    cash?.decimals,
  ]);

  let buttonError = '';
  const priceErrors = outcomes.filter((outcome) => {
    return (
      parseFloat(outcome.price) >= 1 ||
      (!outcome.isInvalid && isInvalidNumber(outcome.price))
    );
  });
  const hasPriceErrors = priceErrors.length > 0;
  const hasAmountErrors = isInvalidNumber(amount);
  if (hasAmountErrors) {
    buttonError = ERROR_AMOUNT;
  } else if (hasPriceErrors) {
    buttonError = 'Price is not valid';
  }

  useEffect(() => {
    const priceErrorsWithEmptyString = outcomes.filter(
      (outcome) =>
        !outcome.isInvalid &&
        (parseFloat(outcome.price) >= 1 ||
          isInvalidNumber(outcome.price) ||
          outcome.price === '')
    );
    if (priceErrorsWithEmptyString.length > 0 || hasAmountErrors) {
      return setBreakdown(defaultAddLiquidityBreakdown);
    }

    const properties = checkConvertLiquidityProperties(
      account,
      market.marketId,
      amount,
      onChainFee,
      outcomes,
      cash,
      amm,
    );
    if (!properties) {
      return setBreakdown(defaultAddLiquidityBreakdown);
    }
    async function getResults() {
      let results: LiquidityBreakdown;
      if (isRemove) {
        results = await getRemoveLiquidity(
          market.marketId,
          loginAccount?.library,
          cash,
          onChainFee,
          amount
        );
      } else {
        results = await estimateLiquidityPool(
          account,
          loginAccount?.library,
          amm,
          cash,
          properties.fee,
          amount,
          properties.priceNo,
          properties.priceYes,
        );
      }

      if (!results) {
        return setBreakdown(defaultAddLiquidityBreakdown);
      }
      setBreakdown(results);
      setEstimatedLpAmount(results.lpTokens);
    }

    getResults();
  }, [
    account,
    amount,
    tradingFeeSelection,
    cash,
    outcomes[YES_OUTCOME_ID]?.price,
    outcomes[NO_OUTCOME_ID]?.price,
  ]);

  let inputFormError = '';
  if (!account) inputFormError = CONNECT_ACCOUNT;
  else if (!amount || amount === '0' || amount === '')
    inputFormError = ENTER_AMOUNT;
  else if (new BN(amount).gt(new BN(userMaxAmount)))
    inputFormError = INSUFFICIENT_BALANCE;
  else if (modalType === CREATE) {
    const yesPrice = outcomes[YES_OUTCOME_ID].price;
    const noPrice = outcomes[NO_OUTCOME_ID].price;
    if (
      yesPrice === '0' ||
      !yesPrice ||
      noPrice === '0' ||
      !noPrice ||
      noPrice === '0.00' ||
      yesPrice === '0.00'
    ) {
      inputFormError = SET_PRICES;
    }
  }

  const addCreateBreakdown = [
    {
      label: 'yes shares',
      value: `${formatSimpleShares(breakdown.yesShares).formatted}`,
    },
    {
      label: 'no shares',
      value: `${formatSimpleShares(breakdown.noShares).formatted}`,
    },
    {
      label: 'LP tokens',
      value: `${formatSimpleShares(breakdown.lpTokens).formatted}`,
    },
  ];

  const invalidCashAmount = formatCash(
    createBigNumber(amount === '' ? '0' : amount).times(
      PORTION_OF_CASH_INVALID_POOL
    ),
    cash?.name
  ).full;

  const confirmAction = async () => {
    const properties = checkConvertLiquidityProperties(
      account,
      market.marketId,
      amount,
      onChainFee,
      outcomes,
      cash,
      amm,
    );
    if (!properties) {
      setBreakdown(defaultAddLiquidityBreakdown);
    }
    if (isRemove) {
      doRemoveLiquidity(amm, loginAccount?.library, amount)
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
            marketDescription: market.description,
          });
        })
        .catch(error => {
          console.log('Error when trying to remove AMM liquidity: ', error?.message);
        });
    } else {
      await addLiquidityPool(
        account,
        loginAccount?.library,
        amm,
        cash,
        properties.fee,
        amount,
        properties.priceNo,
        properties.priceYes
      )
        .then(response => {
          const { hash } = response;
          addTransaction({
            hash,
            chainId: loginAccount.chainId,
            from: account,
            seen: false,
            status: TX_STATUS.PENDING,
            addedTime: new Date().getTime(),
            message: `Add Liquidity`,
            marketDescription: market.description,
          });
        })
        .catch(error => {
          console.log('Error when trying to add AMM liquidity: ', error?.message);
        });
    }
    closeModal();
    if (modalType === CREATE && history.location.pathname !== `/${MARKETS}`) {
      history.push(`/${MARKETS}`);
    }
  };

  const LIQUIDITY_STRINGS = {
    [REMOVE]: {
      header: 'remove all liquidity',
      showTradingFee: false,
      cantEditAmount: true,
      hideCurrentOdds: true,
      receiveTitle: 'What you will recieve',
      approvalButtonText: 'approve shares spend',
      actionButtonText: 'Remove all liquidity',
      confirmButtonText: 'confirm remove',
      currencyName: SHARES,
      footerText: `Removing liquidity returns shares; these shares may be sold for ${chosenCash}.`,
      breakdown: [
        {
          label: 'yes shares',
          value: `${formatSimpleShares(breakdown.yesShares).formatted}`,
        },
        {
          label: 'no shares',
          value: `${formatSimpleShares(breakdown.noShares).formatted}`,
        },
      ],
      liquidityDetails: {
        title: 'Market Liquidity Details',
        breakdown: [
          {
            label: 'Trading fee',
            value: `${feePercentFormatted}`,
          },
          {
            label: 'your share of the liquidity pool',
            value: `${userPercentOfPool}`,
          },
        ],
      },
      confirmOverview: {
        title: 'What you are Removing',
        breakdown: [
          {
            label: 'LP tokens',
            value: `${amount}`,
          },
        ],
      },
      confirmReceiveOverview: {
        title: 'What you will recieve',
        breakdown: [
          {
            label: 'yes shares',
            value: `${formatSimpleShares(breakdown.yesShares).formatted}`,
          },
          {
            label: 'no shares',
            value: `${formatSimpleShares(breakdown.noShares).formatted}`,
          },
        ],
      },
    },
    [ADD]: {
      header: 'add liquidity',
      showTradingFee: true,
      setOdds: true,
      setOddsTitle: mustSetPrices
        ? 'Set the price (between 0.0 to 1.0)'
        : 'Current Prices',
      receiveTitle: "You'll receive",
      actionButtonText: 'Add',
      confirmButtonText: 'confirm add',
      footerText: `By adding liquidity you'll earn ${feePercentFormatted} of all trades on this market proportional to your share of the pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity. ${invalidCashAmount} will be added to the invalid balancer pool.`,
      breakdown: addCreateBreakdown,
      approvalButtonText: `approve ${chosenCash}`,
      confirmOverview: {
        title: 'What you are depositing',
        breakdown: [
          {
            label: 'amount',
            value: `${amount} ${amm?.cash?.name}`,
          },
        ],
      },
      confirmReceiveOverview: {
        title: 'What you will receive',
        breakdown: addCreateBreakdown,
      },
      marketLiquidityDetails: {
        title: 'Market liquidity details',
        breakdown: [
          {
            label: 'trading fee',
            value: `${feePercentFormatted}`,
          },
          {
            label: 'your share of the pool',
            value: `${userPercentOfPool}`,
          },
        ],
      },
      currencyName: `${chosenCash}`,
    },
    [CREATE]: {
      header: 'add liquidity',
      showTradingFee: false,
      setOdds: true,
      setOddsTitle: 'Set the price (between 0.0 to 1.0)',
      editableOutcomes: true,
      setFees: false, // set false for version 0
      receiveTitle: "You'll receive",
      actionButtonText: 'Add',
      confirmButtonText: 'confirm market liquidity',
      currencyName: `${chosenCash}`,
      footerText: `By adding initial liquidity you'll earn your set trading fee percentage of all trades on this market proportional to your share of the pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity. ${invalidCashAmount} will be added to the invalid balancer pool.`,
      breakdown: addCreateBreakdown,
      approvalButtonText: `approve ${chosenCash}`,
      confirmOverview: {
        title: 'What you are depositing',
        breakdown: [
          {
            label: 'amount',
            value: `${amount} ${cash?.name}`,
          },
        ],
      },
      confirmReceiveOverview: {
        title: 'What you will receive',

        breakdown: addCreateBreakdown,
      },
      marketLiquidityDetails: {
        title: 'Market liquidity details',

        breakdown: [
          {
            label: 'trading fee',
            value: `${feePercentFormatted}`,
          },
          {
            label: 'your share of the pool',
            value: `${userPercentOfPool}`,
          },
        ],
      },
    },
  };

  const setPrices = (price, index) => {
    const newOutcomes = outcomes;
    newOutcomes[index].price = price;
    if (
      price !== '' &&
      !isNaN(price) &&
      price !== '0' &&
      parseFloat(price) < 1
    ) {
      let newValue = ONE.minus(createBigNumber(price)).toString();
      if (newOutcomes[index].id === YES_OUTCOME_ID) {
        newOutcomes[NO_OUTCOME_ID].price = newValue;
      } else {
        newOutcomes[YES_OUTCOME_ID].price = newValue;
      }
    }
    setOutcomes([...newOutcomes]);
  };
  return (
    <section
      className={classNames(Styles.ModalAddLiquidity, {
        [Styles.showBackView]: showBackView,
        [Styles.Remove]: isRemove,
      })}
    >
      {!showBackView ? (
        <>
          <Header
            title={LIQUIDITY_STRINGS[modalType].header}
            subtitle={{
              label: 'trading fee',
              value: LIQUIDITY_STRINGS[modalType].showTradingFee
                ? feePercentFormatted
                : null,
            }}
          />
          <main>
            {!LIQUIDITY_STRINGS[modalType].cantEditAmount && (
              <>
                {LIQUIDITY_STRINGS[modalType].amountSubtitle && (
                  <span className={Styles.SmallLabel}>
                    {LIQUIDITY_STRINGS[modalType].amountSubtitle}
                  </span>
                )}
                <AmountInput
                  ammCash={cash}
                  updateInitialAmount={(amount) => updateAmount(amount)}
                  initialAmount={amount}
                  maxValue={userMaxAmount}
                  showCurrencyDropdown={!currency}
                  chosenCash={isRemove ? SHARES : chosenCash}
                  updateCash={updateCash}
                  updateAmountError={() => null}
                  error={hasAmountErrors}
                />
              </>
            )}
            {LIQUIDITY_STRINGS[modalType].setFees && (
              <>
                <span className={Styles.SmallLabel}>
                  Set trading fee
                  {generateTooltip(
                  'Fees earned for providing liquidity.',
                  'tradingFeeInfo'
                )}
                </span>
                <MultiButtonSelection
                  options={TRADING_FEE_OPTIONS}
                  selection={tradingFeeSelection}
                  setSelection={(id) => setTradingFeeSelection(id)}
                />
              </>
            )}
            {!LIQUIDITY_STRINGS[modalType].hideCurrentOdds && (
              <>
                <span className={Styles.SmallLabel}>
                  {LIQUIDITY_STRINGS[modalType].setOddsTitle}
                </span>
                <OutcomesGrid
                  outcomes={outcomes}
                  selectedOutcome={null}
                  setSelectedOutcome={() => null}
                  marketType={YES_NO}
                  orderType={BUY}
                  nonSelectable
                  editable={mustSetPrices}
                  setEditableValue={(price, index) => setPrices(price, index)}
                  ammCash={cash}
                  error={hasPriceErrors}
                />
              </>
            )}
            {LIQUIDITY_STRINGS[modalType].liquidityDetails && (
              <div className={Styles.LineBreak}>
                <span className={Styles.SmallLabel}>
                  {LIQUIDITY_STRINGS[modalType].liquidityDetails.title}
                </span>
                <InfoNumbers
                  infoNumbers={
                    LIQUIDITY_STRINGS[modalType].liquidityDetails.breakdown
                  }
                />
              </div>
            )}
            <span className={Styles.SmallLabel}>
              {LIQUIDITY_STRINGS[modalType].receiveTitle}
            </span>
            <InfoNumbers
              unedited={
                JSON.stringify(breakdown) ===
                JSON.stringify(defaultAddLiquidityBreakdown)
              }
              infoNumbers={LIQUIDITY_STRINGS[modalType].breakdown}
            />
            {!isApproved && (
              <>
                <ApprovalButton
                  amm={amm}
                  cash={cash}
                  actionType={
                    !isRemove
                      ? ApprovalAction.ADD_LIQUIDITY
                      : ApprovalAction.REMOVE_LIQUIDITY
                  }
                />
                {isRemove &&
                  <ApprovalButton
                    amm={amm}
                    cash={cash}
                    actionType={ApprovalAction.TRANSFER_LIQUIDITY}
                  />
                }
              </>
            )}

            <BuySellButton
              action={() => setShowBackView(true)}
              disabled={!isApproved || inputFormError !== ''}
              error={buttonError}
              text={
                inputFormError === ''
                  ? buttonError
                    ? buttonError
                    : LIQUIDITY_STRINGS[modalType].actionButtonText
                  : inputFormError
              }
            />
            <div className={Styles.FooterText}>
              {LIQUIDITY_STRINGS[modalType].footerText}
            </div>
          </main>
        </>
      ) : (
          <>
            <div className={Styles.Header} onClick={() => setShowBackView(false)}>
              {BackIcon}
            Back
          </div>
            <main>
              <div className={Styles.MarketTitle}>
                <span>Market</span>
                <span>{market.description}</span>
              </div>
              <section>
                <span className={Styles.SmallLabel}>
                  {LIQUIDITY_STRINGS[modalType].confirmOverview.title}
                </span>
                <InfoNumbers
                  infoNumbers={
                    LIQUIDITY_STRINGS[modalType].confirmOverview.breakdown
                  }
                />
              </section>

              <section>
                <span className={Styles.SmallLabel}>
                  {LIQUIDITY_STRINGS[modalType].confirmReceiveOverview.title}
                </span>
                <InfoNumbers
                  infoNumbers={
                    LIQUIDITY_STRINGS[modalType].confirmReceiveOverview.breakdown
                  }
                />
              </section>
              {LIQUIDITY_STRINGS[modalType].marketLiquidityDetails && (
                <section>
                  <span className={Styles.SmallLabel}>
                    {LIQUIDITY_STRINGS[modalType].marketLiquidityDetails.title}
                  </span>
                  <InfoNumbers
                    infoNumbers={
                      LIQUIDITY_STRINGS[modalType].marketLiquidityDetails
                        .breakdown
                    }
                  />
                </section>
              )}
              <BuySellButton
                text={LIQUIDITY_STRINGS[modalType].confirmButtonText}
                action={confirmAction}
              />
              {LIQUIDITY_STRINGS[modalType].footerText && (
                <div className={Styles.FooterText}>
                  {LIQUIDITY_STRINGS[modalType].footerText}
                </div>
              )}
            </main>
          </>
        )}
    </section>
  );
};

export default ModalAddLiquidity;
