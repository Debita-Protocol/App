import React, { useState, useEffect } from "react";
import { useDataStore2, useAppStatusStore, InputComps, Icons, ButtonComps, LabelComps } from "@augurproject/comps";
import Styles from "./modal.styles.less";
import { USDCIcon } from "@augurproject/comps/build/components/common/icons";
import { Cashes, Cash } from "@augurproject/comps/build/types";

const {AmountInput} = InputComps;
const {CloseIcon} = Icons;
const {PrimaryThemeButton} = ButtonComps;
const {ValueLabel} = LabelComps;

const ModalNFTPoolBorrow = (
    {
        closeModal,
        buttonAction,
        buttonText,
        asset,
        asset_limit,
        balance="0",
        icon=USDCIcon
    }
    : {
        closeModal: Function,
        buttonAction: Function,
        buttonText: string,
        asset: Cash,
        asset_limit: string,
        balance: string,
        icon: Object,
        assetName: string
    }
) => {
    // balance of nft, APR, borrow limit, balance of how much you already borrowed.

    const borrow_max = "100"; // borrow limit ?? TODO: get this from somewhere.
    return (
        <div className={Styles.ModalNFTPoolBorrow}>
            <span>{USDCIcon}</span>
            <button onClick={() => closeModal()}>{CloseIcon}</button>
            <AmountInput 
                chosenCash={asset.name ? asset.name : "USDC"}
                heading="Amount"
                updateInitialAmount={() => {}}
                initialAmount={"0"}
                maxValue={borrow_max}
                ammCash={asset}
            />
            <ValueLabel label="balance" value={balance}/>
            <PrimaryThemeButton 
                text="Borrow"
                action={() => {
                    console.log("borrowing");
                }}
            />
        </div>
    )
};

export default ModalNFTPoolBorrow;