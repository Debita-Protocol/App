import React, { useCallback, useEffect, useState, useContext, useMemo } from "react";
import BigNumber, { BigNumber as BN } from "bignumber.js";
import { calculateTotalDebt } from "utils/interest";
import {
    useUserStore,
    useAppStatusStore,
    useDataStore,
    useScrollToTopOnMount,
    SEO,
    Constants,
    ContractCalls,
    Components,
    getCategoryIconLabel,
  } from "@augurproject/comps";

import { BaseThemeButtonProps } from "@augurproject/comps/build/components/common/buttons";
import { MARKETS_LIST_HEAD_TAGS } from "../seo-config";
import Styles from "./creditline-proposal-view.styles.less";
import { SUPER_BUTTON } from "../common/super-button";
import { useHistory } from "react-router-dom"
//import Calendar from 'react-calendar'; => to do later.
import { utils } from "ethers";

import { useDataStore2 } from "@augurproject/comps";


const { formatBytes32String } = utils;


const {
    SelectionComps: { SquareDropdown },
    ButtonComps: { SecondaryThemeButton },
    Icons: { FilterIcon, SearchIcon },
    MarketCardComps: { LoadingMarketCard, MarketCard },
    PaginationComps: { sliceByPage, useQueryPagination, Pagination },
    InputComps: { SearchInput },
    LabelComps: { NetworkMismatchBanner }
  } = Components;


const { addProposal, createCreditLine } = ContractCalls;



const DurationInput = ({onChange, label, value}) => {
  return (
    <>
      <label>{ label }</label>
      <input
        type="text"
        placeholder="0"
        value={ value }
        onChange={ onChange }
      />
      <br />
    </>
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

  const [ principal, setPrincipal ] = useState("0.0");
  const [ duration, setDuration ] = useState({
    years: "0",
    weeks: "0",
    days: "0",
    minutes: "0",
  });
  const [ inputError, setInputError ] = useState("");
  const [ interestRate, setInterestRate ] = useState("0.0");
  const [ description, setDescription] = useState("");

  const checkInput = (
    total_duration: BigNumber,
    interest: BigNumber,
    principal: BigNumber,
    description: string
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

  const submitPropsal = useCallback(async (e)=> {
    e.preventDefault()

    let total_duration = new BN(365*24*60*60*Number(duration.years) + 7*24*60*60*Number(duration.weeks) + 24*60*60*Number(duration.days) + 60*Number(duration.minutes)).toString();
    
    // total interest accrued
    let interest = new BN(total_duration).div(365*24*60*60).multipliedBy(new BN(interestRate).div(100).multipliedBy(principal)).toString()

    if (checkInput(
      new BN(total_duration),
      new BN(interest),
      new BN(principal),
      description
    )) {
      let faceValue = new BN(principal).plus(new BN(interest)).toString()
      let instrument_address = await createCreditLine(account, loginAccount.library, principal, interestRate, total_duration, faceValue)
      console.log("instrument address: ", instrument_address);
      
      let tx = await addProposal(
        account,
        loginAccount.library,
        faceValue,
        principal,
        interest,
        total_duration,
        description,
        instrument_address
      )
      console.log("PROPOSAL ADDED")
      reset();
      await tx.wait();
      
    }
  })

  const buttonProps: BaseThemeButtonProps = {
    text: "Create Credit Line Proposal",
    action: submitPropsal
  };

  return (
  <>
    <div className={Styles.CreditlineProposalForm}>
      {/* <SUPER_BUTTON /> */}
      <span>
        Creditline Proposal Form
      </span>
      <div>
        <label>Principal: </label>
        <input 
          type="text"
          placeholder="0.0"
          value={ principal }
          onChange={(e) => {
            if (/^\d*\.?\d*$/.test(e.target.value)) {
              setPrincipal(e.target.value)
            }
          }}
        />
      </div>
      <div>
        <label>Interest Rate (Annual) %: </label>
        <input 
          type="text"
          placeholder="0.0"
          value={ interestRate }
          onChange={(e) => {
            if (/^\d*\.?\d*$/.test(e.target.value)) {
              setInterestRate(e.target.value);
            }
          }}
        />
      </div>
      <div>
        <label>Credit Line Duration: </label> <br />
        <DurationInput label="years" value={duration.years} onChange={(e)=> {
          if (/^\d*$/.test(e.target.value)) {
            setDuration((prev) => { return {...prev, years: e.target.value}})
          }
        }}/>
        <DurationInput label="weeks" value={duration.weeks} onChange={(e)=> {
          if (/^\d*$/.test(e.target.value)) {
            setDuration((prev) => { return {...prev, weeks: e.target.value}})
          }
        }}/>
        <DurationInput label="days" value={duration.days} onChange={(e)=> {
          if (/^\d*$/.test(e.target.value)) {
            setDuration((prev) => { return {...prev, days: e.target.value}})
          }
        }}/>
        <DurationInput label="minutes" value={duration.minutes} onChange={(e)=> {
          if (/^\d*$/.test(e.target.value)) {
            setDuration((prev) => { return {...prev, minutes: e.target.value}})
          }
        }}/>
      </div>
      <div>
        <label>Description: </label> <br />
        <textarea 
        rows="4" 
        cols="15" 
        placeholder="description of creditline..."
        onChange={(e) => {
            setDescription(e.target.value)
          }
        }
        value= { description }
        ></textarea>
      </div>
      <div>

      </div>
      <div>
      { inputError }
      </div>
      <div>
        <SecondaryThemeButton {... buttonProps} />
      </div>
    </div>
    </>
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
  const {
    isLogged
  } = useAppStatusStore();

  if (!isLogged) {
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
      <>
      <div className={Styles.CreditLineProposalView}>
        <CreditLineRequestForm />
      </div>
      </>
      );
  }
  
};

export default CreditLineProposalView;