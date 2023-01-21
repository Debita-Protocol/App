import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { generateTooltip, ValueLabel } from '@augurproject/comps/build/components/common/labels';
import { ExternalLink } from '@augurproject/comps/build/utils/links/links';
import { LinkIcon } from '@augurproject/comps/build/components/common/icons';


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

const { createPoolMarket, createPoolInstrument, isValidERC20, isValidERC721 } = ContractCalls2;
const {
  SelectionComps: { SquareDropdown, SingleCheckbox },
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
  const [deployedInstrument, setDeployedInstrument] = useState(false);
  const [poolData, setPoolData] = useState({
    description: "",
    name: "",
    symbol: "",
    saleAmount: "",
    initPrice: "",
    promisedReturn: "",
    inceptionPrice: "",
    leverageFactor: "1"
  });
  const [collateralInfos, setCollateralInfos] = useState<PoolCollateralItem[]>([]);
  const [instrumentAddress, setInstrumentAddress] = useState("");
  const [inputError, setInputError] = useState(false);
  const [inputMessage, setInputMessage] = useState("");

  //usePoolFormInputValdiation(account, loginAccount.library, poolData, collateralInfos, instrumentAddress);

  
  

  useEffect( () => {
    const inputValidation = async (account,
      library,
      {
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
      } else if (!validPositiveNumber(initPrice) || new BN(initPrice).gt(new BN(1))) {
        inputError = true;
        inputMessage = "Initial Price is invalid";
      } else if (!validPositiveNumber(promisedReturn)) {
        inputError = true;
        inputMessage = "Promised Return is invalid";
      } else if (
        !validPositiveNumber(inceptionPrice)
        || new BN(inceptionPrice).gt(new BN(1))
        || new BN(inceptionPrice).lte(new BN(initPrice))
      ) {
        inputError = true;
        inputMessage = "Inception Price is invalid";
      } else if (!validPositiveNumber(leverageFactor)) {
        inputError = true;
        inputMessage = "Leverage Factor is required";
      } else if (collateralInfos.length === 0) {
        inputError = true;
        inputMessage = "Collateral is required";
      } else if (instrumentAddress !== "" && !isAddress(instrumentAddress)) {
        inputError = true;
        inputMessage = "Instrument Address is not valid";
      } else if (collateralInfos.length > 0) {
        for (let i = 0; i < collateralInfos.length; i ++) {
          let collateralInfo = collateralInfos[i];
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
          } else if (new BN(collateralInfo.maxAmount).lte(new BN(collateralInfo.borrowAmount))) {
            inputError = true;
            inputMessage = "Asset Max Liquidity must be greater than Asset Borrow Liquidity";
          }  
          const validERC20 = await isValidERC20(account, library, collateralInfo.tokenAddress);
          const validERC721 = await isValidERC721(account, library, collateralInfo.tokenAddress);
          if (collateralInfo.isERC20 && ! validERC20) {
            inputError = true;
            inputMessage = "Collateral Address is not a valid ERC20";
          } else if (!collateralInfo.isERC20 && ! validERC721) {
            inputError = true;
            inputMessage = "Collateral Address is not a valid ERC721";
          }

          collateralInfos.forEach((item, j) => {
            if (i !== j && item.tokenAddress === collateralInfo.tokenAddress && item.tokenId === collateralInfo.tokenId) {
              inputError = true;
              inputMessage = "Collateral is duplicated";
            }
          })
        }
      }
      console.log("w/n inputError: ", inputError)
      console.log("w/n inputMessage: ", inputMessage)
      return { inputError, inputMessage };
    }
    if (account && loginAccount.library) {
      inputValidation(account, loginAccount.library, poolData, collateralInfos, instrumentAddress).then (
        ({ inputError: _err, inputMessage: _msg}) => {
          setInputError(_err);
          setInputMessage(_msg);
        }
      )
      
    }
  }, [inputError, inputMessage, collateralInfos, instrumentAddress, poolData, account, loginAccount])

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

  let deployedAddressLabel = (
    <div className={Styles.DeployedLabel}>
      <span>
        { LinkIcon}
      </span>
      <ValueLabel label={"Pool Contract Deployment"} value={instrumentAddress} />
    </div>
    
  )
  console.log("collateralInfos: ", collateralInfos)

  const submitProposal = useCallback(async () => {

    const saleAmount = new BN(poolData.saleAmount).shiftedBy(18).toFixed(0);
    const initPrice = new BN(poolData.initPrice).shiftedBy(18).toFixed(0);
    const inceptionPrice = new BN(poolData.inceptionPrice).shiftedBy(18).toFixed(0);
    const leverageFactor = new BN(poolData.leverageFactor).shiftedBy(18).toFixed(0);
    const promisedReturn = toCompoundingRatePerSec(parseFloat(poolData.promisedReturn) / 100).shiftedBy(18).toFixed(0);

    let deployedAddress;
    if (instrumentAddress === "") {
      try {
        const { response, instrumentAddress: _deployedAddress } = await createPoolInstrument(
          account,
          loginAccount.library,
          vaults[vaultId].address,
          vaults[vaultId].want.address,
          poolData.name,
          poolData.symbol,
          collateralInfos
        )
        deployedAddress = _deployedAddress;
        const { hash } = response
        setDeployedInstrument(true);
        setInstrumentAddress(_deployedAddress);
        addTransaction({
          hash,
          chainId: loginAccount.chainId,
          status: TX_STATUS.PENDING,
          message: "contract deployment pending at " + _deployedAddress + " ..."
        })
      } catch (err) {
        console.log("err", err);
        addTransaction({
          hash: "contract-deployment-failed",
          chainId: loginAccount.chainId,
          seen: false,
          status: TX_STATUS.FAILURE,
          from: account,
          addedTime: new Date().getTime(),
          message: "contract deployment failed",
        });
      }
    }

    try {
      const response = await createPoolMarket(
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
      )
      addTransaction({
        hash: response.hash,
        chainId: loginAccount.chainId,
        status: TX_STATUS.PENDING,
        message: "creating instrument market..."
      });
    } catch (err) {
      addTransaction({
        hash: "market-creation-failed",
        chainId: loginAccount.chainId,
        seen: false,
        status: TX_STATUS.FAILURE,
        from: account,
        addedTime: new Date().getTime(),
        message: `Failed to create market from pool. ${err}`
      });
    }
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
      tokenId: "0",
      borrowAmount: "",
      maxAmount: "",
      isERC20: true
    }]);
  }, [collateralInfos]);

  const underlyingSymbol = vaultId ? vaults[vaultId].want.symbol : "";

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
          {generateTooltip("Vault that the instrument will be attached to, vault underlying will be deposited to the instrument on instrument approval", "vault")}
          <label>Selected Vault: </label>
        </div>
        <SquareDropdown options={vaultOptions} onChange={(val) => setVaultId(val)} defaultValue={defaultVault} />
      </div>
      <div>
        <div>
          {generateTooltip("Name of the pool instrument", "name")}
          <label>Name: </label>

        </div>

        <TextInput placeholder="Pool Instrument V0..." value={poolData.name} onChange={(val) => {
          setPoolData((prevData) => {
            return { ...prevData, name: val }
          })
        }} />
      </div>
      <div>
        <div>
          {generateTooltip("Symbol of the pool instrument", "symbol")}
          <label>Symbol: </label>
        </div>

        <TextInput placeholder="POOL" value={poolData.symbol} onChange={(val) => {
          setPoolData((prevData) => {
            return { ...prevData, symbol: val }
          })
        }} />
      </div>
      <div>
        <div>
          {generateTooltip("Minimum vault underlying from managers for the approval of pool", "sale amount")}
          <label>Sale Amount: </label>
        </div>
        <FormAmountInput
          updateAmount={(val) => {
            console.log("val: ", val);
            setPoolData(prevData => {
              return { ...prevData, saleAmount: val }
            })
          }}
          prepend={"$"}
          amount={poolData.saleAmount}
          label={underlyingSymbol}
        />
      </div>
      <div>
        <div>
          {generateTooltip("Must be between 0 and 1", "initPrice")}
          <label>LongZCB Initial Price: </label>
        </div>
        <FormAmountInput
          updateAmount={
            (val) => {
              setPoolData(prevData => {
                return { ...prevData, initPrice: val }
              })
            }
          }
          amount={poolData.initPrice}
          prepend={"$"}
          label={"longZCB/" + underlyingSymbol}
        />
      </div>
      <div>
        <div>
          {generateTooltip("Initial price of longZCB post approval, must be between 0 and 1 + greater than initialPrice", "inceptionPrice")}
          <label>Long ZCB Inception Price: </label>
        </div>
        <FormAmountInput
          updateAmount={
            (val) => {
              setPoolData(prevData => {
                return { ...prevData, inceptionPrice: val }
              })
            }
          }
          amount={poolData.inceptionPrice}
          prepend={"$"}
          label={"longZCB/" + underlyingSymbol}
        />
      </div>
      <div>
        <div>
          {generateTooltip("Annualized promised compounding return rate to senior position", "promisedReturn")}
          <label>Promised Return (Annualized): </label>
        </div>
        <FormAmountInput
          updateAmount={
            (val) => {
              setPoolData(prevData => {
                return { ...prevData, promisedReturn: val }
              })
            }
          }
          amount={poolData.promisedReturn}
          prepend={""}
          label={"%"}
        />
      </div>
      <div>
        <div>
          {generateTooltip("Determines the leverage for longZCB minters, higher levFactor means higher risk/reward. lower levFactor means more protection for senior vault token holders", "levFactor")}
          <label>Leverage Factor: </label>
        </div>
        <PoolLeverageFactor
          leverageFactor={poolData.leverageFactor}
          setLeverageFactor={
            (val) => {
              setPoolData(prevData => {
                return { ...prevData, leverageFactor: val }
              })
            }}
        />
      </div>
      <div className={Styles.PoolCollaterals}>
        <div>
          <div>
            {generateTooltip("Add accepted collateral for the lending pool", "collateral")}
            <label>Accepted Collateral</label>
          </div>
          <TinyThemeButton text="Add Collateral" action={addCollateral} small={true} noHighlight={true} />
        </div>
        <section>
          {collateralInfos.map((collateralInfo, index) => { // address, isERC20, borrowAmount, maxAmount what are the decimals? decimals used in address of the collateral.
            const { tokenAddress, tokenId } = collateralInfo;
            return (
              <div className={Styles.poolCollateralItem} key={vaultId + "-" + index} c>
                <div>
                  <SingleCheckbox label={"ERC20"} initialSelected={true} updateSelected={(val) => {
                    setCollateralInfos(prevData => {
                      return prevData.map((item, i) => {
                        if (i === index) {
                          return { ...item, isERC20: val, tokenId: val ? "0" : item.tokenId }
                        } else {
                          return item;
                        }
                      })
                    })
                  }} />
                  <div>
                    <label>Collateral Address: </label>
                    <TextInput
                      placeholder="0x..."
                      value={collateralInfo.tokenAddress}
                      onChange={(val) => {
                        setCollateralInfos(prevData => {
                          return prevData.map((item, i) => {
                            if (i === index) {
                              return { ...item, tokenAddress: val }
                            } else {

                              return item;
                            }
                          })
                        })
                      }}
                    />
                  </div>
                  {!collateralInfo.isERC20 && (
                    <div>
                      <label>Token ID: </label>
                      <FormAmountInput 
                        prepend=""
                        amount={collateralInfo.tokenId}
                        updateAmount={
                          (val) => {
                            setCollateralInfos(prevData => {
                              return prevData.map((item, i) => {
                                if (i === index) {
                                  return { ...item, tokenId: val }
                                } else {
                                  return item;
                                }
                              })
                            })
                          }
                        }
                      />
                    </div>
                  )}
                </div>
                <div>
                  <div>
                    <div>
                      {generateTooltip("Determines the maximum debt amount for a user before liquidation", "maxAmount")}
                      <label>Asset Max Liquidity</label>
                    </div>
                    
                    <FormAmountInput
                      amount={collateralInfo.maxAmount}
                      prepend="$"
                      label={underlyingSymbol}
                      updateAmount={
                        (val) => {
                          setCollateralInfos(prevData => {
                            return prevData.map((collateralInfo, i) => {
                              if (i === index) {
                                return { ...collateralInfo, maxAmount: val }
                              } else {
                                return collateralInfo;
                              }
                            })
                          })
                        }
                      }
                    />
                  </div>
                  <div>
                    <div>
                      {generateTooltip("Determines the maximum loan amount a user can borrow per unit of collateral", "maxBorrow")}
                      <label>Asset Borrow Liquidity</label>
                    </div>
                    
                    <FormAmountInput
                      amount={collateralInfo.borrowAmount}
                      prepend="$"
                      label={underlyingSymbol}
                      updateAmount={
                        (val) => {
                          setCollateralInfos(prevData => {
                            return prevData.map((collateralInfo, i) => {
                              if (i === index) {
                                return { ...collateralInfo, borrowAmount: val }
                              } else {
                                return collateralInfo;
                              }
                            })
                          })
                        }
                      }
                    />
                  </div>
                </div>
                <TinyThemeButton text="remove" action={() => removeCollateral(index)} small={true} />
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
              return { ...prevData, description: e.target.value }
            })
          }
          }
          value={poolData.description}
        ></textarea>
      </div>
      {/* <div>
        <div>
          {generateTooltip("leave empty if you want the pool instrument to be created for you", "name")}
          <label>Instrument Address (optional): </label>
        </div>
        <TextInput placeholder="0x..." value={instrumentAddress} onChange={(val) => {
          setInstrumentAddress(val)
        }} />
      </div> */}
      <div>
        <SecondaryThemeButton
          text={inputError ? inputMessage : "Submit Proposal"}
          action={inputError ? null : submitProposal} />
        <div>
          {deployedInstrument &&
            (
              <ExternalLink URL={"https://mumbai.polygonscan.com/address/" + instrumentAddress} label={deployedAddressLabel}>

              </ExternalLink>
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