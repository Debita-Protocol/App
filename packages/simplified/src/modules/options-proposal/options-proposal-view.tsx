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

interface OptionsItem {
  strikePrice: string,
  deployed: boolean,
  address: string
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
        shortCollateral: "", // correseponds to the principal
        oracle: ""
    });

    const [ strikePrices, setStrikePrices ] = useState<OptionsItem[]>([])

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

    const {inputError, inputMessage} = useOptionsFormValidation(
      optionsData,
      strikePrices
    )

    const addOptionItem = useCallback((e) => {
      e.preventDefault();
        setStrikePrices((prev) => [...prev, {
            strikePrice: "",
            deployed: false,
            address: ""
        }]);
    }, [strikePrices]);

    const removeOptionItem = useCallback((index: number) => {
      setStrikePrices((prev) => {
          let result = prev.filter((_, i) => i !== index);
          return result;
      });
  }, [strikePrices]);

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
                setOptionsData(prevData => {
                  return {...prevData, name: val} 
                })
              }}/>
            </div>
            <div>
              <div>
                <label>Oracle: </label>
                { generateTooltip("Oracle used to price the collateral", "oracle")}
              </div>
              <TextInput placeholder="" value={optionsData.oracle} onChange={(val) => {
                setOptionsData(prevData => {
                  return {...prevData, oracle: val} 
                })
              }}/>
            </div>
            <div className={Styles.StrikeItems}>
              <div>
                <div>
                  <label>Strike Prices: </label>
                  { generateTooltip("For each strike price specified an instrument will be deployed, AT LEAST ONE MUST BE SPECIFIED", "strikePrices")} 
                </div>
                <TinyThemeButton text="+" action={addOptionItem} small={true} noHighlight={true}/>
               
              </div>
              <div>
                {strikePrices.map((item, index) => {
                  return (
                    <div key={index}>
                      <label>Strike Price {index + 1}: </label>
                      <FormAmountInput
                        updateAmount={
                          (val) => {
                            if (/^\d*\.?\d*$/.test(val)) {
                              setStrikePrices(prevData => {
                                let result = prevData.map((item, i) => {
                                  if (i === index) {
                                    return {...item, strikePrice: val}
                                  }
                                  return item;
                                });
                                return result;
                              })
                            }
                          }
                        }
                        amount={item.strikePrice}
                        prepend={"$"}
                        label={underlyingSymbol}
                      />
                      <TinyThemeButton text="-" action={() => removeOptionItem(index)} small={true} noHighlight={true}/>
                      </div>
                  )
                })
                }

                      
              </div>
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
              <SecondaryThemeButton 
              text={inputError ? inputMessage : "Submit Proposal"}
              action={inputError ? null : submitProposal} />
            </div>
            </div>
        );
}

export default OptionsProposalView;

const useOptionsFormValidation = ({
  description,
  name,
  oracle,
  pricePerContract,
  duration,
  shortCollateral
}, strikePrices) => {
  let inputError = false;
  let inputMessage = "";
  if (description.length === 0) {
    inputError = true;
    inputMessage = "Description is required";
  } else if (name.length === 0) {
    inputError = true;
    inputMessage = "Name is required";
  } else if (! new BN(pricePerContract) || new BN(pricePerContract).lte(new BN(0))) {
    inputError = true;
    inputMessage = "Price per contract must be greater than 0";
  }else if (! new BN(duration) || new BN(duration).lte(new BN(0))) {
    inputError = true;
    inputMessage = "Duration invalid";
  }else if (! new BN(shortCollateral) || new BN(shortCollateral).lte(new BN(0))) {
    inputError = true;
    inputMessage = "Price per contract must be greater than 0";
  } else if (!isAddress(oracle)) {
    inputError = true;
    inputMessage = "invalid oracle address";
  }else {
    _.forEach(strikePrices, (strikePrice) => {
      if (! new BN(strikePrice.strikePrice) || new BN(strikePrice.strikePrice).lte(new BN(0))) {
        inputError = true;
        inputMessage = "Strike price must be greater than 0";
      }
      _.forEach(strikePrices, (other) => {
        if (strikePrice.strikePrice === other.strikePrice) {
          inputError = true;
          inputMessage = "Duplicate strike prices";
        }
      })
    })
  }
  return {inputError, inputMessage};
}