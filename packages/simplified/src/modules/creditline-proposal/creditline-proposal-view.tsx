import React, { useCallback, useEffect, useState, useContext, useMemo } from "react";
import BigNumber, { BigNumber as BN } from "bignumber.js";
import { calculateTotalDebt } from "utils/interest";
import {
    useUserStore,
    ContractCalls,
    Components,
    InputComps,
    ContractCalls2
  } from "@augurproject/comps";

import _ from "lodash"

import { BaseThemeButtonProps } from "@augurproject/comps/build/components/common/buttons";
import { MARKETS_LIST_HEAD_TAGS } from "../seo-config";

// @ts-ignore
import Styles from "./creditline-proposal-view.styles.less";

import { SUPER_BUTTON } from "../common/super-button";
import { useHistory } from "react-router-dom"
//import Calendar from 'react-calendar'; => to do later.
import { utils, constants } from "ethers";

import { useDataStore2 } from "@augurproject/comps";
import { VaultInfos } from "@augurproject/comps/build/types";
import { SingleCheckbox } from "@augurproject/comps/build/components/common/selection";
import {FormAmountInput} from "../pool-proposal/pool-proposal-view";
import { generateTooltip } from "@augurproject/comps/build/components/common/labels";

const { formatBytes32String, isAddress } = utils;


const {
    SelectionComps: { SquareDropdown },
    ButtonComps: { SecondaryThemeButton },
    InputComps: { TextInput, AmountInput },
  } = Components;


const { createCreditLineInstrument,   createCreditlineMarket } = ContractCalls2;



const DurationInput = ({onChange, label, value}) => {
  return (
    <div>
      <label>{ label }</label>
      <input
        type="text"
        placeholder="0"
        value={ value }
        onChange={ onChange }
      />
    </div>
  );
}

