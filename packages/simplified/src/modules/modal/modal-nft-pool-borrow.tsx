import React, { useState, useEffect } from "react";
import { useDataStore2, useAppStatusStore, InputComps, Icons, ButtonComps } from "@augurproject/comps";
import Styles from "./modal.styles.less";
import { USDCIcon } from "@augurproject/comps/build/components/common/icons";

const {AmountInput} = InputComps;
const {CloseIcon} = Icons;
const {PrimaryThemeButton} = ButtonComps;


const ModalNFTPoolBorrow = (
    {
        closeModal,
        marketId
    }
    : {
        closeModal: Function,
        marketId: string
    }
) => {
    // balance of nft, APR, borrow limit, balance of how much you already borrowed.
    const { instruments, vaults } = useDataStore2();
    if (!instruments[marketId] || !vaults[instruments[marketId].vaultId]) return (<div>
        loading...
    </div>)
    const vaultId = instruments[marketId].vaultId;
    // want address => currency used. TODO: map collateral address to currency name.
    const want = vaults[vaultId].want;

    const borrow_max = "100"; // borrow limit ?? TODO: get this from somewhere.
    return (
        <div className={Styles.ModalNFTPoolBorrow}>
            <span>{USDCIcon}</span>
            <button onClick={() => closeModal()}>{CloseIcon}</button>
            <AmountInput 
                chosenCash={want.name}
                heading="Amount"
                updateInitialAmount={() => {}}
                initialAmount={"0"}
                maxValue={borrow_max}
                ammCash={want}
            />
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