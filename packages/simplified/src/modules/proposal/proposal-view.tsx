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
import { BaseThemeButtonProps, TinyThemeButton } from "@augurproject/comps/build/components/common/buttons";
import { MARKETS_LIST_HEAD_TAGS } from "../seo-config";
import Styles from "./proposal-view.styles.less";
import MarketStyles from "../markets/markets-view.styles.less";
//import Calendar from 'react-calendar'; => to do later.
import { DropdownProps } from "@augurproject/comps/build/components/common/selection";

// ALL CURRENCY ADDRESSES ARE JUST USDC
import { CURRENCY_ADDRESSES } from "../constants";

const {
    SelectionComps: { SquareDropdown },
    ButtonComps: { SecondaryThemeButton },
    Icons: { FilterIcon, SearchIcon },
    MarketCardComps: { LoadingMarketCard, MarketCard },
    PaginationComps: { sliceByPage, useQueryPagination, Pagination },
    InputComps: { SearchInput },
    LabelComps: { NetworkMismatchBanner },
  } = Components;
  
const {
    SIDEBAR_TYPES,
    ALL_CURRENCIES,
    ALL_MARKETS,
    // currencyItems,
    marketStatusItems,
    OPEN,
    OTHER,
    POPULAR_CATEGORIES_ICONS,
    sortByItems,
    TOTAL_VOLUME,
    STARTS_SOON,
    RESOLVED,
    IN_SETTLEMENT,
    LIQUIDITY,
    MARKET_STATUS,
    TWENTY_FOUR_HOUR_VOLUME,
    SPORTS,
  } = Constants;

const { addProposal } = ContractCalls;


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

const LoanRequestForm = () => {
  const {
    account,
    balances,
    loginAccount,
    actions: { addTransaction },
  } = useUserStore();

  const [ principal, setPrincipal ] = useState("0.0");
  const [ duration, setDuration ] = useState({
    years: "0",
    months: "0",
    weeks: "0",
    days: "0",
    minutes: "0",
  });
  const [ inputError, setInputError ] = useState(false);
  const [ proposalLimit, setProposalLimit ] = useState(false);
  const [ underlyingToken, setUnderlyingToken ] = useState("");
  const [ interestRate, setInterestRate ] = useState("0.0");
  const [ ID, setID ] = useState(""); 
  const [ description, setDescription] = useState("");
  const [ loanType, setLoanType ] = useState("");
  
  const addProposal = useCallback(async ()=> {

  })

  const buttonProps: BaseThemeButtonProps = {
    text: "Submit Loan Request",
    action: addProposal
  };

  const tokenDropDownProps: DropdownProps  = {
    options: [
      {
        label: "USDC",
        value: CURRENCY_ADDRESSES.USDC
      },
      {
        label: "DAI",
        value: CURRENCY_ADDRESSES.DAI
      },
      {
        label: "FRAX",
        value: CURRENCY_ADDRESSES.FRAX
      },
    ],
    defaultValue: "USDC",
    onChange: (val) => {
      setUnderlyingToken(val);
    }
  }
  
  const loanTypeDropDownProps: DropdownProps = {
    options: [
      {
        label: "discretionary loan",
        value: "discretionary"
      },
      {
        label: "smart contract loan",
        value: "smart"
      }
    ],
    defaultValue: "discretionary loan",
    onChange: (val) => {
      setLoanType(val);
    }
  }

  return (
  <>
    <div className={Styles.LoanRequestForm}>
      <div>
        <div className="principal">
          <label>Principal: </label> <br />
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
        <div className="interest">
          <label>Interest Rate (Annual): </label> <br />
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
        <div className="duration">
          <label>Loan Duration: </label> <br />
          <DurationInput label="years" value={duration.years} onChange={(e)=> {
            if (/^\d*$/.test(e.target.value)) {
              setDuration((prev) => { return {...prev, years: e.target.value}})
            }
          }}/>
          <DurationInput label="months" value={duration.months} onChange={(e)=> {
            if (/^\d*$/.test(e.target.value)) {
              setDuration((prev) => { return {...prev, months: e.target.value}})
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
        <div className="loan-id">
          <label>Loan ID: </label> <br />
          <input
              type="text"
              placeholder="0"
              value={ duration }
              onChange={(e) => {
                  if (/^\w*$/.test(e.target.value)) {
                      setID(e.target.value);
                  }
                }
              }
            />
        </div>
        <div className="description">
          <label>Description: </label> <br />
          <input
              type="text"
              placeholder=""
              value={ duration }
              onChange={(e) => {
                  setDescription(e.target.value)
                }
              }
            />
        </div>
        <div className="token">
          <label>Underlying Token: </label> <br />
          <SquareDropdown { ...tokenDropDownProps }/>
        </div>
        <div className="loan-type">
          <label>Loan Type: </label> <br />
          <SquareDropdown { ...loanTypeDropDownProps }/>
        </div>
      </div>
      <div className={Styles.SubmitButton}>
        <TinyThemeButton {... buttonProps} />
      </div>
    </div>
  </>
  );
}

//to do => register user and then, have user submit a loan.

const LoanProposalView = () => {
  const {
    account,
    balances,
    loginAccount,
    actions: { addTransaction },
  } = useUserStore();
  const {
    isLogged
  } = useAppStatusStore();
  const [ paidFee, setPaidFee ] = useState(false);
  const [ isBorrower, setIsBorrower ] = useState(false)
  const [ loading, setLoading ] = useState(false);

  if (!isLogged) {
    return (
      <>
      <div className={MarketStyles.MarketsView}>
        <h2>
          Please connect your account to see this page...
        </h2>
      </div>
      </>
    );
  } else {
    return (
      <>
      <div className={MarketStyles.MarketsView}>
        <LoanRequestForm />
      </div>
      </>
      );
  }
  
};

export default LoanProposalView;