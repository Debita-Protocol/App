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

export const PoolCard: React.FC = ({
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
    if (!instrument) {
        return <LoadingPoolCard/>;
    }
    const { vaultId, utilizer, poolData: {leverageFactor} } = instrument;
    const collateral = vaults[vaultId].collateral_address;
    return (
        <PoolCardView
            marketId={marketId}
            vaultId={vaultId}
            utilizer={utilizer}
            collateral={collateral}
            leverageFactor={leverageFactor}
            {...props}
        />
    )
}

const PoolCardView: React.FC = ({
    marketId,
    vaultId,
    utilizer,
    collateral,
    leverageFactor,
    dontGoToMarket=false
}: {
    marketId: string,
    vaultId: string,
    utilizer: string,
    collateral: string,
    leverageFactor: string,
    dontGoToMarket?: boolean
}) => {

    return (
        <div className={Styles.PoolCardView}>
            <div className={"SelectButton"}>
                <Link
                    data-testid={`link-${marketId}`}
                    to={
                        !dontGoToMarket
                        ? {
                            pathname: makePath(marketId),
                            search: makeQuery({
                                [MARKET_ID_PARAM_NAME]: marketId,
                            }),
                            }
                            : null
                        }
                >
                    Select
                </Link>
            </div>
            <ValueLabel 
                label="Market Id"
                value={marketId}
            />
            <ValueLabel
                label="Vault Id"
                value={vaultId}
            />
            <ValueLabel
                label="Utilizer"
                value={utilizer}
            />
            <ValueLabel
                label="Collateral"
                value={collateral}
            />
            <ValueLabel
                label="Leverage Factor"
                value={leverageFactor}
            />
        </div>
    )
}

export const LoadingPoolCard = () => {
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