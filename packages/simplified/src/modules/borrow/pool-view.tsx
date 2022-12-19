import React, {useEffect, useState} from "react";
import { 
    useDataStore2,
    Utils,
    Constants,
    useUserStore,
    LabelComps,
    ButtonComps,
    Icons,
    useAppStatusStore
} from "@augurproject/comps"

import { useLocation, useHistory } from "react-router";
import Styles from "./borrow-view.styles.less";
import makePath from "@augurproject/comps/build/utils/links/make-path";
import { MODAL_ADD_LIQUIDITY, MODAL_NFT_POOL_BORROW } from "@augurproject/comps/build/utils/constants";

const TokenIconMap = {
    "USDC": "../../assets/images/usdc.png",
    "DAI": "../../assets/images/dai.png",
    "ETH": "../../assets/images/eth.png",
    "FRAX": "../../assets/images/frax.png",
    "CRV": "../../assets/images/curve.png",
}

const { IconLabel, ValueLabel }  = LabelComps;
const { SecondaryThemeButton } = ButtonComps;
const { USDCIcon } = Icons
const { PathUtils: { parseQuery } } = Utils;
const { MARKET_ID_PARAM_NAME, } = Constants;

const PoolView: React.FC = () => {
    const location = useLocation();
    const { [MARKET_ID_PARAM_NAME]: marketId } = parseQuery(location.search);
    const { 
        balances: { NFTs: NFTBalances }, 
        actions: {
            updateUserNFTBalances
        } 
    } = useUserStore();
    const { vaults, instruments } = useDataStore2();

    if (instruments[marketId]) {
        const { poolData: {
            NFTs,
            APR
        }} = instruments[marketId];
        const { collateral_address } = vaults[instruments[marketId].vaultId];
        return (
            <div className={Styles.poolView}>
                <section className="supply">
                    <h3>
                        Supply
                    </h3>
                    <section className="supplyHeader">
                        {NFTs.map((nft, i) => {
                            const { symbol, address, name, APY, maxLTV } = nft;
                            const balance = !!NFTBalances && NFTBalances[address] ? NFTBalances[address].balance : "0";
                            return (
                                <CollateralSupplyCard
                                    key={i.toString() + "-" + marketId.toString()}
                                    symbol={symbol}
                                    maxLTV={maxLTV}
                                    balance={balance}
                                    APY={APY}
                                />
                            )
                        })}
                    </section>
                </section>
                <section className="borrow">
                    <h3>
                        Borrow
                    </h3>
                    <section className="borrowHeader">
                        <BorrowItemCard APR={APR} want={collateral_address} marketId={marketId}/>
                    </section>
                </section>
            </div>
        )
    }
    return <div>
        loading...
    </div>
    };

const CollateralSupplyCard: React.FC = ({
    symbol,
    maxLTV,
    balance, // balance of nft.
    APY
}): {
    symbol: string,
    address: string,
    maxLTV: string,
    balance: string,
    APY: string
} => {
    return (
        <div className={Styles.collateralSupplyCard}>
            <div className="collateral">
                <ul>
                    { symbol }
                </ul>
                <ul>
                    { APY }
                </ul>
                <ul>
                    { maxLTV }
                </ul>
                <ul>
                    { balance}
                </ul>
            </div>
        </div>
    );
}

const BorrowItemCard: React.FC = ({
    APR,
    want,
    marketId
}) => {
    const { actions: { setModal } } = useAppStatusStore();
    const {cashes} = useDataStore2();
    const USDC_addr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const USDC = cashes[USDC_addr];
    // cashes[want]
    // get icon related to want.
    const buttonProps = {
        action: () => {
            setModal({
                type: MODAL_NFT_POOL_BORROW,
                marketId
            });
        },
        text: "Borrow"
    }
    return (
        <div className={Styles.BorrowItemCard}>
            <IconLabel icon={USDCIcon} label={"USDC"} value={"USDC"} small={true}/>
            <ValueLabel label={"APR"} value={APR} />
            <SecondaryThemeButton {...buttonProps}/>
        </div>
    )
}

export default PoolView;