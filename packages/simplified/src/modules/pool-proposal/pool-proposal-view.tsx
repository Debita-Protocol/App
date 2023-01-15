import React, {useEffect, useState, useMemo, useCallback} from 'react';
import { Components, ContractCalls2, useUserStore, useDataStore2 } from '@augurproject/comps';
import { Collateral, VaultInfos } from '@augurproject/comps/build/types';
// @ts-ignore
import Styles from "./pool-proposal-view.styles.less";
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

interface PoolCollateralItem {
    tokenAddress: string;
    tokenId: string;
    borrowAmount: string;
    maxAmount: string;
    isERC20: boolean;
}

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

const PoolProposalView: React.FC = () => {
    const {
        account,
        balances,
        loginAccount,
        actions: { addTransaction },
      } = useUserStore();
    const { vaults } = useDataStore2();
    const [ deployedInstrument, setDeployedInstrument ] = useState(false); 
    const [ poolData, setPoolData] = useState({
        description: "",
        name: "",
        symbol: "",
        saleAmount: "",
        initPrice: "",
        promisedReturn: "",
        inceptionPrice: "",
        leverageFactor: ""
    });
    const [ collateralInfos, setCollateralInfos] = useState<PoolCollateralItem[]>([]);
    const [ instrumentAddress, setInstrumentAddress ] = useState("");

    const {inputError, inputMessage} = usePoolFormInputValdiation(poolData, collateralInfos, instrumentAddress); 
  
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

        const saleAmount = new BN(poolData.saleAmount).shiftedBy(18).toFixed(0);
        const initPrice = new BN(poolData.initPrice).shiftedBy(18).toFixed(0);
        const inceptionPrice = new BN(poolData.inceptionPrice).shiftedBy(18).toFixed(0);
        const leverageFactor = new BN(poolData.leverageFactor).shiftedBy(18).toFixed(0);
        const promisedReturn = toCompoundingRatePerSec(parseFloat(poolData.promisedReturn) / 100).shiftedBy(18).toFixed(0);
        
        let deployedAddress;
        if (instrumentAddress === "") {
          createPoolInstrument(
            account,
            loginAccount.library,
            vaults[vaultId].address,
            vaults[vaultId].want.address,
            poolData.name,
            poolData.symbol,
            collateralInfos
          )
          .then(({ response, instrumentAddress: _deployedAddress}) => {
            const {hash} = response
            setDeployedInstrument(true);
            setInstrumentAddress(_deployedAddress);
            addTransaction({
              hash,
              chainId: loginAccount.chainId,
              status: TX_STATUS.PENDING,
              message: "contract deployment pending at " + _deployedAddress + " ..."})
            })
            .catch((err) => {
              addTransaction({
                hash: "contract-deployment-failed",
                chainId: loginAccount.chainId,
                seen: false,
                status: TX_STATUS.FAILURE,
                from: account,
                addedTime: new Date().getTime(),
                message: "contract deployment failed",
              });
            })
        }
        // first create a pool instrument


        // using poolData createPoolMarket
        createPoolMarket(
            account,
            loginAccount.library,
            vaultId,
            poolData.name,
            poolData.description,
            saleAmount,
            initPrice,
            promisedReturn,
            inceptionPrice,
            leverageFactor,
            deployedAddress ? deployedAddress : instrumentAddress
        ).then((txResponse) => {
          addTransaction({
            hash: txResponse.hash,
            chainId: loginAccount.chainId,
            status: TX_STATUS.PENDING,
            message: "creating instrument market..."
          });
          }).catch((err) => {
            addTransaction({
              hash: "market-creation-failed",
              chainId: loginAccount.chainId,
              seen: false,
              status: TX_STATUS.FAILURE,
              from: account,
              addedTime: new Date().getTime(),
              message: `Failed to create market from pool. ${err}`
            });
            return;
          })
    }, [poolData, collateralInfos, vaultId, vaults]);


    // remove collateralItem from collateralInfos given the index
    const removeCollateral = useCallback((index: number) => {
        setCollateralInfos((prev) => {
            let result = prev.filter((_, i) => i !== index);
            return result;
        });
    }, [collateralInfos]);

    // add empty collateralItem to collateralInfos
    const addCollateral = useCallback((e) => {
      e.preventDefault();
        setCollateralInfos((prev) => [...prev, {
            tokenAddress: "",
            tokenId: "",
            borrowAmount: "",
            maxAmount: "",
            isERC20: true
        }]);
    }, [collateralInfos]);

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
                Pool Proposal Form
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
                { generateTooltip("Name of the pool instrument", "name")}
              </div>
              
              <TextInput placeholder="Pool Instrument V0..." value={poolData.name} onChange={(val) => {
                setPoolData((prevData) => {
                    return {...prevData, name: val}
                })
              }}/>
            </div>
            <div>
              <div>
                <label>Symbol: </label>
                { generateTooltip("Symbol of the pool instrument", "symbol")}
              </div>
              
              <TextInput placeholder="POOL" value={poolData.symbol} onChange={(val) => {
                setPoolData((prevData) => {
                    return {...prevData, symbol: val}
                })
              }}/>
            </div>
            <div>
              <div>
                <label>Sale Amount: </label>
                { generateTooltip("Minimum vault underlying from managers for the approval of pool", "sale amount")}
              </div>
             

              <FormAmountInput
                updateAmount={(val) => {
                  console.log("val: ", val);
                  if (/^\d*\.?\d*$/.test(val)) {
                    setPoolData(prevData => {
                      return {...prevData, saleAmount: val}
                    })
                  }
                }}
                prepend={"$"}
                amount={poolData.saleAmount}
                label={underlyingSymbol}
              />
            </div>
            <div>
              <div>
                <label>LongZCB Initial Price: </label>
                { generateTooltip("Must be between 0 and 1", "initPrice")}
              </div>
              <FormAmountInput 
                updateAmount={
                  (val) => {
                    if (/^\d*\.?\d*$/.test(val)) {
                      setPoolData(prevData => {
                        return {...prevData, initPrice: val}
                      })
                    }
                  }
                }
                amount={poolData.initPrice}
                prepend={"$"}
                label={"longZCB/" +underlyingSymbol}
              />
            </div>
            <div>
              <div>
                <label>Long ZCB Inception Price: </label>
                { generateTooltip("Initial price of longZCB post approval, must be between 0 and 1", "inceptionPrice")}
              </div>
              <FormAmountInput 
                updateAmount={
                  (val) => {
                    if (/^\d*\.?\d*$/.test(val)) {
                      setPoolData(prevData => {
                        return {...prevData, inceptionPrice: val}
                      })
                    }
                  }
                }
                amount={poolData.inceptionPrice}
                prepend={"$"}
                label={"longZCB/" +underlyingSymbol}
              />
            </div>
            <div>
              <div>
                <label>Promised Return (Annualized): </label>
                { generateTooltip("Annualized promised compounding return rate to senior position", "promisedReturn")}
              </div>
              <FormAmountInput 
                updateAmount={
                  (val) => {
                    if (/^\d*\.?\d*$/.test(val)) {
                      setPoolData(prevData => {
                        return {...prevData, promisedReturn: val}
                      })
                    }
                  }
                }
                amount={poolData.promisedReturn}
                prepend={""}
                label={"%"}
              />
            </div>
            <div>
                <div>
                  <label>Leverage Factor: </label>
                  { generateTooltip("Determines the leverage for longZCB minters, higher levFactor means higher risk/reward. lower levFactor means more protection for senior vault token holders", "levFactor")}
                </div>
                <PoolLeverageFactor 
                leverageFactor={poolData.leverageFactor}
                setLeverageFactor={
                  (val) => {
                    if (/^\d*\.?\d*$/.test(val)) {
                      setPoolData(prevData => {
                        return {...prevData, leverageFactor: val}
                      })
                  }
                }}
                />
            </div>
            <div className={Styles.PoolCollaterals}>
                <div>
                    <div>
                      <label>Accepted Collateral</label>
                      { generateTooltip("Add accepted collateral for the lending pool", "collateral")}
                    </div>
                    <TinyThemeButton text="Add Collateral" action={addCollateral} small={true} noHighlight={true}/>
                </div>
                <section>
                {collateralInfos.map((collateralInfo, index) => { // address, isERC20, borrowAmount, maxAmount what are the decimals? decimals used in address of the collateral.
                    return (
                    <div  className={Styles.poolCollateralItem} key={vaultId + "-" + index} c>
                        <div>
                          <SingleCheckbox label={"ERC20"} initialSelected={collateralInfo.isERC20} updateSelected={(val) => {
                              setCollateralInfos(prevData => {
                                  return prevData.map((collateralInfo, i) => {
                                      if (i === index) {
                                          return {...collateralInfo, isERC20: val}
                                      } else {
                                          return collateralInfo;
                                      }
                                  })
                              })
                          }}/>
                          <div>
                              <label>Collateral Address: </label>
                              <input
                              type="text"
                              placeholder=""
                              value={ collateralInfo.tokenAddress }
                              onChange={(e) => {
                                  setCollateralInfos(prevData => {
                                      return prevData.map((collateralInfo, i) => {
                                          if (i === index) {
                                              return {...collateralInfo, tokenAddress: e.target.value}
                                          } else {
                                              return collateralInfo;
                                          }
                                      })
                                  })
                              }}
                              />
                          </div>
                          {! collateralInfo.isERC20 && (
                          <div>
                              <label>Token ID: </label>
                              <input
                              type="number"
                              placeholder=""
                              size={5}
                              value={ collateralInfo.tokenId }
                              onChange={(e) => {
                                  if (/^\d*$/.test(e.target.value)) {
                                      setCollateralInfos(prevData => {
                                          return prevData.map((collateralInfo, i) => {
                                              if (i === index) {
                                                  return {...collateralInfo, tokenId: e.target.value}
                                              } else {
                                                  return collateralInfo;
                                              }
                                          })
                                      })
                                  }
                              }}
                              />
                          </div>
                          )}
                        </div>
                        <div>
                          <div>
                            <label>Asset Max Liquidity</label>
                            <FormAmountInput 
                              amount={collateralInfo.borrowAmount}
                              prepend="$"
                              label={underlyingSymbol}
                              updateAmount={
                                (val) => {
                                    if (/^\d*\.?\d*$/.test(val)) {
                                        setCollateralInfos(prevData => {
                                            return prevData.map((collateralInfo, i) => {
                                                if (i === index) {
                                                    return {...collateralInfo, borrowAmount: val}
                                                } else {
                                                    return collateralInfo;
                                                }
                                            })
                                        })
                                    }
                                }
                              }
                            />
                          </div>
                          <div>
                          <label>Asset Borrow Liquidity</label>
                            <FormAmountInput
                              amount={collateralInfo.maxAmount}
                              prepend="$"
                              label={underlyingSymbol}
                              updateAmount={
                                (val) => {
                                    if (/^\d*\.?\d*$/.test(val)) {
                                        setCollateralInfos(prevData => {
                                            return prevData.map((collateralInfo, i) => {
                                                if (i === index) {
                                                    return {...collateralInfo, maxAmount: val}
                                                } else {
                                                    return collateralInfo;
                                                }
                                            })
                                        })
                                    }
                                }
                              }
                            />
                          </div>
                        </div>
                        <TinyThemeButton text="X" action={() => removeCollateral(index)} small={true}/>
                    </div>)
                })}
                </section>
                
            </div>
            <div className={Styles.Description}>
              <label>Description: </label>
              <textarea 
              rows="4" 
              cols="15" 
              placeholder="description..."
              onChange={(e) => {
                setPoolData(prevData => {
                    return {...prevData, description: e.target.value}
                  })
                }
              }
              value= { poolData.description }
              ></textarea>
            </div>
            <div>
              <div>
                <label>Instrument Address (optional): </label>
                { generateTooltip("leave empty if you want the pool instrument to be created for you", "name")}
              </div>
              <TextInput placeholder="0x..." value={instrumentAddress} onChange={(val) => {
                setInstrumentAddress(val)
              }}/>
            </div>
            <div>
              <SecondaryThemeButton 
              text={inputError ? inputMessage : "Submit Proposal"}
              action={inputError ? null : submitProposal} />
              <div>
                { deployedInstrument &&
                  (
                    <div>
                      <label>Deployed Instrument Address: </label>
                      <span>{ instrumentAddress }</span>
                    </div>
                  )
                }
              </div>
            </div>

            </div>
        );
}

export default PoolProposalView;


const validPositiveNumber = (val: string) => {
  if (!val || val.length === 0) {
    return false;
  }
  let num = new BN(val);
  return num.gt(new BN(0));
}


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
  } else if (!validPositiveNumber(saleAmount)) {
    inputError = true;
    inputMessage = "Sale Amount is required";
  } else if (!validPositiveNumber(initPrice)) { // must be greater than 1 but less than 0.
    inputError = true;
    inputMessage = "Initial Price is required";
  } else if (!validPositiveNumber(promisedReturn)) {
    inputError = true;
    inputMessage = "Promised Return is required";
  } else if (!validPositiveNumber(inceptionPrice)) {
    inputError = true;
    inputMessage = "Inception Price is required";
  } else if (!validPositiveNumber(leverageFactor)) {
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
      } else if (!validPositiveNumber(collateralInfo.borrowAmount)) {
        inputError = true;
        inputMessage = "Asset Borrow Liquidity is required";
      } else if (!validPositiveNumber(collateralInfo.maxAmount)) {
        inputError = true;
        inputMessage = "Asset Max Liquidity is required";
      }
    });
  }
  return {inputError, inputMessage};
}