import React, { useMemo } from "react"

// @ts-ignore
import Styles from "./borrow-view.styles.less";

import { Link } from "react-router-dom";
import makePath from "@augurproject/comps/build/utils/links/make-path";
import makeQuery from "@augurproject/comps/build/utils/links/make-query";
import { useHistory } from "react-router";
import {
    Constants,
    Components
} from "@augurproject/comps";
import { InstrumentInfos, VaultInfo, VaultInfos, PoolInstrument, Collateral } from "@augurproject/comps/build/types";
import {BigNumber as BN} from "bignumber.js";
import { handleValue } from "modules/common/labels";

const {
    LabelComps: { ValueLabel }
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
        return <LoadingPoolCard />;
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
    dontGoToMarket = false,
    key
}: {
    vault: VaultInfo,
    instrument: PoolInstrument,
    dontGoToMarket?: boolean,
    key: string
}) => {
    const { marketId, poolLeverageFactor, collaterals, totalBorrowedAssets, totalSuppliedAssets, APR, name } = instrument;
    const { name: vaultName, want } = vault;
    const history = useHistory();

    return (<tr key={key} onClick={() => {
        history.push({
            pathname: makePath("pool"),
            search: makeQuery({
                [MARKET_ID_PARAM_NAME]: marketId
            }),
        })
    }}>
        <td>
            <ValueLabel value={name} label={""} />
        </td>
        <td>
            <ValueLabel value={want.symbol} label={vaultName} />
        </td>
        <td>
            <div className={Styles.TokenList} key={key}>
                {(collaterals && collaterals.length > 0) ? (
                    collaterals.map((collateral: Collateral) => {
                        return (
                            <div className={Styles.CollateralItem}>
                                <span>
                                    {collateral.symbol}
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
                {APR}%
            </span>
        </td>
        <td>
            <span>
                { new BN(totalSuppliedAssets).isZero() ? "0.00" : new BN(totalBorrowedAssets).dividedBy(new BN(totalSuppliedAssets)).multipliedBy(100).toFixed(2) }%
            </span>
        </td>
        <td>
            <span>
                {handleValue(totalBorrowedAssets)}
            </span>
        </td>
        <td>
            <span>
                {handleValue(totalSuppliedAssets)}
            </span>
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