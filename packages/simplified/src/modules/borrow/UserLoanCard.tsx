import React, {useMemo, useState, useEffect, useCallback} from "react"

// @ts-ignore
import Styles from "./borrow-view.styles.less";
import classNames from "classnames";

import { Link } from "react-router-dom";
import makePath from "@augurproject/comps/build/utils/links/make-path";
import makeQuery from "@augurproject/comps/build/utils/links/make-query";
import {
    Constants,
    Components,
    Stores,
    useAppStatusStore,
    useDataStore2,
    ButtonComps,
    ContractCalls2,
    LabelComps,
    useUserStore,
    Icons
} from "@augurproject/comps";
import { BigNumber as BN } from "bignumber.js";

import { InstrumentInfos, CoreInstrumentData, VaultInfos, VaultInfo, CoreMarketInfo, Instrument, CreditlineInstrument } from "@augurproject/comps/build/types";
//import { MODAL_NFT_POOL_ACTION } from "@augurproject/comps/build/utils/constants";
import { USDCIcon } from "@augurproject/comps/build/components/common/icons";
import { BaseInstrument } from "@augurproject/comps/build/types";
import { MODAL_POOL_BORROWER_ACTION } from "modules/constants";
import { TinyThemeButton } from "@augurproject/comps/build/components/common/buttons";
import { SelectOutcomeButton } from "modules/common/charts";
import { InstrumentStatusSlider, VerticalFill } from "modules/common/slider";
import { ExternalLink } from "@augurproject/comps/build/utils/links/links";
import { handleValue } from "modules/common/labels";
import moment from "moment";
import { CheckLabel, InstrumentStatusLabel } from "modules/market/market-view";
import { getMarketStage, getMarketStageLabel, MarketStage } from "utils/helpers";
import { creditlineDeposit, fetchERC20Symbol, getERC20Balance } from "@augurproject/comps/build/utils/contract-calls-new";
import { CreditlineCollateralCard } from "modules/liquidity/liquidity-view";
import { ERC20 } from "@augurproject/smart";
import { approveERC20 } from "@augurproject/comps/build/utils/contract-calls-new";
const { Checkbox } = Icons;
const {
    BUY,
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



const {
    SecondaryThemeButton
} = ButtonComps;
const { 
    LabelComps: {ValueLabel, IconLabel} 
} = Components;
const {
    MARKET_ID_PARAM_NAME
} = Constants;

const {
    borrowCreditlineInstrument, repayCreditlineInstrument
} = ContractCalls2;

// how much borrowed from pool atm, what pool, what type of collateral, repay button
// pool (instrument) description, APR, user balance of collateral.
export const LoanCard: React.FC = (
    {
        instrument,
        vault,
        market
    }: { instrument: CreditlineInstrument, vault: VaultInfo, market: CoreMarketInfo}
) => {
    const { account, loginAccount, actions: { addTransaction } } = useUserStore();
    let {
        address: instrumentAddress,
        name,
        trusted,
        balance,
        expectedYield,
        principal,
        duration,
        loanStatus,
        collateralType,
        interestRepaid,
        principalRepaid,
        collateral,
        collateralBalance
    } = instrument;

    console.log("collateralType: ", collateralType, market.marketId)
    let { approvedPrincipal, approvedYield, duringAssessment } = market;

    let underlyingSymbol = vault?.want?.symbol;
    let totalOwed = instrument?.totalOwed;

    

    const { actions: { setModal } } = useAppStatusStore();
    const { cashes } = useDataStore2();

    //TODO: get this from somewhere instead of assuming USDC => should be want
    const borrowAction = async () => {
        let tx = borrowCreditlineInstrument(
            account, 
            loginAccount.library, 
            instrumentAddress
        ).then((response) => {
            const { hash } = response;
            addTransaction({
              hash,
              chainId: loginAccount.chainId,
              seen: false,
              status: TX_STATUS.PENDING,
              from: account,
              addedTime: new Date().getTime(),
              message: `Creditline Drawdown`,
              marketDescription: `${instrument?.name} ${instrument?.description}`,
            });
          })
          .catch((error) => {
            addTransaction({
              hash: "remove-liquidity-failed",
              chainId: loginAccount.chainId,
              seen: false,
              status: TX_STATUS.FAILURE,
              from: account,
              addedTime: new Date().getTime(),
              message: `Creditline Drawdown`,
              marketDescription: `${instrument?.name} ${instrument?.description}`,
            });
          });
    };

    console.log("totalOwed: ", totalOwed, principalRepaid, interestRepaid);

    const repayAction = () => {
        setModal({
            type: "MODAL_CREDITLINE_REPAY",
            instrument: instrument,
            collateral: vault.want,
            transactionAction: async (amount: string, afterAction: Function) => {
                let tx = await repayCreditlineInstrument(
                    account, 
                    loginAccount.library, 
                    instrumentAddress,
                    vault.want.address,
                    amount
                ).then((response) => {
                    const { hash } = response;
                    addTransaction({
                      hash,
                      chainId: loginAccount.chainId,
                      seen: false,
                      status: TX_STATUS.PENDING,
                      from: account,
                      addedTime: new Date().getTime(),
                      message: `Creditline Repay`,
                      marketDescription: `${instrument?.name} ${instrument?.description}`,
                    });
                  })
                  .catch((error) => {
                    addTransaction({
                      hash: "remove-liquidity-failed",
                      chainId: loginAccount.chainId,
                      seen: false,
                      status: TX_STATUS.FAILURE,
                      from: account,
                      addedTime: new Date().getTime(),
                      message: `Creditline Repay`,
                      marketDescription: `${instrument?.name} ${instrument?.description}`,
                    });
                  });
            },
            breakdowns: [
              {
                heading: "",
                infoNumbers: [
                  {
                    label: "Total Owed",
                    value: handleValue(String(Number(approvedPrincipal) + Number(approvedYield)), underlyingSymbol)
                  }
                ]
              }
            ],
            isBorrow: false,
            maxValue: String(Number(approvedPrincipal) + Number(approvedYield) - Number(principalRepaid) - Number(interestRepaid)), // should be borrow amount remaining.
            symbol: vault.want.symbol
        });
    };

    // trusted = true;
    // approvedPrincipal = "100"
    // approvedYield = "100"
    /**
     * 
     * should be able to deposit, borrow, repay.
     * 
     * deposit -> if isntrument approval condition not met
     * borrow -> can if loan status not there yet
     * repay -> can if loan status.
     */

    const [canDeposit, setCanDeposit] = useState(false);

    useEffect(() => {
      async function load () {
        let _balance = await getERC20Balance(account, loginAccount.library, collateral, instrumentAddress)
        if (duringAssessment && Number(_balance) < Number(collateralBalance) && Number(collateralType) == 0) {
          setCanDeposit(true);
        }
      }
      if (account && loginAccount && collateral && instrumentAddress && collateralType === 0 ) {
        load()
      }
    }, [account, loginAccount, collateral, collateralBalance, collateralType, instrumentAddress])

    const depositAction = useCallback(async () => {
      if (account && loginAccount && collateral && collateralBalance) {
        let tx = await approveERC20(account, loginAccount.library, collateral, collateralBalance, instrumentAddress);
        addTransaction({
          hash: tx.hash,
          chainId: loginAccount.chainId,
          seen: false,
          status: TX_STATUS.PENDING,
          from: account,
          addedTime: new Date().getTime(),
          message: `Approve Collateral`,
          marketDescription: `${instrument?.name} ${instrument?.description}`,
        })

        await tx.wait();

        tx = await creditlineDeposit(account, loginAccount.library, instrumentAddress, collateralBalance);
        addTransaction({
          hash: tx.hash,
          chainId: loginAccount.chainId,
          seen: false,
          status: TX_STATUS.PENDING,
          from: account,
          addedTime: new Date().getTime(),
          message: `Deposit Collateral`,
          marketDescription: `${instrument?.name} ${instrument?.description}`
        })
      }
    }, [account, loginAccount, collateral, collateralBalance, instrumentAddress])

    let collateralTypeWord
    switch (collateralType) {
      case (0):
        collateralTypeWord = "Liquid"
        break;
      case (1):
        collateralTypeWord = "Nonliquid"
        break;
      case (2):
        collateralTypeWord = "Smart Contract"
        break;
      case (3):
        collateralTypeWord = "Uncollateralized"
        break;
    }

    const marketStage = getMarketStage(market);

    const canBorrow = marketStage === MarketStage.APPROVED && Number(totalOwed) > 0;
    const canRepay = marketStage === MarketStage.APPROVED && Number()

    return (
        <div className={classNames(Styles.LoanCard, {
          [Styles.Trusted]: trusted,
        })}>
            <div>
                <span>
                  {name}
                </span>
                <span>
                  {vault.name}
                </span>
            </div>
            {!trusted ? (<section>
              <div>
                <ValueLabel label="Proposed Principal" value={handleValue(principal, vault.want.name)}/>
                <ValueLabel label="Proposed Interest" value={handleValue(expectedYield, vault.want.name)}/>
                <ValueLabel label="Duration" value={ new BN(duration).dividedBy(24*60*60).toFixed(4) + " days"}/>
                <ValueLabel label="Collateral Type" value={collateralTypeWord}/>
                <ValueLabel label="Instrument Status" value={getMarketStageLabel(market)}/>
                {Number(collateralType) === 0 && (canDeposit ? <button onClick={depositAction}>Deposit</button>
                : (
                  <CheckLabel label={"Deposited"}/>
                ))
                }
              </div>
              {/* <button onClick={depositAction}>Deposit</button> */}
            </section>) : (
              <section>
                <div>
                  <ValueLabel label="Principal Repayed" value={principalRepaid + "/" + handleValue(approvedPrincipal,underlyingSymbol)}/>
                  <ValueLabel label="Interest Repayed" value={interestRepaid + "/" + handleValue(approvedYield,underlyingSymbol)}/>
                  <ValueLabel label="Instrument Status" value={getMarketStageLabel(market)}/>
                  <ValueLabel label="Expires In" value={moment().add(duration, "seconds").fromNow(true)}/>
                  {canBorrow ? <button onClick={borrowAction}>Borrow</button> :(
                    <CheckLabel label={"Borrowed"}/>
                  )}
                  <button onClick={repayAction}>Repay</button>
                </div>
              </section>
            )}
            <div>
          
            </div>
            {(collateralType == 0 || collateralType == 1) && <div>
                <CreditlineCollateralCard instrument={instrument} height={60} width={60} />
              </div>}
            </div>
    )
}

// collateral: string;
//   collateralBalance: string;
//   oracle: string;
//   loanStatus: number;
//   collateralType: number;
//   principalRepaid: string;
//   interestRepaid: string;
//   totalOwed: string;
const CollateralCard: React.FC = (
  {
    instrument
  }: {
    instrument: CreditlineInstrument
  }
) => {
  const { account, loginAccount } = useUserStore();
  const collateral = instrument?.collateral;
  const [symbol, setSymbol] = useState("")

  useEffect(() => {

    async function load() {
      const _symbol = await fetchERC20Symbol(account, loginAccount.library, collateral);
        setSymbol(_symbol);
        
    
    }

    if (account && loginAccount && collateral) {
      load();
    }
  }, [account, loginAccount, collateral])

  const collateralBalance = instrument?.collateralBalance;

  return (
    <div>
      <h3>
        Collateral
      </h3>

      <ExternalLink label={"Block Explorer"} icon={true} URL={"https://mumbai.polygonscan.com/address/" + collateral}/>
    </div>
  )
}

export const LoadingLoanCard = () => {
    return (
      <article className={Styles.LoadingMarketCard}>
        <div>
          <div />
          <div />
          <div />
        </div>
        <div>
          <div />
          <div />
          <div />
        </div>
        <div>
          <div />
          <div />
          <div />
        </div>
      </article>
    );
  };