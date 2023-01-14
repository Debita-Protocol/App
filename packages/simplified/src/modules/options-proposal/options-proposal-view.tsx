import React, {useEffect, useState, useMemo, useCallback} from 'react';
import { Components, ContractCalls2, useUserStore, useDataStore2 } from '@augurproject/comps';
import { Collateral, VaultInfos } from '@augurproject/comps/build/types';
// @ts-ignore
import Styles from "./options-proposal-view.styles.less";
import _ from "lodash";
import { BigNumber as BN } from "bignumber.js";
import classNames from "classnames";
import { PoolLeverageFactor, PromisedReturn } from "../common/slippage";
import { isAddress } from '@ethersproject/address';

import { Constants } from "@augurproject/comps";
import { generateTooltip } from '@augurproject/comps/build/components/common/labels';
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

const { createPoolMarket, createPoolInstrument} = ContractCalls2;
const {
    SelectionComps: {SquareDropdown, SingleCheckbox},
    ButtonComps: { SecondaryThemeButton, TinyThemeButton },
    InputComps: { TextInput, AmountInput },
    
} = Components;

export const FormAmountInput = ({amount, updateAmount, prepend, label="" }) => {
  const [_amount, _setAmount] = useState(amount);
  
  return (
    <div className={classNames(Styles.AmountInputField, {
      [Styles.Edited]: amount !== ""
    })}>
      <span>
        {prepend}
      </span>
      <input
        type="number"
        value={_amount}
        placeholder="0"
        onChange={(e) => {
          _setAmount(e.target.value)
          updateAmount(e.target.value);
        }} 
        onWheel={(e: any) => e?.target?.blur()}
      />
      <span className={Styles.CurrencyLabel}>
            {label}
      </span>
    </div>
    
  )
}

const toCompoundingRatePerSec = (r_i: number): BN => {
  return new BN(Math.exp(Math.log(r_i + 1) / (31536000)) - 1);
}

const OptionsProposalView: React.FC = () => {
    const {
        account,
        balances,
        loginAccount,
        actions: { addTransaction },
      } = useUserStore();
    const { vaults } = useDataStore2();
    const [ deployedInstrument, setDeployedInstrument ] = useState(false); 
    const [ optionsData, setOptionsData] = useState({
        description: "",
        name: "",
        pricePerContract: "",
        duration: "",
        shortCollateral: ""
    });
    const [ strikePrices, setStrikePrices ] = useState<string[]>([])
    const [ instrumentAddress, setInstrumentAddress ] = useState("")

    // const {inputError, inputMessage} = usePoolFormInputValdiation(optionsData, collateralInfos, instrumentAddress); 
  
    const [ vaultId, setVaultId ] = useState("");
    const [ defaultVault, setDefaultVault] = useState("");
    let vaultOptions = useMemo(() => {
        let _vaultOptions = [];
        for (const [id, vault] of Object.entries(vaults as VaultInfos)) {
          _vaultOptions.push({
            label: vault.name,
            value: id
          });
        }
        if (_vaultOptions.length > 0 ) { 
          setDefaultVault(_vaultOptions[0].value);
          if (vaultId === "") {
            setVaultId(_vaultOptions[0].value);
          }
        }

        return _vaultOptions;
      }, [vaults]);
      let chosenCash = vaultId !== "" ? vaults[vaultId].want.name : "";

    const submitProposal = useCallback(async () => {
    }, [vaultId, vaults]);


    const underlyingSymbol = vaultId !== "" ? vaults[vaultId].want.symbol : "";

    if (!loginAccount || !loginAccount.library) {
        return <h2>
          Please connect your wallet to use this feature
        </h2>;
    }
    
    return (
          <div className={Styles.PoolProposalForm}>
            {/* <SUPER_BUTTON /> */}
            <div>
              <h3>
                Covered Call Proposal Form
              </h3>
            </div>
            <div>
              <div>
                <label>Selected Vault: </label>
                { generateTooltip("Vault that the instrument will be attached to, vault underlying will be deposited to the instrument on instrument approval", "vault")}
              </div>
              <SquareDropdown options={vaultOptions} onChange={(val) => setVaultId(val)} defaultValue={defaultVault}/>
            </div>
            <div>
              <div>
                <label>Name: </label>
                { generateTooltip("Name of the set of options instruments", "name")}
              </div>
              <TextInput placeholder="" value={optionsData.name} onChange={(val) => {
                
              }}/>
            </div>
            <div>
              <div>
                <label>Price Per Contract: </label>
                { generateTooltip("price per option contract, sets the option premium", "pricePerContract")}
              </div>
              <FormAmountInput 
                updateAmount={
                  (val) => {
                    if (/^\d*\.?\d*$/.test(val)) {
                      setOptionsData(prevData => {
                        return {...prevData, pricePerContract: val}
                      })
                    }
                  }
                }
                amount={optionsData.pricePerContract}
                prepend={"$"}
                label={underlyingSymbol}
              />
            </div>
            <div className={Styles.Description}>
              <label>Description: </label>
              <textarea 
              rows="4" 
              cols="15" 
              placeholder=""
              onChange={(e) => {
                setOptionsData(prevData => {
                    return {...prevData, description: e.target.value}
                  })
                }
              }
              value= { optionsData.description }
              ></textarea>
            </div>
            <div>
              <div>
                <label>Instrument Address (optional): </label>
                { generateTooltip("leave empty if you want the pool instrument to be created for you", "name")}
              </div>
              <TextInput placeholder="" value={instrumentAddress} onChange={(val) => {
                setInstrumentAddress(val)
              }}/>
            </div>
            <div>
              <SecondaryThemeButton 
              text={"Submit Proposal"}
              action={null} />
            </div>

            </div>
        );
}

