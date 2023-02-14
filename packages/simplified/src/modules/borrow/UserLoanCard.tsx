import React, {useMemo} from "react"

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
        address,
        name,
        trusted,
        balance,
        expectedYield,
        principal,
        duration,
        maturityDate,
        exposurePercentage,
        description,
        collateralType,
        interestRepaid,
        principalRepaid
    } = instrument;
    let { approvedPrincipal, approvedYield } = market;

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

    // trusted = true;
    // approvedPrincipal = "100"
    // approvedYield = "100"

    const depositAction = () => {
      // TODO: deposit action
    }

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
              </div>
              {(collateralType == 0 || collateralType == 1) && <div>
                <CollateralCard />
              </div>}
            </section>) : (
              <section>
                <div>
                  <div>
                    <ValueLabel label="Principal Repayed" value={approvedPrincipal + "/" + principal}/>
                    <VerticalFill />
                  </div>
                  <div>
                    <ValueLabel label="Interest Repayed" value={approvedPrincipal + "/" + principal}/>
                    <VerticalFill />
                  </div>
                </div>
                
                <div>
                  <div>
                    <ValueLabel label="Expires In" value={moment().add(duration, "seconds").fromNow(true)}/>
                  </div>
                  <div>
                  <TinyThemeButton text={"Borrow"} action={borrowAction} />
                  <TinyThemeButton text={"Repay"} action={repayAction} />
                  <TinyThemeButton text={"Deposit"} action={depositAction} />
                  </div>
                </div>
              </section>
            )}
            <InstrumentStatusSlider market={market} instrument={instrument}/>
            </div>
    )
}

const CollateralCard: React.FC = (

) => {
  return (
    <div>
      <h3>
        Collateral
      </h3>
      <ExternalLink label={"Block Explorer"} icon={true} URL={"https://mumbai.polygonscan.com/address/" + "0x2C7Cb3cB22Ba9B322af60747017acb06deB10933"}/>
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