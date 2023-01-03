import React, {useEffect, useState, useCallback, useMemo} from "react";
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

import {userPoolData, emptyPoolInstrument } from "./fakedata";

const { testFullApprove, mintTestNFT,   mintCashToken ,poolBorrow, poolRepayAmount, poolAddInterest, addPoolCollateral, removePoolCollateral } = ContractCalls2;
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

let timeoutId = null;


const PoolView: React.FC = () => {
    const location = useLocation();
    const { [MARKET_ID_PARAM_NAME]: marketId } = parseQuery(location.search);
    const { vaults, instruments } = useDataStore2();
    const [ instrumentNotFound, setInstrumentNotFound ] = useState(false);

    const { actions: { setModal } } = useAppStatusStore();
    const {cashes} = useDataStore2();
    const { account, loginAccount, ramm: {poolInfos} } = useUserStore();

    const instrument = useMemo(() => instruments[marketId], [marketId, instruments]);
    const poolInfo = useMemo(() => poolInfos[marketId], [marketId, poolInfos]);
    const vault = useMemo(() => vaults[instrument?.vaultId], [instrument, vaults]);

    // console.log("instrument", instrument);
    // console.log("poolInfo", poolInfo);
    // console.log("vault", vault);


    useEffect(() => {
        if (!instrument || !poolInfo || !vault) {
          timeoutId = setTimeout(() => {
            if (!instrument && marketId) {
                setInstrumentNotFound(true);
            }
          }, 60 * 1000);
        }
    
        return () => {
          clearTimeout(timeoutId);
        };
      }, [marketId]);
    
    useEffect(() => {
    if (timeoutId && instrument && poolInfo && vault) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
    }, [instrument, poolInfo, vault]);



    const testApproveAction = async () => {
        console.log("marketId", marketId);
        await testFullApprove(account, loginAccount.library, marketId);
    }

    if (instrumentNotFound) return (<h2>
        Instrument does not exist
    </h2>);

    if (!instrument || !poolInfo || !vault) return (<h2>
        Fetching Data
    </h2>);

    // grab id from query, then get pool data from instruments
    const { 
        address: poolAddress, auctions, name,  poolLeverageFactor, totalBorrowedAssets, totalSuppliedAssets, APR, collaterals
    } = instrument;

    const borrowAction = () => {
        console.log("poolAddress", poolAddress);
        setModal({
            type: MODAL_POOL_BORROWER_ACTION,
            action: async (amount: string, afterAction: Function) => {
                let tx = await poolBorrow(
                    account,
                    loginAccount.library,
                    amount,
                    Number(vault.want.decimals),
                    poolAddress
                );
                tx.wait();
                afterAction();
            },
            isBorrow: true,
            maxValue: poolInfo.accountLiquidity, // should be borrow amount remaining.
            symbol: vault.want.symbol
        });
    };

    const repayAction = () => {
        setModal({
            type: MODAL_POOL_BORROWER_ACTION,
            action: async (amount: string, afterAction: Function) => {
                let tx = await poolRepayAmount(
                    account,
                    loginAccount.library,
                    amount,
                    Number(vault.want.decimals),
                    poolAddress,
                    vault.want.address
                );
                tx.wait();
                afterAction();
            },
            isBorrow: false,
            maxValue: poolInfo.accountLiquidity,
            symbol: vault.want.symbol
        });
    };

    const addInterestAction = () => {
        poolAddInterest(poolAddress);
    };

    

    // grab underlying asset from vaults object
    
    // const { want, name: vaultName } = vaults[marketId];
    // const {supplyBalances, walletBalances, borrowBalance, accountLiquidity} = poolInfo;
    // const {amount: borrowAmount} = borrowBalance;

    return (// first div is header
        <div className={Styles.PoolView}>
            <div>
                <button onClick={testApproveAction}>
                    test approve action
                </button>
                <h3>
                    { name }
                </h3>
                <div>
                    <ValueLabel label={"Vault"} large={true} value={vault.name + "/" + vault.want.symbol}/>
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
                            <th>Asset / TokenId</th>
                            <th>Borrow Liquidity</th>
                            <th>Max Liquidity</th>
                            <th>Supplied</th>
                            <th>Wallet</th>
                        </tr>
                    </thead>
                    <tbody>
                        { userPoolData && userPoolData.walletBalances && collaterals.length > 0? (
                            collaterals.map((asset, i) => { // className CollateralSupplyCard, error handling.
                                // console.log(asset);
                                const supplyBalance = poolInfo.supplyBalances[asset.address][asset.tokenId];
                                const walletBalance = poolInfo.walletBalances[asset.address][asset.tokenId];
                                console.log("walletBalance: ", walletBalance);
                                const { borrowAmount, maxAmount } = asset;
                                const addAction = () => {
                                    setModal({
                                        type: MODAL_POOL_COLLATERAL_ACTION,
                                        action: async (amount: string, afterAction: Function) => {
                                            addPoolCollateral(
                                                account,
                                                loginAccount.library,
                                                asset.address,
                                                asset.tokenId,
                                                amount,
                                                poolAddress,
                                                asset.isERC20,
                                                Number(asset.decimals)
                                            ).then(tx => {

                                            })
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
                                            let tx = await removePoolCollateral(
                                                account,
                                                loginAccount.library,
                                                asset.address,
                                                asset.tokenId,
                                                amount,
                                                poolAddress,
                                                Number(asset.decimals)
                                            );
                                            tx.wait();
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
                                        { asset.symbol + "/" + asset.tokenId }
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
                                        <div>
                                            <button onClick={
                                                async () => {
                                                    asset.isERC20 ? await mintCashToken(account, loginAccount.library, asset.address)
                                                    : await mintTestNFT(account, loginAccount.library, asset.tokenId, asset.address);
                                                }
                                            }>Faucet</button>
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
                    <ValueLabel label={"Remaining Borrow Liquidity"} value={"$" + poolInfo.accountLiquidity}/>
                    <ValueLabel label={"Amount Borrowed: "} value={"$" + poolInfo.borrowBalance.base}/>
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