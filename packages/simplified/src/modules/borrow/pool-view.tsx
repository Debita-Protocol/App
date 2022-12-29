import React, {useEffect, useState} from "react";
import { 
    useDataStore2,
    Utils,
    Constants,
    useUserStore,
    LabelComps,
    ButtonComps,
    Icons,
    useAppStatusStore,
    ContractCalls2
} from "@augurproject/comps"

import { useLocation, useHistory } from "react-router";
import Styles from "./pool-view.styles.less";
import makePath from "@augurproject/comps/build/utils/links/make-path";
import { MODAL_ADD_LIQUIDITY, MODAL_POOL_COLLATERAL_ACTION, MODAL_POOL_BORROWER_ACTION } from "@augurproject/comps/build/utils/constants";
import { LoadingPoolCard } from "./PoolCard";

import {vaults, instruments, userPoolData, emptyPoolInstrument } from "./fakedata";

const { poolBorrow, poolRepay, poolAddInterest, addPoolCollateral, removePoolCollateral } = ContractCalls2;
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
    // const { vaults, instruments } = useDataStore2();
    const [loading, setLoading] = useState(true);

    const { actions: { setModal } } = useAppStatusStore();
    const {cashes} = useDataStore2();
    
    // get user pool data, based on marketId + instrument_address.
    const {supplyBalances, walletBalances, borrowBalance, accountLiquidity, remainingBorrowAmount} = userPoolData;
    const {amount: borrowAmount} = borrowBalance;


    // grab id from query, then get pool data from instruments
    const { 
        address: poolAddress, auctions, name,  poolLeverageFactor, totalBorrowedAssets, totalSuppliedAssets, APR, collaterals
    } = emptyPoolInstrument;

    // grab underlying asset from vaults object
    const { want, name: vaultName } = vaults[marketId];

    useEffect(() => {
        if (Object.keys(vaults).length > 0 &&
            Object.keys(instruments).length > 0
        ) {
            setLoading(false);
        }
    }, [vaults, instruments]);
    
    if (loading) {
        return (
            <div>
            <LoadingPoolCard />
            </div>
        )
    }

    const borrowAction = () => {
        setModal({
            type: MODAL_POOL_BORROWER_ACTION,
            action: async (amount: string, afterAction: Function) => {
                let tx = await poolBorrow(
                    amount,
                    want.decimals,
                    poolAddress
                );
                tx.wait();
                afterAction();
            },
            isAdd: true,
            maxValue: remainingBorrowAmount,
            symbol: want.symbol
        });
    };

    const repayAction = () => {
        setModal({
            type: MODAL_POOL_BORROWER_ACTION,
            action: async (amount: string, afterAction: Function) => {
                let tx = await poolRepay(
                    amount,
                    want.decimals,
                    poolAddress
                );
                tx.wait();
                afterAction();
            },
            isAdd: false,
            maxValue: borrowAmount,
            symbol: want.symbol
        });
    };

    const addInterestAction = () => {
        poolAddInterest(poolAddress);
    };


    return (// first div is header
        <div className={Styles.PoolView}>
            <div>
                <h3>
                    { name }
                </h3>
                <div>
                    <ValueLabel label={"Vault"} large={true} value={vaultName + "/" + want.symbol}/>
                    <ValueLabel label={"Total Borrowed Assets"} large={true} value={"$" + totalBorrowedAssets}/>
                    <ValueLabel label={"Total Supplied Assets"} large={true} value={"$" + totalSuppliedAssets}/>
                    <ValueLabel label={"Pool Leverage Factor"} large={true} value={poolLeverageFactor}/>
                </div>
                
            </div>
            <div>
                <h3>
                    Supply
                </h3>
                <table>
                    <thead>
                        <tr>
                            <th>Asset</th>
                            <th>Borrow Liquidity</th>
                            <th>Max Liquidity</th>
                            <th>Supplied</th>
                            <th>Wallet</th>
                        </tr>
                    </thead>
                    <tbody>
                        { userPoolData && userPoolData.walletBalances && collaterals.length > 0? (
                            collaterals.map((asset, i) => { // className CollateralSupplyCard, error handling.
                                console.log(asset);
                                const supplyBalance = supplyBalances[asset.address][asset.tokenId];
                                const walletBalance = walletBalances[asset.address][asset.tokenId];
                                const { borrowAmount, maxAmount } = asset;
                                const addAction = () => {
                                    setModal({
                                        type: MODAL_POOL_COLLATERAL_ACTION,
                                        action: async (amount: string, afterAction: Function) => {
                                            // let tx = await addPoolCollateral(
                                            //     asset.address,
                                            //     asset.tokenId,
                                            //     amount,
                                            //     poolAddress,
                                            //     asset.isERC20,
                                            //     asset.decimals
                                            // );
                                            // tx.wait();
                                            afterAction();
                                        },
                                        isAdd: true,
                                        maxValue: walletBalance,
                                        symbol: asset.symbol,
                                        isERC20: asset.isERC20
                                    });
                                }
                                const removeAction = () => {
                                    setModal({
                                        type: MODAL_POOL_COLLATERAL_ACTION,
                                        action: async (amount: string, afterAction: Function) => {
                                            // let tx = await removePoolCollateral(
                                            //     asset.address,
                                            //     asset.tokenId,
                                            //     amount,
                                            //     poolAddress,
                                            //     asset.decimals
                                            // );
                                            // tx.wait();
                                            afterAction();
                                        },
                                        isAdd: false,
                                        maxValue: supplyBalance,
                                        symbol: asset.symbol,
                                        isERC20: asset.isERC20
                                    });
                                }

                                return (<tr>
                                    <td>
                                        {/* <img src={TokenIconMap[asset.symbol]} /> */}
                                        { asset.symbol }
                                    </td>
                                    <td>
                                        ${ borrowAmount }
                                    </td>
                                    <td>
                                        ${ maxAmount }
                                    </td>
                                    <td>
                                        ${ supplyBalance }
                                    </td>
                                    <td>
                                        ${ walletBalance }
                                    </td>
                                    <td>
                                        <div>
                                            <SecondaryThemeButton small={true} text={"+"} action={addAction}/>
                                            <SecondaryThemeButton small={true} text={"-"} action={removeAction}/>
                                        </div>
                                    </td>
                                </tr>)
                            })
                        ) : (
                            <div>
                                loading...
                            </div>
                        )
                        }
                    </tbody>
                    
                </table>
                
            </div>
            <div>
                <h3>
                    Borrow
                </h3>
                <section>
                    {/* <IconLabel icon={USDCIcon} label={"Want"} value={"USDC"} small={true}/> */}
                    <ValueLabel label={"APR"} value={APR + "%"} />
                    <ValueLabel label={"Remaining Borrow Liquidity"} value={"$" + accountLiquidity}/>
                    <ValueLabel label={"Amount Borrowed: "} value={"$" + borrowAmount}/>
                    <div>
                        <SecondaryThemeButton small={true} text="Borrow" action={borrowAction}/>
                        <SecondaryThemeButton small={true} text={"Repay"} action={repayAction}/>
                        <SecondaryThemeButton small={true} text={"Accrue Interest"} action={addInterestAction}/>
                    </div>
                </section>
            </div>
            {/* <div>
                <h3>
                    Auctions
                </h3>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Current Price</th>
                            <th>Start Time</th>
                            <th>Collateral</th>
                            <th>Wallet</th>
                        </tr>
                    </thead>
                    <tbody>
                        { auctions.length > 0 &&
                            auctions.map((auction, i) => {
                                const {currentPrice, tokenId, startTime, tokenAddress} = auction;
                                return (
                                    <tr>
                                        <td>
                                            {}
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                    
                </table>
            </div> */}
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
        <tr>
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


export default PoolView;