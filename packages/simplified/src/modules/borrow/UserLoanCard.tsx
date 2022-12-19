import React, {useMemo} from "react"
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
    LabelComps
} from "@augurproject/comps";
import { InstrumentInfos, CoreInstrumentData, VaultInfos } from "@augurproject/comps/build/types";
import { MODAL_NFT_POOL_ACTION } from "@augurproject/comps/build/utils/constants";
import { USDCIcon } from "@augurproject/comps/build/components/common/icons";

const {
    SecondaryThemeButton
} = ButtonComps;
const { 
    LabelComps: {ValueLabel, IconLabel} 
} = Components;
const {
    MARKET_ID_PARAM_NAME
} = Constants;

// how much borrowed from pool atm, what pool, what type of collateral, repay button
// pool (instrument) description, APR, user balance of collateral.
export const LoanCard: React.FC = (
    {
        borrow_balance="0",
        want_balance="0",
        pool_description="Pool 1",
        pool_address,
        want="0xC9a5FfC14d68c511e83E758d186C249580d5f111",
        APR="0.5",
        icon=USDCIcon // of want
    }
) => {
    const { actions: { setModal } } = useAppStatusStore();
    const { cashes } = useDataStore2();
    //TODO: get this from somewhere instead of assuming USDC => should be want
    const USDC = cashes[want];
    const buttonProps ={
        text: "Repay",
        action: () => {
            setModal({
                type: MODAL_NFT_POOL_ACTION,
                buttonText: "repay",
                buttonAction: () => {
                    console.log("repay");
                },
                asset: USDC
            })
        },

    }

    return (
        <div className={Styles.LoanCard}>
            <div>
                { pool_description }
            </div>
            <section>
                <div>
                    <span>{"Want"}</span>
                    <span>{icon}</span>
                    <span>{USDC.name}</span>
                </div>
                <ValueLabel label="Borrowed Amount" value={borrow_balance}/>
                <ValueLabel label="Balance" value={want_balance}/>
                <ValueLabel label="APR" value={APR}/>
            </section>
            <SecondaryThemeButton {...buttonProps}/>
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