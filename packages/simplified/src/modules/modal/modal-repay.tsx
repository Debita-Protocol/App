import React, { useState } from "react";

// @ts-ignore
import Styles from "./modal.styles.less";

// @ts-ignore
import ButtonStyles from "../common/buttons.styles.less";
import { Header } from "./common";
import { Components, useUserStore } from "@augurproject/comps";
import { InfoNumbers, InfoNumberType } from "../market/trading-form";
import { MarketInfo, VaultInfo, PoolInstrument, Collateral, UserPoolInfo } from "@augurproject/comps/build/types";
import { useSimplifiedStore } from "modules/stores/simplified";
import { AmountInput } from "@augurproject/comps/build/components/common/inputs";



const {
    ButtonComps: { SecondaryThemeButton },
    MarketCardComps: { MarketTitleArea },
} = Components;

interface ModalConfirmTransactionProps {
    transactionButtonText: string;
    transactionAction: Function;
    title: string;
    breakdowns: Array<{
        heading: string;
        infoNumbers: Array<InfoNumberType>;
    }>;
    targetDescription: {
        market: MarketInfo;
        label: string;
        subLabel?: string;
    };
    footer?: {
        text: string;
        emphasize: string;
    };
    vault?: VaultInfo;
    collateral?: Collateral;
    instrument?: PoolInstrument;
    isAdd?: boolean;
}

const ModalRepayView = ({
    transactionButtonText,
    transactionAction,
    breakdowns = [],
    targetDescription,
    title,
    vault,
    isAdd,
    instrument,
    collateral,
    footer = null,
}: ModalConfirmTransactionProps) => {
    const [buttonText, setButtonText] = useState(transactionButtonText);
    const [amount, setAmount] = useState("0");
    const { account, loginAccount, ramm: { vaultBalances }, actions: { addTransaction }, } = useUserStore();
    const vaultBalance = vaultBalances[instrument.vaultId] ? vaultBalances[instrument.vaultId].base : "0";

    return (
        <section className={Styles.ModalPoolCollateralView}>
            <Header title={title} />
            <main>
                <section className={Styles.TargetDescription}>
                    <span>{"Repay Creditline"}</span>
                </section>
                {breakdowns.length > 0 &&
                    breakdowns.map(({ heading, infoNumbers }) => (
                        <section key={`${heading}-breakdown`}>
                            <h5>{heading}</h5>
                            <InfoNumbers {...{ infoNumbers }} />
                        </section>
                    ))}
                <AmountInput
                    chosenCash={collateral.symbol}
                    heading="Amount"
                    updateInitialAmount={(val) => {
                        setAmount(val);
                    }}
                    initialAmount={""}
                    maxValue={vaultBalance}
                />
                <SecondaryThemeButton
                    action={() => transactionAction(amount)}
                    text={"Repay"}
                    disabled={buttonText !== transactionButtonText}
                    customClass={ButtonStyles.ReviewTransactionButton}
                />
                {footer && (
                    <div className={Styles.FooterText}>
                        {footer.text}
                        {footer.emphasize && <span>{footer.emphasize}</span>}
                    </div>
                )}
            </main>
        </section>
    );
};

// const TargetDescription = ({ targetDescription }) => {
//   const {
//     settings: { timeFormat },
//   } = useSimplifiedStore();
//   const { market, label, subLabel = null } = targetDescription;
//   return (
//     <section className={Styles.TargetDescription}>
//       <span>{label}</span>
//       <MarketTitleArea {...{ ...market, timeFormat }} />
//       {subLabel && <span>{subLabel}</span>}
//     </section>
//   );
// };

export default ModalRepayView;
