import React, { useState, useEffect } from "react";
import { ContractCalls2, useDataStore2, useAppStatusStore, InputComps, Icons, ButtonComps, LabelComps } from "@augurproject/comps";

// @ts-ignore
import Styles from "./modal.styles.less";
import { USDCIcon } from "@augurproject/comps/build/components/common/icons";
import { assertType } from "graphql";
import { Header } from "./common";


const {ModalAmountInput} = InputComps;
const {CloseIcon} = Icons;
const {PrimaryThemeButton} = ButtonComps;
const {ValueLabel} = LabelComps;
const { useIsERC20ApprovedSpender, useIsERC721ApprovedSpender, approveERC20, approveERC721 } = ContractCalls2;


const ModalCollateralPool = (
    {
        closeModal,
        isAdd,
        action,
        symbol,
        maxValue,
        isERC20
    }
    : {
        closeModal: Function,
        isAdd: boolean,
        isERC20: boolean,
        action: Function,
        symbol: string, // collatarel symbol
        maxValue?: string,
    }
) => {
    // if erc20 then approve is different. different abis.
    // can create wrapper function that only takes in amount input and everything else is set.
    const [amount, setAmount] = useState("0");

    return (
        <div className={Styles.ModalPoolView}>
            <Header
                title={symbol}
            />
            {isERC20 ? <ModalAmountInput 
                chosenCash={symbol}
                heading="Amount"
                updateInitialAmount={(val) => {
                    setAmount(val);
                }}
                initialAmount={""}
                maxValue={maxValue}
            /> : (
                <ValueLabel label={""} value={symbol}/>
            )}
            <PrimaryThemeButton 
                text={isAdd ? "Add Collateral" : "Remove Collateral"}
                action={() => action(amount, closeModal)}
            />
        </div>
    )
};

export default ModalCollateralPool;