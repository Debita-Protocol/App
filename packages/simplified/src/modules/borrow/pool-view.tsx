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

//@ts-ignore
import Styles from "./pool-view.styles.less";

import makePath from "@augurproject/comps/build/utils/links/make-path";
import { MODAL_ADD_LIQUIDITY, MODAL_POOL_COLLATERAL_ACTION, MODAL_POOL_BORROWER_ACTION } from "@augurproject/comps/build/utils/constants";
import { LoadingPoolCard } from "./PoolCard";

//import {userPoolData, emptyPoolInstrument } from "./fakedata";
import {BigNumber as BN} from "bignumber.js";
import { generateTooltip } from "@augurproject/comps/build/components/common/labels";
import { TinyThemeButton } from "@augurproject/comps/build/components/common/buttons";
import { BackIcon } from "@augurproject/comps/build/components/common/icons";



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
    const history = useHistory();

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
            vault,
            instrument,
            isBorrow: true
        });
    };

    const repayAction = () => {
        setModal({
            instrument,
            vault,
            type: MODAL_POOL_BORROWER_ACTION,
            isBorrow: false 
        });
    };

    const addInterestAction = () => {
        poolAddInterest(account, loginAccount.library, poolAddress);
    };

    const { walletBalances, borrowBalance: {amount: borrowedAmount}, accountLiquidity} = poolInfo;
    const borrowCapacity =new BN(poolInfo.maxBorrowable).isZero() ? "0.0" :
    new BN(borrowedAmount).dividedBy(new BN(poolInfo.maxBorrowable)).multipliedBy(100).toString();
    

    // grab underlying asset from vaults object
    
    // const { want, name: vaultName } = vaults[marketId];
    // const {supplyBalances, walletBalances, borrowBalance, accountLiquidity} = poolInfo;
    // const {amount: borrowAmount} = borrowBalance;
    return (// first div is header
        <div className={Styles.PoolView}>
            <button onClick={() => history.push(
                {
                    pathname: makePath("borrow")
                }
            )}>{BackIcon} Back To Pools</button>
            <div>
                {/* <button onClick={testApproveAction}>
                    test approve action
                </button> */}
                <h3>
                    { name }
                </h3>
                <div>
                    <ValueLabel label={"Vault"} large={true} value={vault.name + "/" + vault.want.symbol}/>
                    <ValueLabel label={"Total Borrowed Assets"} large={true} value={"$" + totalBorrowedAssets}/>
                    <ValueLabel label={"Total Supplied Assets"} large={true} value={"$" + totalSuppliedAssets}/>
                    <ValueLabel label={"Utilization Rate"} large={true} value={ new BN(totalSuppliedAssets).isZero() ? "0.00%" : new BN(totalBorrowedAssets).dividedBy(new BN(totalSuppliedAssets)).multipliedBy(100).toFixed(2) + "%" }/>
                    
                </div>
                <TinyThemeButton small={true} text={"Accrue Interest"} action={addInterestAction}/>
                
            </div>
            <div>
                <h3>
                    Accepted Collateral
                </h3>
                <table>
                    <thead>
                        <tr>
                            <th>Asset / TokenId</th>
                            <th>
                                <span>
                                    Borrow Amount
                                </span>
                                {generateTooltip("Max loan per collateral unit", "Borrow Amount")}
                            </th>
                            <th>
                                <span>
                                    Max Amount
                                </span>
                                {generateTooltip("Liquidation threshold of asset per collateral unit", "Max Amount")}
                            </th>
                            <th>
                                <span>
                                    User Supplied Amount
                                </span>
                                {generateTooltip("Amount of collateral supplied to the pool", "user supplied amount")}
                            </th>
                            {/* <th>
                                <span>
                                    Total Supplied Amount
                                </span>
                                {generateTooltip("Amount of collateral supplied to the pool", "Supplied")}
                            </th> */}
                            <th>Wallet</th>
                        </tr>
                    </thead>
                    <tbody>
                        { collaterals.length > 0? (
                            collaterals.map((asset, i) => { // className CollateralSupplyCard, error handling.
                                // console.log(asset);
                                const supplyBalance = poolInfo.supplyBalances[asset.address][asset.tokenId];
                                const walletBalance = poolInfo.walletBalances[asset.address][asset.tokenId];
                                console.log("walletBalance: ", walletBalance);
                                const { borrowAmount, maxAmount } = asset;
                                const addAction = () => {
                                        setModal({
                                            instrument,
                                            vault,
                                            collateral:asset,
                                          type: "MODAL_POOL_COLLATERAL_ACTION",
                                          title: "Add " + asset.symbol,
                                          transactionButtonText: "Add",
                                          transactionAction: async (amount) => 
                                          {
                                            await addPoolCollateral(
                                                account, loginAccount.library, asset.addres, asset.tokenId, amount, poolAddress, asset.isERC20, Number(asset.decimals)
                                            )
                                          },
                                          targetDescription: {
                                            //market,
                                            label: "" //isMint ? "Market" : "Pool",
                                          },
                                          isAdd: true,
                                          breakdowns: [
                                                {
                                                  heading: "",
                                                  infoNumbers: [
                                                    {
                                                      label: "Collateral: ",
                                                      value: asset.symbol,                              
                                                    },
                                                  ],
                                                },
                                              ]          
                                              
                                          });
                                }
                                const removeAction = () => {
                                    setModal({
                                        collateral:asset,
                                        type: "MODAL_POOL_COLLATERAL_ACTION",
                                        title: "Withdraw " + asset.symbol,
                                        transactionButtonText: "Withdraw",
                                        instrument,
                                        vault,
                                        transactionAction: async (amount) => 
                                        {
                                            await removePoolCollateral(
                                                            account,
                                                            loginAccount.library,
                                                            asset.address,
                                                            asset.tokenId,
                                                            amount,
                                                            poolAddress,
                                                            Number(asset.decimals)
                                                        );
                                        },
                                        targetDescription: {
                                          //market,
                                          label: "" //isMint ? "Market" : "Pool",
                                        },
                                        isAdd: false,
                                        breakdowns: [
                                              {
                                                heading: "",
                                                infoNumbers: [
                                                  {
                                                    label: "Collateral: ",
                                                    value: asset.symbol,                              
                                                  },
                                                ],
                                              },
                                            ]          
                                            
                                        });
                                    // setModal({
                                    //     type: MODAL_POOL_COLLATERAL_ACTION,
                                    //     action: async (amount: string, afterAction: Function) => {
                                    //         let tx = await removePoolCollateral(
                                    //             account,
                                    //             loginAccount.library,
                                    //             asset.address,
                                    //             asset.tokenId,
                                    //             amount,
                                    //             poolAddress,
                                    //             Number(asset.decimals)
                                    //         );
                                    //         tx.wait();
                                    //         afterAction();
                                    //     },
                                    //     isAdd: false,
                                    //     maxValue: supplyBalance,
                                    //     symbol: asset.symbol,
                                    //     isERC20: asset.isERC20
                                    // });
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
                                            <TinyThemeButton text={"Add Collateral"} action={addAction}/>
                                            <TinyThemeButton text={"Remove Collateral"} action={removeAction}/>
                                        </div>
                                        {/* <div>
                                            <button onClick={
                                                async () => {
                                                    asset.isERC20 ? await mintCashToken(account, loginAccount.library, asset.address)
                                                    : await mintTestNFT(account, loginAccount.library, asset.tokenId, asset.address);
                                                }
                                            }>Faucet</button>
                                        </div> */}
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
                    Borrow { " " + vault.want.symbol}
                </h3>
                <section>
                    {/* <IconLabel icon={USDCIcon} label={"Want"} value={"USDC"} small={true}/> */}
                    <div>
                        <div>
                            <ValueLabel label={"APR"} value={APR + "%"} />
                            {generateTooltip("Rate paid by borrowers", "APR")}
                        </div>
                        <div>
                            <ValueLabel label={"Account Liquidity"} value={"$" + poolInfo.accountLiquidity}/>
                            {generateTooltip("total borrowable - debt owed", "accountLiquidity")}
                        </div>
                        <div>
                            <ValueLabel label={"Amount Borrowed: "} value={"$" + poolInfo.borrowBalance.amount}/>
                            {generateTooltip("Asset borrowed", "amountBorrowed")}
                        </div>
                        <div>
                            <ValueLabel label={"Borrow Capcity: "} value={borrowCapacity + "%"}/>
                            {generateTooltip("(amount borrowed)/(maxBorrowableAmount)", "borrowCapacity")}
                        </div>
                        <div>
                        <ValueLabel label={"Position Health: "} value={new BN(poolInfo.accountLiquidity).isGreaterThanOrEqualTo(0) ? "Healthy" : "Unhealthy"}/>
                        </div>
                    </div>
                    <section>
                        <SecondaryThemeButton small={true} text="Borrow" action={borrowAction}/>
                        <SecondaryThemeButton small={true} text={"Repay"} action={repayAction}/>
                    </section>
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