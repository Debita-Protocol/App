import React, {useMemo} from "react"

// @ts-ignore
import Styles from "./borrow-view.styles.less";

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

import { InstrumentInfos, CoreInstrumentData, VaultInfos, VaultInfo } from "@augurproject/comps/build/types";
//import { MODAL_NFT_POOL_ACTION } from "@augurproject/comps/build/utils/constants";
import { USDCIcon } from "@augurproject/comps/build/components/common/icons";
import { BaseInstrument } from "@augurproject/comps/build/types";
import { MODAL_POOL_BORROWER_ACTION } from "modules/constants";
import { TinyThemeButton } from "@augurproject/comps/build/components/common/buttons";
import { SelectOutcomeButton } from "modules/common/charts";
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
        vault
    }: { instrument: BaseInstrument, vault: VaultInfo}
) => {
    const { account, loginAccount, actions: { addTransaction } } = useUserStore();
    const {
        address,
        name,
        trusted,
        balance,
        expectedYield,
        principal,
        duration,
        maturityDate,
        exposurePercentage,
        description
    } = instrument;
    const { actions: { setModal } } = useAppStatusStore();
    const { cashes } = useDataStore2();

    //TODO: get this from somewhere instead of assuming USDC => should be want
    const borrowAction = async () => {
        let tx = borrowCreditlineInstrument(
            account, 
            loginAccount.library, 
            address
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

    const repayAction = () => {
        setModal({
            type: "MODAL_CREDITLINE_REPAY",
            instrument: instrument,
            collateral: vault.want,
            transactionAction: async (amount: string, afterAction: Function) => {
                let tx = await repayCreditlineInstrument(
                    account, 
                    loginAccount.library, 
                    address,
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
            isBorrow: false,
            maxValue: new BN(principal).plus(new BN(expectedYield)).minus(new BN(balance)).toString(), // should be borrow amount remaining.
            symbol: vault.want.symbol
        });
    };


    // get Date Object from maturityDate which is in seconds since 1970 Janurary 1



    return (
        <div className={Styles.LoanCard}>
            <div>
                <span>
                    {vault.name}
                </span>
                /
                <span>
                { name }
                </span>
            </div>
            <section>
                <ValueLabel label="Notional Interest" value={expectedYield}/>
                <ValueLabel label="Principal" value={principal}/>
                <ValueLabel label="Duration" value={ new BN(duration).dividedBy(24*60*60).toFixed(4) + " days"}/>
                {trusted && (
                    <ValueLabel label="Maturity Date" value={new Date(new BN(maturityDate).multipliedBy(1000).toNumber()).toISOString().substring(0,10)}/>
                )}
                <div>
                    <span>
                        Trusted: 
                    </span>
                    <span>
                        { trusted ? "Yes"  : "No (can use checkbox icon here)"}
                    </span>
                </div>
                
                
            </section>
                {trusted && (
                    <div className= {Styles.LoanCardButtons}>
                        <SecondaryThemeButton text="borrow" action={borrowAction}/>
                        <SecondaryThemeButton text="repay" action={repayAction}/>
                    </div>
                )}
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