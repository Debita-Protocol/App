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
  initialAmount: string;
  title: string;
  inputDisabled: boolean;
  maxValue: string;
  breakdowns: Array<{
    heading: string;
    infoNumbers: Array<InfoNumberType>;
  }>;
  targetDescription: {
    // market: MarketInfo;
    label: string;
    subLabel?: string;
  };
  footer?: {
    text: string;
    emphasize: string;
  };
  currencySymbol: string;
vault?: VaultInfo;
collateral?: Collateral;
instrument?: PoolInstrument;
isAdd?: boolean;
}

const ModalRedeem = ({
  transactionButtonText,
  transactionAction,
  breakdowns = [],
  targetDescription,
  title,
  currencySymbol,
  initialAmount,
  inputDisabled,
  maxValue,
  footer = null
}: ModalConfirmTransactionProps) => {
  const [buttonText, setButtonText] = useState(transactionButtonText);
  const [amount, setAmount] = useState("0");


  return (
    <section className={Styles.ModalPoolCollateralView}>
      <Header title={title} />
      <main>
        <TargetDescription {...{ targetDescription }} />
        {breakdowns.length > 0 &&
          breakdowns.map(({ heading, infoNumbers }) => (
            <section key={`${heading}-breakdown`}>
              <h5>{heading}</h5>
              <InfoNumbers {...{ infoNumbers }} />
            </section>
          ))}
          <AmountInput 
                chosenCash={currencySymbol}
                heading="Amount"
                updateInitialAmount={(val) => {
                    setAmount(val);
                }}
                disabled={inputDisabled}
                initialAmount={initialAmount}
                maxValue={maxValue}
            />
        <SecondaryThemeButton
          action={() => transactionAction(amount)}
          text={buttonText}
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

const TargetDescription = ({ targetDescription }) => {
  const {
    settings: { timeFormat },
  } = useSimplifiedStore();
  const { market, label, subLabel = null } = targetDescription;
  return (
    <section className={Styles.TargetDescription}>
      <span>{label}</span>
      {/* <MarketTitleArea {...{ ...market, timeFormat }} /> */}
      {subLabel && <span>{subLabel}</span>}
    </section>
  );
};

export default ModalRedeem;