const CreditLineRequestForm = () => {
  const {
    account,
    balances,
    loginAccount,
    actions: { addTransaction },
  } = useUserStore();
  const { vaults } = useDataStore2();

  const [ principal, setPrincipal ] = useState("");
  const [ duration, setDuration ] = useState({
    days: ""
  });
  const [ inputError, setInputError ] = useState("");
  const [ interestRate, setInterestRate ] = useState("");
  const [ description, setDescription] = useState("");
  const [ vaultId, setVaultId ] = useState("");
  const [ defaultVault, setDefaultVault] = useState("");
  const [name, setName] = useState("");
  const [collateralType, setCollateralType] = useState("0");
  const [collateral, setCollateral] = useState("");
  const [collateralBalance, setCollateralBalance] = useState("");
  // const [createdContract, setCreatedContract] = useState(false);
  // const [instrumentAddress, setInstrumentAddress] = useState("");

  const checkInput = (
    total_duration: BigNumber,
    interest: BigNumber,
    principal: BigNumber,
    description: string,
    name: string,
    collateralType: string,
    collateral: string,
    collateralBalance: string,
    // instrumentAddress: string
  ) : boolean => {
    if (total_duration.isEqualTo(new BigNumber(0))) {
      setInputError("Duration must be greater than 0")
      return false;
    } else if (interest.isEqualTo(new BigNumber(0))) {
      setInputError("Interest must be greater than 0")
      return false
    } else if (principal.isEqualTo(new BigNumber(0))) {
      setInputError("Principal must be greater than 0")
      return false
    } else if (description === "") {
      setInputError("Must have a description")
      return false
    } else if (name === "") {
      setInputError("Must have a name")
      return false
    } else if (collateralType === "0") {
      if (!isAddress(collateral) || Number(collateralBalance) === 0) {
        setInputError("Collateral must be a valid address and have a balance")
        return false
      }
    }
    try {
      let _name = formatBytes32String(name);
    } catch (err) {
      setInputError("Name must be a valid string")
      return false
    }
    return true;
  }

  const reset = () => {
    setPrincipal("");
    setDuration({
      years: "0",
      weeks: "0",
      days: "0",
      minutes: "0",
    });
    setInterestRate("")
    setDescription("")
  }

  const submitProposal = useCallback(async (e)=> {
    e.preventDefault()

    let total_duration = new BN(365*24*60*60*Number(duration.years) + 7*24*60*60*Number(duration.weeks) + 24*60*60*Number(duration.days) + 30*24*60*60*Number(duration.months)).toString();
    
    // total interest accrued
    let interest = new BN(total_duration).div(365*24*60*60).multipliedBy(new BN(interestRate).div(100).multipliedBy(principal)).toString()

    if (checkInput(
      new BN(total_duration),
      new BN(interest),
      new BN(principal),
      description,
      name,
      collateralType,
      collateral,
      collateralBalance
      // instrumentAddress
    )) {
      reset();
      
    }
  })

  const createCreditline = useCallback(async (e) => {
    e.preventDefault();
    console.log("A");
    let total_duration = new BN(24*60*60*Number(duration.days)).toString();
    
    // total interest accrued
    let interest = new BN(total_duration).div(365*24*60*60).multipliedBy(new BN(interestRate).div(100).multipliedBy(principal)).toString()
    if (checkInput(
      new BN(total_duration),
      new BN(interest),
      new BN(principal),
      description,
      name,
      collateralType,
      collateral,
      collateralBalance,
      // instrumentAddress
    )) {
      console.log("creating instrument");
      let _principal = new BN(principal).shiftedBy(18).toFixed(0);
      console.log("principal: ", _principal);
      let _interest = new BN(interest).shiftedBy(18).toFixed(0);
      console.log("interes: ", _interest);
      console.log("collateral type: ", collateralType);
      console.log("name: ", formatBytes32String(name));
      if (collateralType === "3") {
        try {
          let instrument_address = await createCreditLineInstrument(
            account, loginAccount.library, vaults[vaultId].address , _principal, _interest, total_duration, constants.AddressZero, "0", collateralType
            );
          console.log("instrument address: ", instrument_address);
          // log all the arguments
          await createCreditlineMarket(
            account, loginAccount.library, name, instrument_address, vaultId, _principal, _interest, description, total_duration
          );
          console.log("done");
        } catch (err) {
          console.log(err);
        }
      }
    }
  })

  
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

  console.log("vaultId: ", vaultId);
  let chosenCash = vaultId !== "" ? vaults[vaultId].want.name : "";

  let collateralOptions = [
    {
      label: "Liquid",
      value: "0"
    },
    {
      label: "NonLiquid",
      value: "1"
    },
    {
      label: "Ownership",
      value: "2"
    },
    {
      label: "None",
      value: "3"
    }
  ]

  // const buttonProps: BaseThemeButtonProps = {
  //   text: createdContract ? "Submit" : "Create Contract",
  //   action: createdContract ? submitProposal : createCreditline 
  // };
  const buttonProps: BaseThemeButtonProps = {
    text: "Submit",
    action: createCreditline
  }

  return (
    <div className={Styles.CreditlineProposalForm}>
      {/* <SUPER_BUTTON /> */}
      <div>
        <h3>
          Creditline Proposal Form
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
          <label>Collateral Type: </label>
          { generateTooltip("Collateral type for the instrument", "collateral")}
        </div>
        <SquareDropdown options={collateralOptions} onChange={(val) => setCollateralType(val)} defaultValue={collateralType}/>
      </div>
      {collateralType === "0" && (
        <div>
          <div>
            <label>Collateral Address: </label>
            <TextInput placeholder="" value={collateral} onChange={(val) => setCollateral(val)}/>
          </div>
          <div>
            <label>Collateral Balance: </label>
            <FormAmountInput 
              updateAmount={
                (val) => {
                  if (/^\d*\.?\d*$/.test(val)) {
                    setCollateralBalance(val)
                  }
                }
              }
              amount={collateralBalance}
              prepend="$"
            />
          </div>
        </div>
      )}
      <div>
        <label>Name: </label>
        <TextInput placeholder="" value={name} onChange={(val) => setName(val)}/>
      </div>
      <div>
        <label>Principal: </label>

        <FormAmountInput 
          updateAmount={
            (val) => {
              if (/^\d*\.?\d*$/.test(val)) {
                setPrincipal(val)
              }
            }
          }
          amount={principal}
          prepend={"$"}
        />
      </div>
      <div>
        <label>Annual Interest Rate: </label>
        <FormAmountInput 
          amount={ interestRate }
          updateAmount={(val) => {
            if (/^\d*\.?\d*$/.test(val)) {
              setInterestRate(val);
            }
          }}
          prepend={"%"}
        />
      </div>
      <section className={Styles.Duration}>
        <label>Duration: </label>
        <DurationInput label="days" value={duration.days} onChange={(e)=> {
          if (/^\d*$/.test(e.target.value)) {
            setDuration((prev) => { return {...prev, days: e.target.value}})
          }
        }}/>
        
      </section>
      <div className={Styles.Description}>
        <label>Description: </label>
        <textarea 
        rows="4" 
        cols="15" 
        placeholder=""
        onChange={(e) => {
            setDescription(e.target.value)
          }
        }
        value= { description }
        ></textarea>
      </div>
      <div>
      { inputError }
      </div>
      {/* <div>
        <SingleCheckbox label={"Existing Address"} initialSelected={false} updateSelected={setCreatedContract}/>
      </div>
      {createdContract && (
        <div>
          <label>Contract Address: </label>
          <TextInput placeholder="" value={instrumentAddress} onChange={(val) => setInstrumentAddress(val)}/>
        </div>
      )} */}
      <div>
        <SecondaryThemeButton {... buttonProps} />
      </div>
    </div>
  );
}

//to do => register user and then, have user submit a loan.

const CreditLineProposalView = () => {
  const {
    account,
    balances,
    loginAccount,
    actions: { addTransaction },
  } = useUserStore();
  
  // for testing
  // const {
  //   isLogged
  // } = useAppStatusStore();



  if (false) {
    return (
      <>
      <div className={Styles.CreditLineProposalView}>
        <h2>
          Please connect your account to see this page...
        </h2>
      </div>
      </>
    );
  } else {
    return (
      <CreditLineRequestForm />
      );
  }
  
};

export default CreditLineProposalView;