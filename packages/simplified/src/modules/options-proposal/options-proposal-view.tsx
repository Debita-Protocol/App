import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Components, ContractCalls2, useUserStore, useDataStore2 } from '@augurproject/comps';
import { Collateral, VaultInfos } from '@augurproject/comps/build/types';
// @ts-ignore
import Styles from "./options-proposal-view.styles.less";
import _ from "lodash";
import { BigNumber as BN } from "bignumber.js";
import classNames from "classnames";
import { PoolLeverageFactor, PromisedReturn } from "../common/slippage";
import { isAddress } from '@ethersproject/address';
import { Link } from "react-router-dom";

import { Constants } from "@augurproject/comps";
import { generateTooltip } from '@augurproject/comps/build/components/common/labels';
import { createOptionsInstrument, createOptionsMarket } from '@augurproject/comps/build/utils/contract-calls-new';
import { ExternalLink } from '@augurproject/comps/build/utils/links/links';
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

const { createPoolMarket, createPoolInstrument } = ContractCalls2;
const {
  SelectionComps: { SquareDropdown, SingleCheckbox },
  ButtonComps: { SecondaryThemeButton, TinyThemeButton },
  InputComps: { TextInput, AmountInput },

} = Components;

export const FormAmountInput = ({ amount, updateAmount, prepend, label = "" }) => {
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
  address: string,
  marketInitiated: boolean
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
  const [deployedInstrument, setDeployedInstrument] = useState(false);
  const [optionsData, setOptionsData] = useState({
    description: "",
    name: "",
    pricePerContract: "",
    duration: "",
    shortCollateral: "", // correseponds to the principal
    oracle: ""
  });
  const [loading, setLoading] = useState(false);

  const [strikePrices, setStrikePrices] = useState<OptionsItem[]>([])

  // random address for testing
  const USDC_address = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

  // const {inputError, inputMessage} = usePoolFormInputValdiation(optionsData, collateralInfos, instrumentAddress); 

  const [vaultId, setVaultId] = useState("");
  const [defaultVault, setDefaultVault] = useState("");
  let vaultOptions = useMemo(() => {
    let _vaultOptions = [];
    for (const [id, vault] of Object.entries(vaults as VaultInfos)) {
      _vaultOptions.push({
        label: vault.name,
        value: id
      });
    }
    if (_vaultOptions.length > 0) {
      setDefaultVault(_vaultOptions[0].value);
      if (vaultId === "") {
        setVaultId(_vaultOptions[0].value);
      }
    }

    return _vaultOptions;
  }, [vaults]);
  let chosenCash = vaultId !== "" ? vaults[vaultId]?.want?.name : "";

  const submitProposal = useCallback(async () => {
    // for each of the strike price items, create an options instrument using the parameters of optionsData and the strike price item
    let instrumentAddresses = []
    for (const item of strikePrices) {
      if (!item.deployed) {
        const { description, name, pricePerContract, duration, shortCollateral, oracle } = optionsData;
        const { strikePrice } = item;
        const { address: vaultAddress } = vaults[vaultId];
        const { address: underlying } = vaults[vaultId].want;
        let _duration = new BN(duration).multipliedBy(86400).toFixed(0);

        let _instrumentAddress;
        
        // instrument creation
        try {
          const {instrumentAddress, response} =  await createOptionsInstrument(
            account,
            loginAccount.library,
            underlying,
            vaultAddress,
            strikePrice,
            oracle,
            pricePerContract,
            _duration,
            shortCollateral,
            USDC_address
          )
          _instrumentAddress = instrumentAddress;
          setStrikePrices((prev) => {
            return prev.map((item) => {
              if (item.strikePrice === strikePrice) {
                return {
                  ...item,
                  deployed: true,
                  address: instrumentAddress
                }
              } else {
                return item
              }
            })
          })
  
          addTransaction({
            hash: response.hash,
            chainId: loginAccount.chainId,
            status: TX_STATUS.PENDING,
            message: "creating options instruments..."
          });
        } catch (err) {
          console.log("err: ", err)
          addTransaction({
            hash: "instrument-creation-failed",
            chainId: loginAccount.chainId,
            seen: false,
            status: TX_STATUS.FAILURE,
            from: account,
            addedTime: new Date().getTime(),
            message: `Failed to create instrument ${err}`
          });
          return;
        }

        // market creation
        try {
          if (!_instrumentAddress) {
            throw new Error("instrument address not found")
          }
          const response = await createOptionsMarket(
            account,
            loginAccount.library,
            name,
            description,
            _instrumentAddress,
            shortCollateral,
            pricePerContract,
            _duration,
            vaultId
          );

          addTransaction({
            hash: response.hash,
            chainId: loginAccount.chainId,
            status: TX_STATUS.PENDING,
            message: "creating options market..."
          })

          // set marketInitiated to true for the strike price item
          setStrikePrices((prev) => {
            return prev.map((item) => {
              if (item.strikePrice === strikePrice) {
                return {
                  ...item,
                  marketInitiated: true
                }
              } else {
                return item
              }
            })
          })
        } catch (err) {
          console.log("err: ", err)
          addTransaction({
            hash: "market-creation-failed",
            chainId: loginAccount.chainId,
            seen: false,
            status: TX_STATUS.FAILURE,
            from: account,
            addedTime: new Date().getTime(),
            message: `Failed to create market ${err}`
          });
          return;
        }
      }
    }




  }, [vaultId, vaults, strikePrices, optionsData]);


  const underlyingSymbol = vaultId !== "" ? vaults[vaultId].want.symbol : "";

  const { inputError, inputMessage } = useOptionsFormValidation(
    optionsData,
    strikePrices
  )

  console.log(optionsData, strikePrices)

  const addOptionItem = useCallback((e) => {
    e.preventDefault();
    setStrikePrices((prev) => [...prev, {
      strikePrice: "",
      deployed: false,
      address: "",
      marketInitiated: false
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
          {generateTooltip("Vault that the instrument will be attached to, vault underlying will be deposited to the instrument on instrument approval", "vault")}
        </div>
        <SquareDropdown options={vaultOptions} onChange={(val) => setVaultId(val)} defaultValue={defaultVault} />
      </div>
      <div>
        <div>
          <label>Name: </label>
          {generateTooltip("Name of the set of options instruments", "name")}
        </div>
        <TextInput placeholder="Covered Call V0..." value={optionsData.name} onChange={(val) => {
          setOptionsData(prevData => {
            return { ...prevData, name: val }
          })
        }} />
      </div>
      <div>
        <div>
          <label>Duration: </label>
          {generateTooltip("Duration of the instrument, time of approval + duration will be the expiry date", "duration")}
        </div>
        <FormAmountInput
          updateAmount={
            (val) => {
              if (/^\d*\.?\d*$/.test(val)) {
                setOptionsData(prevData => {
                  return { ...prevData, duration: val }
                })
              }
            }
          }
          amount={optionsData.duration}
          prepend=""
          label={"days"}
        />
      </div>
      <div>
        <div>
          <label>Oracle: </label>
          {generateTooltip("Oracle used to price the collateral", "oracle")}
        </div>
        <TextInput placeholder="0x..." value={optionsData.oracle} onChange={(val) => {
          setOptionsData(prevData => {
            return { ...prevData, oracle: val }
          })
        }} />
      </div>
      <div className={Styles.StrikeItems}>
        <div>
          <div>
            <label>Strike Prices: </label>
            {generateTooltip("For each strike price specified an instrument will be deployed, AT LEAST ONE MUST BE SPECIFIED", "strikePrices")}
          </div>
          <TinyThemeButton text="Add Strike Price" action={addOptionItem} small={true} noHighlight={true} />

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
                              return { ...item, strikePrice: val }
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
                  label={underlyingSymbol + "/USD"}
                />
                <TinyThemeButton text="remove" action={() => removeOptionItem(index)} small={true} noHighlight={true} />
              </div>
            )
          })
          }


        </div>
      </div>
      <div>
        <div>
          <label>Vault Deposit Amount: </label>
          {generateTooltip("corresponds to amount of vault underlying deposited into options instrument", "shortCollateral")}
        </div>
        <FormAmountInput
          updateAmount={
            (val) => {
              if (/^\d*\.?\d*$/.test(val)) {
                setOptionsData(prevData => {
                  return { ...prevData, shortCollateral: val }
                })
              }
            }
          }
          amount={optionsData.shortCollateral}
          prepend={"$"}
          label={underlyingSymbol}
        />
      </div>
      <div>
        <div>
          <label>Price Per Contract: </label>
          {generateTooltip("price per option contract, sets the option premium", "pricePerContract")}
        </div>
        <FormAmountInput
          updateAmount={
            (val) => {
              if (/^\d*\.?\d*$/.test(val)) {
                setOptionsData(prevData => {
                  return { ...prevData, pricePerContract: val }
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
          placeholder="description..."
          onChange={(e) => {
            setOptionsData(prevData => {
              return { ...prevData, description: e.target.value }
            })
          }
          }
          value={optionsData.description}
        ></textarea>
      </div>
      <div>
        <SecondaryThemeButton
          text={inputError ? inputMessage : "Submit Proposal"}
          action={inputError ? null : submitProposal} />
          
        <div>
          {_.map(strikePrices, (item, index) => {
            if (!item.deployed) {
              return null;
            }
            let label = (<div>
              <label>Strike Price {index + 1} Contract Address (click to open explorer): </label>
            <span>{item.address}</span>
              </div>);
            return (
              <div key={index}>
                <ExternalLink URL={"https://mumbai.polygonscan.com/address/" + item.address} icon={true} label={label}>
                </ExternalLink>
              </div>
            );
          })
          }
        </div>
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
  } else if (!new BN(pricePerContract) || new BN(pricePerContract).lte(new BN(0))) {
    inputError = true;
    inputMessage = "Price per contract must be greater than 0";
  } else if (!new BN(duration) || new BN(duration).lte(new BN(0))) {
    inputError = true;
    inputMessage = "Duration invalid";
  } else if (!new BN(shortCollateral) || new BN(shortCollateral).lte(new BN(0))) {
    inputError = true;
    inputMessage = "Price per contract must be greater than 0";
  } else if (!isAddress(oracle)) {
    inputError = true;
    inputMessage = "invalid oracle address";
  } else {
    _.forEach(strikePrices, (strikePrice, i) => {
      if (!new BN(strikePrice.strikePrice) || new BN(strikePrice.strikePrice).lte(new BN(0))) {
        inputError = true;
        inputMessage = "Strike price must be greater than 0";
      }
      _.forEach(strikePrices, (other, j) => {
        if (i !== j && strikePrice.strikePrice === other.strikePrice) {
          inputError = true;
          inputMessage = "Duplicate strike prices";
        }
      })
    })
  }
  return { inputError, inputMessage };
}