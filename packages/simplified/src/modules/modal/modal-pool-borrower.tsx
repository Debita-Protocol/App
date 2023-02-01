import React, { useState, useEffect, useCallback } from "react";
import { ContractCalls2, useDataStore2, useAppStatusStore, InputComps, Icons, ButtonComps, LabelComps, useUserStore } from "@augurproject/comps";
// @ts-ignore
import Styles from "./modal.styles.less";
import { USDCIcon } from "@augurproject/comps/build/components/common/icons";
import { assertType } from "graphql";
import { Header } from "./common";
import { PoolInstrument, UserPoolInfo, VaultInfo } from "@augurproject/comps/build/types";
import { WatchIgnorePlugin } from "webpack";
import { SmallDropdown, SquareDropdown } from "@augurproject/comps/build/components/common/selection";
import {BigNumber as BN} from "bignumber.js";
import { generateTooltip } from "@augurproject/comps/build/components/common/labels";
import { useApproveCallback } from "@augurproject/comps/build/stores/use-approval-callback";
import { constants } from "ethers";

import { Constants } from "@augurproject/comps";
const {
    BUY,
    ApprovalAction,
    ApprovalState,
    ERROR_AMOUNT,
    CONNECT_ACCOUNT,
    ENTER_AMOUNT,
    INSUFFICIENT_BALANCE,
    ZERO,
    SET_PRICES,
    MINT_SETS,
    RESET_PRICES,
    ONE,
    INVALID_PRICE,
    INVALID_PRICE_GREATER_THAN_SUBTEXT,
    INVALID_PRICE_ADD_UP_SUBTEXT,
    TX_STATUS,
  } = Constants;

const {ModalAmountInput} = InputComps;
const {CloseIcon} = Icons;
const {PrimaryThemeButton} = ButtonComps;
const {ValueLabel} = LabelComps;
const { poolRepayAmount, poolBorrow, isERC20ApprovedSpender, useIsERC721ApprovedSpender, approveERC20, approveERC721 } = ContractCalls2;


