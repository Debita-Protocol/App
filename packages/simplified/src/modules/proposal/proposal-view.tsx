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
import { SUPER_BUTTON } from "../common/super-button";
import { useHistory } from "react-router-dom"
//import Calendar from 'react-calendar'; => to do later.
import { DropdownProps } from "@augurproject/comps/build/components/common/selection";

// ALL CURRENCY ADDRESSES ARE JUST USDC
import { CURRENCY_ADDRESSES } from "../constants";
import { utils } from "ethers";
import { LendingPool__factory} from "@augurproject/smart"



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

const { getNumberProposals, getLoanLimits } = ContractCalls;


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
  const [ inputError, setInputError ] = useState("");
  const [ showError, setShowError ] = useState(false);
  const [ numProposals, setNumProposals ] = useState(false);
  const [ underlyingToken, setUnderlyingToken ] = useState(CURRENCY_ADDRESSES.USDC);
  const [ interestRate, setInterestRate ] = useState("0.0");
  const [ ID, setID ] = useState(""); 
  const [ description, setDescription] = useState("");
  const [ loanType, setLoanType ] = useState("discretionary");
  const history = useHistory();

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

  const checkInput = (
    years: string,
    months: string,
    weeks: string,
    days: string,
    minutes:string,
    interest: string,
    principal: string,
    loanType: string,
    ID: string,
    description: string,
    recipient: string
  ) : boolean => {
    const duration = Number(years) + Number(months) + Number(weeks) + Number(days) + Number(minutes)
    if (duration === 0) {
      setInputError("Duration must be greater than 0")
      return true
    } else if (Number(interest) === 0) {
      setInputError("Interest must be greater than 0")
      return true
    } else if (Number(principal) === 0) {
      setInputError("Principal must be greater than 0")
      return true
    } else if (loanType === "contract" && !/^0x[a-fA-F0-9]{40}/.test(recipient)) {
      setInputError("Must have valid recipient address")
      return true
    } else if (!/^\S{1,32}$/.test(ID)) {
      setInputError("Must have valid ID")
      return true
    } else if (description === "") {
      setInputError("Must have a description")
      return true
    }
    return false
  }

  const retrieveProposalNumber = useCallback(async () => {
    let n = await getNumberProposals(account, loginAccount.library, account);
    console.log("num proposals: ", n)
    setNumProposals(n);
  })

  useEffect(retrieveProposalNumber, [account, loginAccount])

  const reset = () => {
    setPrincipal("");
    setDuration({
      years: "0",
      weeks: "0",
      days: "0",
      minutes: "0",
    });
    setInterestRate("")
    setID("")
    setDescription("")
  }

  const submitPropsal = useCallback(async (e)=> {
    e.preventDefault()

    const total_duration = new BN(365*24*60*60*Number(duration.years) + 7*24*60*60*Number(duration.weeks) + 24*60*60*Number(duration.days) + 60*Number(duration.minutes)).toString();
    
    const interest = new BN(total_duration).div(365*24*60*60).multipliedBy(new BN(interestRate).div(100).multipliedBy(principal)).toString()
    
    console.log("submit proposal frontend:", interest, total_duration, loanType, principal)
    
    if (!checkInput(
      duration.years,
      duration.months,
      duration.weeks,
      duration.days,
      duration.minutes,
      interestRate,
      principal,
      loanType,
      ID,
      description,
      recipient
    )) {
      setInputError("")
      if (loanType === "discretionary") {
        try {
          console.log('trying to submit loan')
          const tx = ""
          // await addContractLoanProposal(
          //   account,
          //   loginAccount.library,
          //   ID,
          //   principal,
          //   total_duration,
          //   interest,
          //   description
          // )
          // await tx.wait()
          history.push("/borrow")
          
        } catch (err) {
          console.log("Failed to submit discretionary loan")
          console.log(err);
          console.log(err.reason)
        }
      } else if (loanType === "contract") {
        try {
          const tx = ""; 
          // await addContractLoanProposal(
          //   account,
          //   loginAccount.library,
          //   recipient,
          //   ID,
          //   principal,
          //   total_duration,
          //   interest,
          //   description
         // );
         // await tx.wait()
          history.push("/borrow")
        } catch (err) {
          console.log(err.reason);
        }
      }
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
        <SUPER_BUTTON />
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
          <label>Interest Rate (Annual) %: </label> <br />
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
        <div>
        { inputError }
        </div>
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