export default OptionsProposalView;

const usePoolFormInputValdiation = ({
  description,
  name,
  symbol,
  saleAmount,
  initPrice,
  promisedReturn,
  inceptionPrice,
  leverageFactor
}, collateralInfos, instrumentAddress) => {
  let inputError = false;
  let inputMessage = "";
  if (description.length === 0) {
    inputError = true;
    inputMessage = "Description is required";
  } else if (name.length === 0) {
    inputError = true;
    inputMessage = "Name is required";
  } else if (symbol.length === 0) {
    inputError = true;
    inputMessage = "Symbol is required";
  } else if (new BN(saleAmount).isZero()) {
    inputError = true;
    inputMessage = "Sale Amount is required";
  } else if (new BN(initPrice).isZero()) { // must be greater than 1 but less than 0.
    inputError = true;
    inputMessage = "Initial Price is required";
  } else if (new BN(promisedReturn).isZero()) {
    inputError = true;
    inputMessage = "Promised Return is required";
  } else if (new BN(inceptionPrice).isZero()) {
    inputError = true;
    inputMessage = "Inception Price is required";
  } else if (new BN(leverageFactor).isZero()) {
    inputError = true;
    inputMessage = "Leverage Factor is required";
  } else if (collateralInfos.length === 0) {
    inputError = true;
    inputMessage = "Collateral is required";
  } else if (instrumentAddress !== "" && !isAddress(instrumentAddress)) {
    inputError = true;
    inputMessage = "Instrument Address is not valid";
  } else {
    collateralInfos.forEach((collateralInfo) => {
      // check whether collateral address is valid
      if (collateralInfo.tokenAddress.length === 0 || !isAddress(collateralInfo.tokenAddress)) {
        inputError = true;
        inputMessage = "Collateral Address is required";
      } else if (!collateralInfo.isERC20 && _.isInteger(collateralInfo.tokenId)) {
        inputError = true;
        inputMessage = "Token ID is required";
      } else if (new BN(collateralInfo.borrowAmount).isZero()) {
        inputError = true;
        inputMessage = "Asset Borrow Liquidity is required";
      } else if (new BN(collateralInfo.maxAmount).isZero()) {
        inputError = true;
        inputMessage = "Asset Max Liquidity is required";
      }
    });
  }
  return {inputError, inputMessage};
}