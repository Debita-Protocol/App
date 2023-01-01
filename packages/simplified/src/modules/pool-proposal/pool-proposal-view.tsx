import React, {useEffect, useState, useMemo, useCallback} from 'react';
import { Components, ContractCalls2, useUserStore, useDataStore2 } from '@augurproject/comps';
import { Collateral, VaultInfos } from '@augurproject/comps/build/types';
import Styles from "./pool-proposal-view.styles.less";
import _ from "lodash";
import { BigNumber as BN } from "bignumber.js";

const { createPoolMarket, createPoolInstrument, addAcceptedCollaterals} = ContractCalls2;
const {
    SelectionComps: {SquareDropdown, SingleCheckbox},
    ButtonComps: { SecondaryThemeButton, TinyThemeButton },
    InputComps: { TextInput, AmountInput }
} = Components;

interface CollateralItem {
    tokenAddress: string;
    tokenId: string;
    borrowAmount: string;
    maxAmount: string;
    isERC20: boolean;
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
          setVaultId(_vaultOptions[0].value);
        }
        return _vaultOptions;
      }, [vaults]);
      let chosenCash = vaultId !== "" ? vaults[vaultId].want.name : "";
    // poolData.saleAmount = principal/4; 
    // poolData.initPrice = 7e17; 
    // poolData.promisedReturn = 3000000000; 
    // poolData.inceptionTime = block.timestamp; 
    // poolData.inceptionPrice = 8e17; 
    // poolData.leverageFactor = 3e18; 
    // /^0x[a-fA-F0-9]{40}$/.test(e.target.value)

    const submitProposal = useCallback(async () => {

        console.log("vault address: ", vaults[vaultId].address)
        console.log("want: ", vaults[vaultId].want.address);  
        console.log("poolData: ", poolData);
        console.log("collateralInfos: ", collateralInfos);

        const saleAmount = new BN(poolData.saleAmount).shiftedBy(18).toFixed();
        const initPrice = new BN(poolData.initPrice).shiftedBy(18).toFixed();
        const promisedReturn = new BN(poolData.promisedReturn).shiftedBy(18).toFixed();
        const inceptionPrice = new BN(poolData.inceptionPrice).shiftedBy(18).toFixed();
        const leverageFactor = new BN(poolData.leverageFactor).shiftedBy(18).toFixed();

        
        // first create a pool instrument
        const poolInstrumentAddress = await createPoolInstrument(
            account,
            loginAccount.library,
            vaults[vaultId].address,
            vaults[vaultId].want.address,
            poolData.name,
            poolData.symbol
        );
        console.log("Address of the pool instrument: ", poolInstrumentAddress);
        // using poolData createPoolMarket
        // const marketId = await createPoolMarket(
        //     account,
        //     loginAccount.library,
        //     vaultId,
        //     poolData.name,
        //     poolData.description,
        //     saleAmount,
        //     initPrice,
        //     promisedReturn,
        //     inceptionPrice,
        //     leverageFactor,
        //     poolInstrumentAddress
        // );

        // await addAcceptedCollaterals(
        //     account,
        //     loginAccount.library,
        //     marketId,
        //     collateralInfos
        // )

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
            <h3>
              Pool Proposal Form
            </h3>
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
              <AmountInput 
                updateInitialAmount={
                  (val) => {
                    if (/^\d*\.?\d*$/.test(val)) {
                      setPoolData(prevData => {
                        return {...prevData, saleAmount: val}
                      })
                    }
                  }
                }
                initialAmount={poolData.saleAmount}
                chosenCash={chosenCash}
              />
            </div>
            <div>
              <label>Initial Price: </label>
              <AmountInput 
                updateInitialAmount={
                  (val) => {
                    if (/^\d*\.?\d*$/.test(val)) {
                      setPoolData(prevData => {
                        return {...prevData, initPrice: val}
                      })
                    }
                  }
                }
                initialAmount={poolData.initPrice}
                chosenCash={chosenCash}
              />
            </div>
            <div>
              <label>Inception Price: </label>
              <AmountInput 
                updateInitialAmount={
                  (val) => {
                    if (/^\d*\.?\d*$/.test(val)) {
                      setPoolData(prevData => {
                        return {...prevData, inceptionPrice: val}
                      })
                    }
                  }
                }
                initialAmount={poolData.inceptionPrice}
                chosenCash={chosenCash}
              />
            </div>
            <div>
              <label>Promised Return: </label>
              <AmountInput 
                updateInitialAmount={
                  (val) => {
                    if (/^\d*\.?\d*$/.test(val)) {
                      setPoolData(prevData => {
                        return {...prevData, promisedReturn: val}
                      })
                    }
                  }
                }
                initialAmount={poolData.promisedReturn}
                chosenCash={chosenCash}
              />
            </div>
            <div>
                <label>Leverage Factor: </label>
                <input 
                type="text"
                placeholder="0.0"
                value={ poolData.leverageFactor }
                onChange={(e) => {
                    if (/^\d*\.?\d*$/.test(e.target.value)) {
                        setPoolData(prevData => {
                            return {...prevData, leverageFactor: e.target.value}
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
                    <div  key={vaultId + "-" + index}>
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
                            <div className={Styles.TokenAddress}>
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
                                <div className={Styles.TokenId}>
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
                            <div>
                                <AmountInput 
                                    updateInitialAmount={
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
                                    initialAmount={collateralInfo.borrowAmount}
                                    chosenCash={chosenCash}
                                    heading={"Asset Borrow Liquidity"}
                                />
                            </div>
                            <div>
                                <AmountInput 
                                    updateInitialAmount={
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
                                    initialAmount={collateralInfo.maxAmount}
                                    chosenCash={chosenCash}
                                    heading={"Asset Max Liquidity"}
                                />
                            </div>
                            <TinyThemeButton text="-" action={() => removeCollateral(index)} small={true}/>
                        </div>
                    </div>
                    
                        )

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
              <SecondaryThemeButton text="submit" action={submitProposal} />
            </div>
            </div>
          </>
        );
}

export default PoolProposalView;