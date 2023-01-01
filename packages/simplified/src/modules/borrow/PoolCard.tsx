import React, {useMemo} from "react"
import Styles from "./borrow-view.styles.less";
import { Link } from "react-router-dom";
import makePath from "@augurproject/comps/build/utils/links/make-path";
import makeQuery from "@augurproject/comps/build/utils/links/make-query";
import {
    Constants,
    Components
} from "@augurproject/comps";
import { InstrumentInfos, VaultInfo, VaultInfos, PoolInstrument, Collateral } from "@augurproject/comps/build/types";

const { 
    LabelComps: {ValueLabel} 
} = Components;
const {
    MARKET_ID_PARAM_NAME
} = Constants;

export const PoolCard: React.FC = ({
    marketId,
    vaultId,
    instruments,
    vaults,
    ...props
}): {
    marketId: string,
    vaultId: string,
    instruments: InstrumentInfos,
    vaults: VaultInfos
} => {
    const instrument: PoolInstrument = useMemo(() => instruments[marketId], [marketId, instruments]);
    const vault: VaultInfo = useMemo(() => vaults[vaultId], [vaultId, vaults]);
    if (!instrument) {
        return <LoadingPoolCard/>;
    }
    const { utilizer } = instrument as PoolInstrument;


    return (
        <PoolCardView
            vault={vault}
            instrument={instrument}
            {...props}
        />
    )
}

const PoolCardView: React.FC = ({
    vault,
    instrument,
    dontGoToMarket=false
}: {
    vault: VaultInfo,
    instrument: PoolInstrument,
    dontGoToMarket?: boolean
}) => {
    const { marketId, poolLeverageFactor, collaterals, totalBorrowedAssets, totalSuppliedAssets, APR } = instrument;
    const { name: vaultName, want } = vault;

    return (<tr key={marketId}>
            <td>
                <ValueLabel value={want.symbol} label={vaultName}/>
            </td>
            <td>
                <div className={Styles.TokenList}>
                    { (collaterals && collaterals.length > 0) ?(
                    collaterals.map((collateral: Collateral) => {
                        return (
                            <div className={Styles.CollateralItem}>
                                <span>
                                    { collateral.symbol }
                                </span>
                            </div>
                        )
                    }) 
                ) : (
                    null
                )}
                </div>
            </td>
            <td>
                <span>
                    { APR }%
                </span>
            </td>
            <td>
                <span>
                    { poolLeverageFactor }
                </span>
            </td>
            <td>
                <span>
                    { totalBorrowedAssets }$
                </span>
            </td>
            <td>
                <span>
                    { totalSuppliedAssets }$
                </span>
            </td>
            
            <td>
                <div>
                <Link
                    data-testid={`link-${marketId}`}
                    to={
                        !dontGoToMarket
                        ? {
                            pathname: makePath("pool"),
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
                
            </td>
    </tr>
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