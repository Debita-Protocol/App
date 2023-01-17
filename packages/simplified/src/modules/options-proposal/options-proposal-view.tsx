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
import { generateTooltip, ValueLabel } from '@augurproject/comps/build/components/common/labels';
import { approveERC20, createOptionsInstrument, createOptionsMarket, depositOptionsInstrument, isERC20ApprovedSpender } from '@augurproject/comps/build/utils/contract-calls-new';
import { ExternalLink } from '@augurproject/comps/build/utils/links/links';
import { LinkIcon } from '@augurproject/comps/build/components/common/icons';
import { formatBytes32String, parseBytes32String } from 'ethers/lib/utils';
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

const { createPoolMarket, createPoolInstrument, ContractSetup } = ContractCalls2;
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
  marketInitiated: boolean,
  numContracts: string,
  pricePerContract: string
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
    // name: "",
    duration: "",
    description: "",
    tradeTime: ""
  });
  const [loading, setLoading] = useState(false);

  const [strikePrices, setStrikePrices] = useState<OptionsItem[]>([])

  // random address for testing
  const USDC_address = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

  // const {inputError, inputMessage} = usePoolFormInputValdiation(optionsData, collateralInfos, instrumentAddress); 
  // add error handling for everything
  let maturityDate = optionsData.duration !== "" ? new Date((Date.now() / 1000 + 86400*parseInt(optionsData.duration)) * 1000) : null;
  let formattedDate = maturityDate ? maturityDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  console.log("maturityDate", maturityDate);

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

  const submitProposal = useCallback(async () => {
    // for each of the strike price items, create an options instrument using the parameters of optionsData and the strike price item
    for (const item of strikePrices) {
      if (!item.deployed) {
        let { description, duration, tradeTime } = optionsData;
        const { strikePrice, pricePerContract, numContracts } = item;
        const { address: vaultAddress, want: {address: wantAddress} } = vaults[vaultId];
        const { address: underlying } = vaults[vaultId].want;
        let _duration = new BN(duration).multipliedBy(86400).toFixed(0);
        let maturityDate = new Date((Date.now() / 1000 + parseInt(_duration)) * 1000);
        let formattedDate = maturityDate.toISOString().split('T')[0]
        // remove first two characters of formattedDate

        tradeTime = new BN(tradeTime).multipliedBy(86400).toFixed(0);
        
        formattedDate = formattedDate.substring(2);
        let name = `${underlyingSymbol}-${formattedDate}-${strikePrice}-C`;

        //ETH-230116-1550-C
        // let description = JSON.stringify(
        //   {
        //     underlying: underlyingSymbol,
        //     strike: strikePrice,
        //     duration: duration,
        //     oracle: oracle,
        //   }
        // )
        let instrumentAddress;
    
        try {
          const { instrumentAddress: _instrumentAddress, response } = await createOptionsInstrument(
            account,
            loginAccount.library,
            vaultAddress,
            strikePrice,
            pricePerContract,
            _duration,
            numContracts,
            tradeTime,
            USDC_address // TODO: 
          )
          instrumentAddress = _instrumentAddress;
          addTransaction({
            hash: response.hash,
            chainId: loginAccount.chainId,
            status: TX_STATUS.PENDING,
            message: "creating options instruments..."
          });
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

        } catch (err) {
          console.log("err: ", err);
          addTransaction({
            hash: "instrument-creation-failed",
            chainId: loginAccount.chainId,
            seen: false,
            status: TX_STATUS.FAILURE,
            from: account,
            addedTime: new Date().getTime(),
            message: `Failed to create instrument ${err}`
          });
        }

        try {
          if (!instrumentAddress) {
            throw new Error("instrument address not found")
          }

          let response = await depositOptionsInstrument(
            account,
            loginAccount.library,
            instrumentAddress,
            wantAddress,
            new BN(pricePerContract).multipliedBy(numContracts).toFixed(20)
          )
          addTransaction({
            hash: response.hash,
            chainId: loginAccount.chainId,
            status: TX_STATUS.PENDING,
            message: "depositing into options instrument..."
          })
        } catch(err) {
          console.log("err: ", err);
          addTransaction({
            hash: "options-deposit-failed",
            chainId: loginAccount.chainId,
            seen: false,
            status: TX_STATUS.FAILURE,
            from: account,
            addedTime: new Date().getTime(),
            message: `Failed to create market ${err}`
          });
          return;
        }

        try {
          const response = await createOptionsMarket(
            account,
            loginAccount.library,
            name,
            description,
            instrumentAddress,
            numContracts,
            pricePerContract,
            duration,
            new BN(maturityDate.getTime() / 1000).toFixed(0),
            vaultId
          );

          addTransaction({
            hash: response.hash,
            chainId: loginAccount.chainId,
            status: TX_STATUS.PENDING,
            message: "creating options market..."
          })

          // // set marketInitiated to true for the strike price item
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


  const underlyingSymbol = vaults && vaultId !== "" ? vaults[vaultId].want.symbol : "";

  const { inputError, inputMessage } = useOptionsFormValidation(
    optionsData,
    strikePrices
  )

  console.log("OPTIONS: ", optionsData, strikePrices)
  console.log("optionsData.duration: ", optionsData.duration)

  const addOptionItem = useCallback((e) => {
    e.preventDefault();
    setStrikePrices((prev) => [...prev, {
      strikePrice: "",
      deployed: false,
      address: "",
      marketInitiated: false,
      pricePerContract: "",
      numContracts: "",
      tradeTime: ""
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
        <button onClick={() => ContractSetup(account, loginAccount.library)}>
          God button
        </button>
      </div>
      <div>
        <div>
          {generateTooltip("Vault that the instrument will be attached to, vault underlying will be deposited to the instrument on instrument approval", "vault")}
          <label>Selected Vault: </label>
        </div>
        <SquareDropdown options={vaultOptions} onChange={(val) => setVaultId(val)} defaultValue={defaultVault} />
      </div>
      <div>

      </div>
      {/* <div>
        <div>
        {generateTooltip("Name of the pool instrument", "name")}
          <label>Name: </label>
        </div>
        <TextInput placeholder="Covered Calls V0..." value={optionsData.name} onChange={(val) => {
          setOptionsData((prevData) => {
            return { ...prevData, name: val }
          })
        }} />
      </div> */}
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
        <div>
          {generateTooltip("Duration of the instrument, time of approval + duration will be the expiry date", "duration")}
          <label>Duration: </label>
        </div>
        <div>
          <FormAmountInput
            updateAmount={
              (val) => {
                setOptionsData(prevData => {
                  return { ...prevData, duration: val }
                })
              }
            }
            amount={optionsData.duration}
            prepend=""
            label={"days"}
          />
          <span>{"Maturity Date: " + formattedDate}</span>
        </div>
      </div>
      <div>
        <div>
          {generateTooltip("Duration of instrument assessment", "tradeTime")}
          <label>Trade Time: </label>
        </div>
        <div>
          <FormAmountInput
            updateAmount={
              (val) => {
                setOptionsData(prevData => {
                  return { ...prevData, tradeTime: val }
                })
              }
            }
            amount={optionsData.tradeTime}
            prepend=""
            label={"days"}
          />
        </div>
      </div>
      {/* <div>
        <div>
          {generateTooltip("Oracle used to price the collateral", "oracle")}
          <label>Oracle: </label>
        </div>
        <TextInput placeholder="0x..." value={optionsData.oracle} onChange={(val) => {
          setOptionsData(prevData => {
            return { ...prevData, oracle: val }
          })
        }} />
      </div> */}
      <div className={Styles.StrikeItems}>
        <div>
          <div>
            {generateTooltip("For each strike price specified an instrument will be deployed, AT LEAST ONE MUST BE SPECIFIED", "strikePrices")}
            <label>Options Contracts: </label>
          </div>
          <TinyThemeButton text="Add Contract" action={addOptionItem} small={true} noHighlight={true} />

        </div>
        <div>
          {strikePrices.map((item, index) => {

            let totalPremium = (item.numContracts.length > 0 && item.pricePerContract.length > 0) ? (parseFloat(item.numContracts) * parseFloat(item.pricePerContract)).toFixed(2) : "0.00";
            return (
              <div key={index}>
                <label>Option {index + 1}: </label>
                <div>
                  <div>
                    {generateTooltip("Strike price of the option", "strikePrice")}
                    <label>Strike Price</label>
                  </div>
                  <FormAmountInput
                    updateAmount={
                      (val) => {
                        setStrikePrices(prevData => {
                          let result = _.map(prevData, (item, i) => {
                            if (i === index) {
                              return { ...item, strikePrice: val }
                            }
                            return item;
                          });
                          return result;
                        })
                      }
                    }
                    amount={item.strikePrice}
                    prepend={"$"}
                    label={underlyingSymbol + "/USD"}
                  />
                </div>
                <div>
                  <div>
                    {generateTooltip("number of contracts you wish to purchase", "numContracts")}
                    <label>Number of Contracts: </label>
                  </div>
                  <FormAmountInput
                    updateAmount={
                      (val) => {
                        setStrikePrices(prevData => {
                          let result = _.map(prevData, (item, i) => {
                            if (i === index) {
                              return { ...item, numContracts: val }
                            }
                            return item;
                          });
                          return result;
                        })
                      }
                    }
                    amount={item.numContracts}
                    prepend={"#"}
                    label={"contracts"}
                  />
                </div>
                <div>
                  <div>
                    {generateTooltip("MUST BE BETWEEN 0 AND 1. price per option contract, sets the option premium", "pricePerContract")}
                    <label>Price Per Contract: </label>

                  </div>
                  <FormAmountInput
                    updateAmount={
                      (val) => {
                        setStrikePrices(prevData => {
                          let result = _.map(prevData, (item, i) => {
                            if (i === index) {
                              return { ...item, pricePerContract: val }
                            }
                            return item;
                          });
                          return result;
                        })
                      }
                    }
                    amount={strikePrices[index].pricePerContract}
                    prepend={"$"}
                    label={underlyingSymbol}
                  />
                </div>
                <div>
                  <ValueLabel label="Total Premium" value={totalPremium}/>
                </div>
                <TinyThemeButton text="remove" action={() => removeOptionItem(index)} small={true} noHighlight={true} />
              </div>
            )
          })
          }
        </div>
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
            let label = (
              <div className={Styles.DeployedLabel}>
                <span>
                  {LinkIcon}
                </span>
                <ValueLabel value={item.address} label={`Contract ${index} Deployment`} />
              </div>

            )
            return (
              <div key={index}>
                <ExternalLink URL={"https://mumbai.polygonscan.com/address/" + item.address} label={label}>
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

const validPositiveNumber = (val: string) => {
  if (!val || val.length === 0) {
    return false;
  }
  let num = new BN(val);
  return num.gt(new BN(0));
}

const useOptionsFormValidation = ({
  //name,
  description,
  // oracle,
  tradeTime,
  duration,
  
}, strikePrices) => {
  let inputError = false;
  let inputMessage = "";
  if (description.length === 0) {
    inputError = true;
    inputMessage = "Description is required";
  } else if (!validPositiveNumber(duration)) {
    inputError = true;
    inputMessage = "Duration invalid";
  }else if (!validPositiveNumber(tradeTime)) {
    inputError = true;
    inputMessage = "tradeTime invalid";
  } else if (strikePrices.length === 0) {
    inputError = true;
    inputMessage = "Must have at least one strike price";
  } else {
    _.forEach(strikePrices, (strikePrice, i) => {
      if (!validPositiveNumber(strikePrice.strikePrice)) {
        inputError = true;
        inputMessage = "Strike price must be greater than 0";
      }
      if (!validPositiveNumber(strikePrice.numContracts)) {
        inputError = true;
        inputMessage = "number of contracts must be greater than 0";
      }
      if (!validPositiveNumber(strikePrice.pricePerContract)) {
        inputError = true;
        inputMessage = "Price per contract must be greater than 0";
      } else if (new BN(strikePrice.pricePerContract).gt(1)) {
        inputError = true;
        inputMessage = "Price per contract must be between 0 and 1";
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