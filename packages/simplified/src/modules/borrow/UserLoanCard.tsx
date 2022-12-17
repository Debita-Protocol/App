import React, {useMemo} from "react"
import Styles from "./borrow-view.styles.less";
import { Link } from "react-router-dom";
import makePath from "@augurproject/comps/build/utils/links/make-path";
import makeQuery from "@augurproject/comps/build/utils/links/make-query";
import {
    Constants,
    Components
} from "@augurproject/comps";
import { InstrumentInfos, CoreInstrumentData, VaultInfos } from "@augurproject/comps/build/types";

const { 
    LabelComps: {ValueLabel} 
} = Components;
const {
    MARKET_ID_PARAM_NAME
} = Constants;

export const UserLoanCard: React.FC = ({
    marketId,
    instruments,
    vaults,
    ...props
}): {
    marketId: string,
    instruments: InstrumentInfos,
    vaults: VaultInfos
} => {
    const instrument: CoreInstrumentData = useMemo(() => instruments[marketId], [marketId, instruments]);
    const { 
        vaultId , 
        isPool,
        trusted,
        balance,
        principal,
        faceValue,
        duration
    } = instrument;
    const collateral = vaults[vaultId].collateral_address;
    if (!instrument) {
        return <LoadingUserLoanCard/>;
    }
    return (
        <UserLoanCardView
            marketId={marketId}
            vaultId={vaultId}
            collateral={collateral}
            isPool={isPool}
            trusted={trusted}
            balance={balance}
            principal={principal}
            faceValue={faceValue}
            duration={duration}
            {...props}
        />
    )
}

const UserLoanCardView: React.FC = ({
    marketId,
    vaultId , 
    collateral,
    isPool,
    trusted,
    balance,
    principal,
    faceValue,
    duration,
    dontGoToMarket=false
}: {
    marketId: string,
    vaultId: string,
    collateral: string,
    isPool: boolean,
    trusted: boolean,
    balance: string,
    principal: string,
    faceValue: string,
    duration: string,
    dontGoToMarket?: boolean
}) => {

    return (
        <div className={Styles.userLoanCardView}>
            <ValueLabel 
                label="Market Id"
                value={marketId}
            />
            <ValueLabel
                label="Vault Id"
                value={vaultId}
            />
            <ValueLabel
                label="Collateral"
                value={collateral}
            />
        </div>
    )
}

export const LoadingUserLoanCard = () => {
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