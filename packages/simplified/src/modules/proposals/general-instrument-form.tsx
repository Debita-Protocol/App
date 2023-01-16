import { ContractCalls2, useUserStore } from "@augurproject/comps";
import React from "react";

const { ContractSetup } = ContractCalls2;


const GeneralInstrumentForm: React.FC = () => {
    const { account, loginAccount } = useUserStore();
    return (
        <div>
            <h2>
                General Instrument Form
            </h2>
            {/* <button onClick={() => { ContractSetup(account, loginAccount.library) }} text="click me">
                click me
            </button> */}
        </div>
    )
}

export default GeneralInstrumentForm;