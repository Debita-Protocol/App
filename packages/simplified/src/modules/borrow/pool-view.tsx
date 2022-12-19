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
import { MODAL_ADD_LIQUIDITY, MODAL_NFT_POOL_BORROW, MODAL_NFT_POOL_ACTION } from "@augurproject/comps/build/utils/constants";
import { LoadingPoolCard } from "./PoolCard";

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
    } = useUserStore();
    const { vaults, instruments } = useDataStore2();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (Object.keys(vaults).length > 0 &&
            Object.keys(instruments).length > 0 &&
            Object.keys(NFTBalances).length > 0
        ) {
            setLoading(false);
        }
    }, [vaults, instruments, NFTBalances]);
    if (loading) {
        return (
            <div>
            <LoadingPoolCard />
            </div>
        )
    }

    const { poolData: {
        NFTs,
        APR
    }} = instruments[marketId];
    const { collateral_address } = vaults[instruments[marketId].vaultId];
    

    return (
        <div className={Styles.poolView}>
            <section>
                <h3>
                    Supply
                </h3>
                <table>
                    <thead>
                        <tr>
                            <td>Asset/LTV</td>
                            <td>APY</td>
                            <td>Wallet</td>
                        </tr>
                    </thead>
                    <tbody>
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
                    </tbody>
                    
                </table>
            </section>
            <section>
                <h3>
                    Borrow
                </h3>
                <section className="borrowHeader">
                    <BorrowItemCard APR={APR} want={collateral_address} marketId={marketId}/>
                </section>
            </section>
        </div>
    )
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
        <tr className={Styles.collateralSupplyCard}>
            <td>
                { symbol }/{ maxLTV }
            </td>
            <td>
                { APY }
            </td>
            <td>
                { balance }
            </td>
        </tr>
    );
}

const BorrowItemCard: React.FC = ({
    APR,
    want,
    marketId
}) => {
    const { actions: { setModal } } = useAppStatusStore();
    const {cashes} = useDataStore2();
    //TODO: get this from somewhere instead of assuming USDC
    const USDC_addr = "0xC9a5FfC14d68c511e83E758d186C249580d5f111";
    const USDC = cashes[USDC_addr];
    // cashes[want]
    // get icon related to want.
    const buttonProps = {
        action: () => {
            setModal({
                type: MODAL_NFT_POOL_ACTION,
                buttonAction: () => {},
                buttonText: "borrow",
                asset: USDC
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