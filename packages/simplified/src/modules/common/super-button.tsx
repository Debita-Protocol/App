// FOR TESTING ONLY
import { BaseThemeButton } from "@augurproject/comps/build/components/common/buttons";
import React, { useState, useCallback } from "react"
import { ContractCalls, useUserStore } from "@augurproject/comps";
const { setupContracts } = ContractCalls;

export const  SUPER_BUTTON = () => {
    const [called, setCalled] = useState(false);
    const { account, loginAccount } = useUserStore();
    const onClick = useCallback(async () => {
        
        await setupContracts(account, loginAccount.library);
        setCalled(true);
    });

    return (
        <>
        { !called ? (
            <BaseThemeButton action={onClick} text={"Setup Button"}/>
        ) : (
            <div>
                ALREADY CALLED
            </div>
        )
        }
        </>
    )

}