import React, {useEffect, useState, useMemo, useCallback} from 'react';
import { Components, ContractCalls2, useUserStore, useDataStore2 } from '@augurproject/comps';
import { Collateral, VaultInfos } from '@augurproject/comps/build/types';
import Styles from "./pool-proposal-view.styles.less";
import _ from "lodash";
import { BigNumber as BN } from "bignumber.js";
import classNames from "classnames";
import { PoolLeverageFactor } from "../common/slippage";
import { isAddress } from '@ethersproject/address';


const { createPoolMarket, createPoolInstrument, addAcceptedCollaterals} = ContractCalls2;
const {
    SelectionComps: {SquareDropdown, SingleCheckbox},
    ButtonComps: { SecondaryThemeButton, TinyThemeButton },
    InputComps: { TextInput, AmountInput },
    
} = Components;

interface CollateralItem {
    tokenAddress: string;
    tokenId: string;
    borrowAmount: string;
    maxAmount: string;
    isERC20: boolean;
}

export const FormAmountInput = ({amount, updateAmount, prepend }) => {
  const [_amount, _setAmount] = useState(amount);
  
  return (
    <div className={classNames(Styles.FormAmountInput, {
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
    </div>
    
  )
}


const PoolProposalView: React.FC = () => {
    const {
        account,
        balances,
        loginAccount,
        actions: { addTransaction },
      } = useUserStore();
    const { vaults } = useDataStore2();

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
    const [ collateralInfos, setCollateralInfos] = useState<CollateralItem[]>([]);

    const {inputError, inputMessage} = usePoolFormInputValdiation(poolData, collateralInfos); 
    

    const [ vaultId, setVaultId ] = useState("");
    const [ defaultVault, setDefaultVault] = useState("");
    console.log("vaultId: ", vaultId);
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
          setVaultId(_vaultOptions[0].value);
        }
        return _vaultOptions;
      }, [vaults]);
      let chosenCash = vaultId !== "" ? vaults[vaultId].want.name : "";

    const submitProposal = useCallback(async () => {

        // console.log("vault address: ", vaults[vaultId].address)
        // console.log("want: ", vaults[vaultId].want.address);  
        // console.log("poolData: ", poolData);
        // console.log("collateralInfos: ", collateralInfos);

        const saleAmount = new BN(poolData.saleAmount).shiftedBy(18).toFixed();
        const initPrice = new BN(poolData.initPrice).shiftedBy(18).toFixed();
        const promisedReturn = new BN(poolData.promisedReturn).shiftedBy(18).toFixed();
        const inceptionPrice = new BN(poolData.inceptionPrice).shiftedBy(18).toFixed();
        const leverageFactor = new BN(poolData.leverageFactor).shiftedBy(18).toFixed();

        // console.log("saleAmount: ", saleAmount);
        // console.log("initPrice: ", initPrice);
        // console.log("promisedReturn: ", promisedReturn);
        // console.log("inceptionPrice: ", inceptionPrice);
        // console.log("leverageFactor: ", leverageFactor);


        
        // first create a pool instrument
        const poolInstrumentAddress = await createPoolInstrument(
            account,
            loginAccount.library,
            vaults[vaultId].address,
            vaults[vaultId].want.address,
            poolData.name,
            poolData.symbol
        );

        // using poolData createPoolMarket
        const marketId = await createPoolMarket(
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
            poolInstrumentAddress
        );

        await addAcceptedCollaterals(
            account,
            loginAccount.library,
            marketId,
            collateralInfos
        );
    }, [poolData, collateralInfos, vaultId, vaults]);


    // remove collateralItem from collateralInfos given the index
    const removeCollateral = useCallback((index: number) => {
        setCollateralInfos((prev) => {
            let result = prev.filter((_, i) => i !== index);
            return result;
        });
    }, [collateralInfos]);

    // add empty collateralItem to collateralInfos
    const addCollateral = useCallback(() => {
        setCollateralInfos((prev) => [...prev, {
            tokenAddress: "",
            tokenId: "",
            borrowAmount: "",
            maxAmount: "",
            isERC20: true
        }]);
    }, [collateralInfos]);
    
    return (
        <>
          <div className={Styles.PoolProposalForm}>
            {/* <SUPER_BUTTON /> */}
            <div>
              <h3>
                Pool Proposal Form
              </h3>
            </div>
            <div>
              <label>Selected Vault: </label>
              <SquareDropdown options={vaultOptions} onChange={(val) => setVaultId(val)} defaultValue={defaultVault}/>
            </div>
            <div>
              <label>Name: </label>
              <TextInput placeholder="" value={poolData.name} onChange={(val) => {
                setPoolData((prevData) => {
                    return {...prevData, name: val}
                })
              }}/>
            </div>
            <div>
              <label>Symbol: </label>
              <TextInput placeholder="" value={poolData.symbol} onChange={(val) => {
                setPoolData((prevData) => {
                    return {...prevData, symbol: val}
                })
              }}/>
            </div>
            <div>
              <label>Sale Amount: </label>
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
              />
            </div>
            <div>
              <label>Initial Price: </label>
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
              />
            </div>
            <div>
              <label>Inception Price: </label>
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
              />
            </div>
            <div>
              <label>Promised Return: </label>
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
                prepend={"$"}
              />
            </div>
            <div>
                <label>Leverage Factor: </label>
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
                    <label>Accepted Collateral</label>
                    <TinyThemeButton text="+" action={addCollateral} small={true}/>
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
              placeholder=""
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
              <SecondaryThemeButton 
              text={inputError ? inputMessage : "Submit Proposal"}
              action={inputError ? null : submitProposal} />
            </div>
            </div>
          </>
        );
}

export default PoolProposalView;

const usePoolFormInputValdiation = ({
  description,
  name,
  symbol,
  saleAmount,
  initPrice,
  promisedReturn,
  inceptionPrice,
  leverageFactor
}, collateralInfos) => {
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
  } else {
    collateralInfos.forEach((collateralInfo) => {
      // check whether collateral address is valid
      if (collateralInfo.tokenAddress.length === 0 || !isAddress(collateralInfo.tokenAddress)) {
        inputError = true;
        inputMessage = "Collateral Address is required";
      } else if (!collateralInfo.isERC20 && collateralInfo.tokenId.length > 0) {
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