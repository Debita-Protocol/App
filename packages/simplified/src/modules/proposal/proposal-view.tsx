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
import { utils } from "ethers";
const { formatBytes32String } = utils;

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

const { addDiscretionaryLoanProposal, addContractLoanProposal, getNumberProposals, getLoanLimits } = ContractCalls;


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
    weeks: "0",
    days: "0",
    minutes: "0",
  });
  const [ recipient, setRecipient ] = useState("");
  const [ inputError, setInputError ] = useState(false);
  const [ showError, setShowError ] = useState(false);
  const [ numProposals, setNumProposals ] = useState(false);
  const [ underlyingToken, setUnderlyingToken ] = useState("");
  const [ interestRate, setInterestRate ] = useState("0.0");
  const [ ID, setID ] = useState(""); 
  const [ description, setDescription] = useState("");
  const [ loanType, setLoanType ] = useState("");

  let proposal_limit = 3;
  let loan_limit = 3;
  
  useEffect(() => {
    (async () => {
      let result = await getLoanLimits(account, loginAccount.library);
      proposal_limit = result.proposal_limit;
      loan_limit = result.loan_limit;
    })();
  }
  ,[]);

  useEffect(() =>{
    if (Number(duration.years) + Number(duration.months) + Number(duration.weeks) + Number(duration.days) + Number(duration.minutes) == 0) {
      setInputError(true);
    } else if (
      interestRate === "" ||
      principal === "" ||
      (loanType === "contract" && recipient === "") ||
      interestRate === "" ||
      /^0x[a-fA-F0-9]{40}$/.test(recipient)
    ) {
      setInputError(true);
    } else if (
      Number(principal) === 0 ||
      Number(interestRate) === 0
    ) {
      setInputError(true);
    }
    else {
      setInputError(false);
      setShowError(false);
    }
  },[duration, underlyingToken, principal, ID, description, loanType]);

  const retrieveProposalNumber = useCallback(async () => {
    setNumProposals(await getNumberProposals(account, loginAccount.library, account));
  })

  useEffect(retrieveProposalNumber, [account, loginAccount])

  const submitPropsal = useCallback(async ()=> {
    if (!inputError) {
      const total_duration = new BN(365*24*60*60*Number(duration.years) + 7*24*60*60*Number(duration.weeks) + 24*60*60*Number(duration.days) + 60*Number(duration.minutes)).toString();
      const interest = new BN(total_duration).div(365*24*60*60).multipliedBy(new BN(interestRate)).toString()
      const _id = formatBytes32String(ID);
      if (loanType === "discretionary") {
        try {
          const tx = await addDiscretionaryLoanProposal(
            account,
            loginAccount.library,
            ID,
            principal,
            total_duration,
            interest,
            description
          )
          await tx.wait()
        } catch (err) {
          console.log(err.reason);
        }
      } else if (loanType === "contract") {
        try {
          const tx = await addContractLoanProposal(
            account,
            loginAccount.library,
            recipient,
            _id,
            principal,
            total_duration,
            interest,
            description
          );
          await tx.wait()
        } catch (err) {
          console.log(err.reason);
        }
      }
    } else {
      setShowError(true);
    }
    retrieveProposalNumber();
  })

  const buttonProps: BaseThemeButtonProps = {
    text: "Submit Loan Request",
    action: submitPropsal
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
        value: "contract"
      }
    ],
    defaultValue: "discretionary",
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
              value={ ID }
              onChange={(e) => {
                  if (/^\S{0,32}$/.test(e.target.value)) {
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
              value={ description }
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
        <div className="recipient">
          <label>Recipient: </label> <br />
          <input
              type="text"
              placeholder=""
              value={ recipient }
              onChange={(e) => {
                setRecipient(e.target.value);
                }
              }
            />
        </div>
        { showError && 
          <div>
          Incorrect Input
          </div>
        }
        { numProposals < proposal_limit &&
        <div className={Styles.SubmitButton}>
          <TinyThemeButton {... buttonProps} />
        </div>
        }
        { numProposals === proposal_limit &&
          <div>
            Reached Proposal Limit
          </div>
        }
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