const ModalPoolBorrowerAction = (
    {
        closeModal,
        isBorrow,
        vault,
        instrument
        // action,
        // symbol,
        // maxValue
    }
    : {
        closeModal: Function,
        isBorrow: boolean,
        vault: VaultInfo,
        instrument: PoolInstrument
        // action: Function,
        // symbol: string, // collatarel symbol
        // maxValue?: string,
    }
) => {
    // if erc20 then approve is different. different abis.
    // can create wrapper function that only takes in amount input and everything else is set.
    const [amount, setAmount] = useState("0");
    const { account, loginAccount, ramm: {poolInfos}, actions: { addTransaction }, } = useUserStore();
    const poolInfo = poolInfos[instrument.marketId];
    const { walletBalances, borrowBalance: {amount: borrowedAmount}, accountLiquidity} = poolInfo as UserPoolInfo;

    const [ maxBorrowable, setMaxBorrowable] = useState(new BN(poolInfo.maxBorrowable).minus(borrowedAmount).toString());
    const [ depositAmount, setDepositAmount] = useState("0");
    const [ collateral, setCollateral] = useState("");
    console.log("borrowedAmount: ", borrowedAmount)

    const [borrowCapacity, setBorrowCapacity] = useState(
        new BN(poolInfo.maxBorrowable).isZero() ? "0.0" :
        new BN(borrowedAmount).plus(new BN(amount)).dividedBy(new BN(poolInfo.maxBorrowable)).multipliedBy(100).toString()
        );
    
    useEffect(() =>{
        if (collateral === "") {
            setBorrowCapacity(new BN(poolInfo.maxBorrowable).isZero() ? "0" :
            new BN(borrowedAmount).plus(new BN(amount)).dividedBy(new BN(poolInfo.maxBorrowable)).multipliedBy(100).toString());
        } else {
            for (let i = 0; i < instrument.collaterals.length; i++) {
                if (instrument.collaterals[i].address+"-"+instrument.collaterals[i].tokenId === collateral) {
                    let _max = new BN(poolInfo.maxBorrowable)
                    .plus(new BN(instrument.collaterals[i].borrowAmount)
                    .multipliedBy(new BN(depositAmount === "" ? 0 : depositAmount)));
                    setBorrowCapacity(
                        _max.isZero() ? "0.0" : new BN(borrowedAmount).plus(new BN(amount === "" ? 0 : amount)).dividedBy(_max).multipliedBy(100).toString()
                        );
                }
            }
        }
    }, [depositAmount, amount, collateral, borrowedAmount])




    let options = instrument.collaterals.map((c) => {
        return {
            label: c.symbol,
            value: c.address+"-"+c.tokenId
        }
    });
    options.push({
        label: "None",
        value: ""
    })

    let maxDeposit = collateral === "" ? "0" : walletBalances[collateral];
    let dropdown =(<SmallDropdown options={options} defaultValue="" onChange={(val)=> {
        setCollateral(val);
        if (val !== "") {
            for (let i = 0; i < instrument.collaterals.length; i++) {
                if (instrument.collaterals[i].address+"-"+instrument.collaterals[i].tokenId === val) {
                    setMaxBorrowable(
                        new BN(poolInfo.maxBorrowable)
                        .plus(new BN(instrument.collaterals[i].borrowAmount)
                        .multipliedBy(new BN(depositAmount))).toString()
                        );
                }
            }
        } else {
            setMaxBorrowable(poolInfo.maxBorrowable);
        }
    }}/>);

    const borrowAction = useCallback(async() => {
        if (collateral === "") {
            poolBorrow(account, loginAccount.library, amount, depositAmount, constants.AddressZero, "0", false, 0, instrument.address)
            .then((response) => {
                const { hash } = response;
                addTransaction({
                  hash,
                  chainId: loginAccount.chainId,
                  seen: false,
                  status: TX_STATUS.PENDING,
                  from: account,
                  addedTime: new Date().getTime(),
                  message: `Pool Borrow`,
                  marketDescription: `${instrument?.name} ${instrument?.description}`,
                });
              })
              .catch((error) => {
                console.log("pool borrow failed", error);
                addTransaction({
                  hash: "pool-borrow-failed",
                  chainId: loginAccount.chainId,
                  seen: false,
                  status: TX_STATUS.FAILURE,
                  from: account,
                  addedTime: new Date().getTime(),
                  message: `Pool Borrow`,
                  marketDescription: `${instrument?.name} ${instrument?.description}`,
                });
              });
        } else {
            for (let i = 0; i < instrument.collaterals.length; i++) {
                if (instrument.collaterals[i].address+"-"+instrument.collaterals[i].tokenId === collateral) {
                    console.log("here");
                    console.log("collateral: ", instrument.collaterals[i]);
                    poolBorrow(
                        account, 
                        loginAccount.library, 
                        amount, 
                        depositAmount, 
                        instrument.collaterals[i].address,
                        instrument.collaterals[i].tokenId,
                        instrument.collaterals[i].isERC20,
                        Number(instrument.collaterals[i].decimals),
                        instrument.address)
                    .then((response) => {
                        const { hash } = response;
                        addTransaction({
                          hash,
                          chainId: loginAccount.chainId,
                          seen: false,
                          status: TX_STATUS.PENDING,
                          from: account,
                          addedTime: new Date().getTime(),
                          message: `Poo Borrow`,
                          marketDescription: `${instrument?.name} ${instrument?.description}`,
                        });
                      })
                      .catch((error) => {
                        console.log("error", error);
                        addTransaction({
                          hash: "pool-borrow-failed",
                          chainId: loginAccount.chainId,
                          seen: false,
                          status: TX_STATUS.FAILURE,
                          from: account,
                          addedTime: new Date().getTime(),
                          message: `Pool Borrow`,
                          marketDescription: `${instrument?.name} ${instrument?.description}`,
                        });
                      });
                }
            }
        }
        
    }, [account, amount, collateral, depositAmount, instrument, vault]);

    const repayAction = useCallback(async() => {
        poolRepayAmount(account, loginAccount.library, amount, instrument.address, vault.want.address)
        .then((response) => {
            const { hash } = response;
            addTransaction({
                hash,
                chainId: loginAccount.chainId,
                seen: false,
                status: TX_STATUS.PENDING,
                from: account,
                addedTime: new Date().getTime(),
                message: `Pool Repay`,
                marketDescription: `${instrument?.name} ${instrument?.description}`,
            });
            })
            .catch((error) => {
            console.log("pool repay failed", error);
            addTransaction({
                hash: "pool-repay-failed",
                chainId: loginAccount.chainId,
                seen: false,
                status: TX_STATUS.FAILURE,
                from: account,
                addedTime: new Date().getTime(),
                message: `Pool Repay`,
                marketDescription: `${instrument?.name} ${instrument?.description}`,
            });
        })});

    
    return ( isBorrow ? (
        <div className={Styles.ModalPoolBorrowView}>
            <Header
                title={"Borrow"}
            />
            <section>
                <div>
                    <ValueLabel label="Borrow Capacity" value={borrowCapacity + "%"} />
                    {generateTooltip("(amount borrowed)/(maxBorrowableAmount)", "borrowCapacity")}
                </div>
                <div>
                    <ValueLabel label="Account Liquidity" value={accountLiquidity} />
                    {generateTooltip("total borrowable - debt owed", "accountLiquidity")}
                </div>
                <div>
                    <ValueLabel label="Account Debt" value={"$" +borrowedAmount} />
                    {generateTooltip("total asset owed", "debt")}
                </div>
                <div>
                    <ValueLabel label="Position Health" value={new BN(accountLiquidity).gte(new BN(0)) ? "Healthy" : "Danger"} />
                    {generateTooltip("liquidation threshold met when account liquidity is less than 0", "debt")}
                </div>
            </section>
            <div>                
                <ModalAmountInput
                chosenCash={vault.want.symbol}
                heading="Deposit (optional):"
                updateInitialAmount={(val) => {
                    setDepositAmount(val);
                    if (val === "") {
                        setMaxBorrowable(poolInfo.maxBorrowable)
                    } else {
                        for (let i = 0; i < instrument.collaterals.length; i++) {
                            if (instrument.collaterals[i].address+"-"+instrument.collaterals[i].tokenId === collateral) {
                                setMaxBorrowable(
                                    new BN(poolInfo.maxBorrowable)
                                    .plus(new BN(instrument.collaterals[i].borrowAmount)
                                    .multipliedBy(new BN(val)).toString()
                                    ));
                            }
                        }
                    }
                }}
                showCurrencyDropdown={true}
                initialAmount={""}
                maxValue={maxDeposit}
                dropdown={dropdown}
                tooltip={generateTooltip("Select a collateral to deposit", "info")}
                />
            </div>
            <div>
                <ModalAmountInput 
                    chosenCash={vault.want.symbol}
                    heading="Borrow:"
                    updateInitialAmount={(val) => {
                        setAmount(val);
                    }}
                    
                    initialAmount={""}
                    maxValue={maxBorrowable}
                    maxValueLabel="Max Borrowable:"
                /> 
            </div>
            
            <PrimaryThemeButton 
                text={isBorrow ? "Borrow" : "Repay"}
                action={() => borrowAction()}
            />
            </div>
    ) : (
        <div className={Styles.ModalPoolRepayView}>
            <Header
                title={"Repay"}
            />
            <section>
                <div>
                    <ValueLabel label="Borrow Capacity" value={borrowCapacity + "%"} />
                    {generateTooltip("(amount borrowed)/(maxBorrowableAmount)", "borrowCapacity")}
                </div>
                <div>
                    <ValueLabel label="Account Liquidity" value={accountLiquidity} />
                    {generateTooltip("total borrowable - debt owed", "accountLiquidity")}
                </div>
                <div>
                    <ValueLabel label="Account Debt" value={"$" +borrowedAmount} />
                    {generateTooltip("total asset owed", "debt")}
                </div>
                <div>
                    <ValueLabel label="Position Health" value={new BN(accountLiquidity).gte(new BN(0)) ? "Healthy" : "Danger"} />
                    {generateTooltip("liquidation threshold met when account liquidity is less than 0", "debt")}
                </div>
            </section>
            <div>
            {/* <ModalAmountInput
                chosenCash={vault.want.symbol}
                heading="Withdraw (optional):"
                updateInitialAmount={(val) => {
                    setDepositAmount(val);
                    if (val === "") {
                        setMaxBorrowable(poolInfo.maxBorrowable)
                    } else {
                        for (let i = 0; i < instrument.collaterals.length; i++) {
                            if (instrument.collaterals[i].address+"-"+instrument.collaterals[i].tokenId === collateral) {
                                setMaxBorrowable(
                                    new BN(poolInfo.maxBorrowable)
                                    .plus(new BN(instrument.collaterals[i].borrowAmount)
                                    .multipliedBy(new BN(val)).toString()
                                    ));
                            }
                        }
                    }
                }}
                showCurrencyDropdown={true}
                initialAmount={""}
                maxValue={maxDeposit}
                dropdown={dropdown}
                tooltip={generateTooltip("Select a collateral to deposit", "info")}
                /> */}
            </div>
            <div>
                <ModalAmountInput 
                    chosenCash={vault.want.symbol}
                    heading="Repay:"
                    updateInitialAmount={(val) => {
                        setAmount(val);
                    }}
                    
                    initialAmount={""}
                    maxValue={borrowedAmount}
                    maxValueLabel="Assets Owed:"
                /> 
            </div>
            <PrimaryThemeButton 
                text={"Repay"}
                action={() => repayAction}
            />
        </div>
    ))      
};

export default ModalPoolBorrowerAction;