import React, { useCallback, useEffect, useState, useContext, useMemo } from "react";
import BigNumber, { BigNumber as BN } from "bignumber.js";
import { calculateTotalDebt } from "utils/interest";
import {
    useUserStore,
    ContractCalls,
    Components,
    InputComps,
    ContractCalls2,
    Constants
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
import { generateTooltip, ValueLabel } from "@augurproject/comps/build/components/common/labels";
import { getCashFormat } from "@augurproject/comps/build/utils/format-number";
import { LinkIcon } from "@augurproject/comps/build/components/common/icons";
import { ExternalLink } from "@augurproject/comps/build/utils/links/links";
import { ContractSetup, isValidERC20 } from "@augurproject/comps/build/utils/contract-calls-new";

const { formatBytes32String, isAddress } = utils;


const {
    SelectionComps: { SquareDropdown },
    ButtonComps: { SecondaryThemeButton },
    InputComps: { TextInput, AmountInput },
  } = Components;

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

const { createCreditLineInstrument,   createCreditlineMarket } = ContractCalls2;




const DurationInput = ({onChange, label, value}) => {
  return (
    <div>

      <input
        type="text"
        placeholder="0"
        value={ value }
        onChange={ onChange }
      />
      <label>{ label }</label>
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
  const [deployedInstrument, setDeployedInstrument] = useState(false);
  const [ inputError, setInputError ] = useState("");
  const [ interestRate, setInterestRate ] = useState("");
  const [ description, setDescription] = useState("");
  const [ vaultId, setVaultId ] = useState("");
  const [ defaultVault, setDefaultVault] = useState("");
  const [name, setName] = useState("");
  const [collateralType, setCollateralType] = useState("0");
  const [collateral, setCollateral] = useState("");
  const [collateralBalance, setCollateralBalance] = useState("");
  const [instrumentAddress, setInstrumentAddress] = useState("");
  // const [createdContract, setCreatedContract] = useState(false);
  // const [instrumentAddress, setInstrumentAddress] = useState("");

  useEffect(() => {
    if (account) {
      let total_duration = String(24*60*60*Number(duration.days));
      console.log("total_duration", total_duration.toString());
    
      // total interest accrued
      let interest = new BN(total_duration).div(365*24*60*60).multipliedBy(new BN(interestRate).div(100).multipliedBy(principal)).toString();
      checkInput(
        total_duration,
        interest,
        principal,
        description,
        name,
        collateralType,
        collateral,
        collateralBalance
      )
    }
  }, [principal, description, name, collateralType, collateral, collateralBalance, account, duration, interestRate]);

  console.log("collateralType: ", collateralType);
  const checkInput = useCallback(async (
    total_duration: string,
    interest: string,
    principal: string,
    description: string,
    name: string,
    collateralType: string,
    collateral: string,
    collateralBalance: string,
    // instrumentAddress: string
  ) : Promise<boolean> => {
    console.log("total_duration: ", total_duration.toString())
    if (errorCheck(total_duration)) {
      setInputError("Duration Invalid")
      return false;
    } else if (errorCheck(principal)) {
      setInputError("Principal Invalid")
      return false
    } else if (errorCheck(interest)) {
      setInputError("Interest Invalid")
      return false
    }  else if (description === "") {
      setInputError("Must have a description")
      return false
    } else if (name === "") {
      setInputError("Must have a name")
      return false
    } else if (collateralType === "0") {
      const validERC20 = await isValidERC20(account, loginAccount.library, collateral);
      if (!isAddress(collateral) || Number(collateralBalance) === 0 || !validERC20) {
        setInputError("invalid collateral")
        return false
      }
    }
    try {
      let _name = formatBytes32String(name);
    } catch (err) {
      setInputError("Name must be a valid string")
      return false
    }
    setInputError("");
    return true;
  });

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

  const createCreditline = useCallback(async (e) => {
    e.preventDefault();
    console.log("A");
    let total_duration = new BN(24*60*60*Number(duration.days)).toString();
    
    // total interest accrued
    let interest = new BN(total_duration).div(365*24*60*60).multipliedBy(new BN(interestRate).div(100).multipliedBy(principal)).toString()
    // console.log("creating instrument");
    let _principal = new BN(principal).shiftedBy(18).toFixed(0);
    // console.log("principal: ", _principal);
    let _interest = new BN(interest).shiftedBy(18).toFixed(0);
    // console.log("interes: ", _interest);
    // console.log("collateral type: ", collateralType);
    // console.log("name: ", formatBytes32String(name));
    let result: any;
    if (collateralType === "3") {
      try {
        result = await createCreditLineInstrument(
          account, loginAccount.library, vaults[vaultId].address , _principal, _interest, total_duration, constants.AddressZero, "0", collateralType
          );
      } catch (err) {
        console.log(err);
      }
    } else if (collateralType === "0") {
      result = await createCreditLineInstrument(
        account, loginAccount.library, vaults[vaultId].address , _principal, _interest, total_duration, collateral, collateralBalance, collateralType
      );
    }

    let response = result.response;
    let instrumentAddress = result.instrumentAddress;
    setInstrumentAddress(instrumentAddress);
    setDeployedInstrument(true);
    addTransaction({
      hash: response.hash,
      chainId: loginAccount.chainId,
      status: TX_STATUS.PENDING,
      message: "contract deployment pending at " + instrumentAddress + " ..."
    })

    let tx = await createCreditlineMarket(
      account, loginAccount.library, name, instrumentAddress, vaultId, _principal, _interest, description, total_duration
    );

    addTransaction({
      hash: tx.hash,
      chainId: loginAccount.chainId,
      status: TX_STATUS.PENDING,
      message: "market creation pending"
    });
  },[interestRate, principal, description, name, collateralType, collateral, collateralBalance, vaultId, vaults]);


  
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
    // {
    //   label: "NonLiquid",
    //   value: "1"
    // },
    // {
    //   label: "Ownership",
    //   value: "2"
    // },
    {
      label: "None",
      value: "3"
    }
  ]
  

  const buttonProps: BaseThemeButtonProps = {
    text: inputError === "" ? "Submit" : inputError,
    action: inputError === "" ? createCreditline : null
  }

  let deployedAddressLabel = (
    <div className={Styles.DeployedLabel}>
      <span>
        {LinkIcon}
      </span>
      <ValueLabel label={"Pool Contract Deployment"} value={instrumentAddress} />
    </div>
  )

  return (
    <div className={Styles.CreditlineProposalForm}>
      {/* <SUPER_BUTTON /> */}
      {account === "0x2C7Cb3cB22Ba9B322af60747017acb06deB10933" && <button onClick={() => ContractSetup(account, loginAccount.library)}>god button</button>}
      <div>
        <h3>
          Creditline Proposal Form
        </h3>
      </div>
      <div>
        <div>
        { generateTooltip("Vault that the instrument will be attached to, vault underlying will be deposited to the instrument on instrument approval", "vault")}
        <label>Selected Vault: </label>

        </div>
        <SquareDropdown options={vaultOptions} onChange={(val) => setVaultId(val)} defaultValue={defaultVault}/>
      </div>
      <div>
        <label>Name: </label>
        <TextInput placeholder="CreditlineV0" value={name} onChange={(val) => setName(val)}/>
      </div>
      
      
      <div>
        <div>
        { generateTooltip("Collateral type for the instrument", "collateral")}
          <label>Collateral Type: </label>
        </div>
        <SquareDropdown options={collateralOptions} onChange={(val) => {
          if (val === "3") {
            setCollateral("")
            setCollateralBalance("");
          }
          setCollateralType(val)
          }} defaultValue={collateralType}/>
      </div>
      {collateralType === "0" && (
        <>
          <div>
            <label>Collateral Address (ERC20 only): </label>
            <TextInput placeholder="0x..." value={collateral} onChange={(val) => setCollateral(val)}/>
          </div>
          <div>
            <label>Collateral Required: </label>
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
        </>
      )}
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
          prepend={chosenCash ? getCashFormat(chosenCash).symbol : ""}
          label={chosenCash}
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
      <div className={Styles.Duration}>
        <label>Duration: </label>
        <DurationInput label="days" value={duration.days} onChange={(e)=> {
          setDuration((prev) => { return {...prev, days: e.target.value}})
        }}/>
        
      </div>
      <div className={Styles.Description}>
        <label>Description: </label>
        <textarea 
        rows="4" 
        cols="15" 
        placeholder="description..."
        onChange={(e) => {
            setDescription(e.target.value)
          }
        }
        value= { description }
        ></textarea>
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
        {deployedInstrument &&
            (
              <ExternalLink URL={"https://mumbai.polygonscan.com/address/" + instrumentAddress} label={deployedAddressLabel}>

              </ExternalLink>
            )
          }
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



  if (!account) {
    return (
      <>
      <div>
        <h2>
          Please connect your wallet to use this feature
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

const errorCheck = (value) => {
  let returnError = "";
  if (value === "" || (value !== "" && (isNaN(value) || Number(value) === 0 || Number(value) < 0))) {
    returnError = ERROR_AMOUNT;
    return true;
  }
  return  false;
};