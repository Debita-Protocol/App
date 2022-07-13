import React, { useEffect, useState, useContext, useMemo } from "react";
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
import Styles from "./borrow-view.styles.less";
import MarketStyles from "../markets/markets-view.styles.less";
//import Calendar from 'react-calendar'; => to do later.
import { DropdownProps } from "@augurproject/comps/build/components/common/selection";
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

const { checkLoanRegistration, registerBorrower, submitProposal, checkBorrowStatus } = ContractCalls;


const LoanRequestForm = () => {
  const {
    account,
    balances,
    loginAccount,
    actions: { addTransaction },
  } = useUserStore();

  const [ principal, setPrincipal ] = useState("0.0");
  const [ duration, setDuration ] = useState("0"); // days
  const [ underlyingToken, setUnderlyingToken ] = useState("");
  const [ interestRate, setInterestRate ] = useState("0.0");
  

  const buttonProps: BaseThemeButtonProps = {
    text: "Submit Loan Request",
    action: () => {
      if (principal === "" || duration === "" || underlyingToken === "" || interestRate === "" || underlyingToken === "") {
        console.log("empty fields");
        return;
      }
      else {
        const totalDebt = calculateTotalDebt(principal, interestRate, duration);
        submitProposal(loginAccount.library, account, principal, totalDebt, duration, underlyingToken).then((response) => {
        console.log(response);
        }).catch((err) => {
          console.log(err);
        })
      }
    }
  };

  const dropdownProps: DropdownProps  = {
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
    defaultValue: "DAI",
    onChange: (val) => {
      setUnderlyingToken(val);
    }
  }

  return (
  <>
    <div className={Styles.LoanRequestForm}>
      <div>
        <label>Principal: </label> <br />
        <input 
          type="text"
          placeholder="0.0"
          value={ principal }
          onChange={(e) => {
            if (/^\d*\.?\d*$/.test(e.target.value)) {
              setPrincipal(e.target.value);
            }
          }}
        />
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
        <label>Loan Duration (Days): </label> <br />
       <input
          type="text"
          placeholder="0"
          value={ duration }
          onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                  setDuration(e.target.value);
              }
            }
          }
        />
        <label>Underlying Token: </label> <br />
        <SquareDropdown { ...dropdownProps }/>
      </div>
      <div className={Styles.SubmitButton}>
        <SecondaryThemeButton {... buttonProps} />
      </div>
    </div>
  </>
  );
}

//to do => register user and then, have user submit a loan.

const BorrowView = () => {
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

  useEffect(async ()=> {
    let loan_status;
    let borrow_status;
    if (isLogged) {
      try {
        loan_status =  await checkLoanRegistration(loginAccount.library, account);
        borrow_status = await checkBorrowStatus(loginAccount.library, account);
      }
      catch (err) {
        console.log("status error", err)
        return;
      }
    } else {
      borrow_status = false;
      loan_status = false;
    }
    setLoading(false);
    setPaidFee(loan_status);
    setIsBorrower(borrow_status);
  });

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
        <div>
          Registration Status: { paidFee ? "Registered" : "Not yet registered" }
        </div>
        <div>
          Borrow Status: { isBorrower ? "Current Borrower" : "None" }
        </div>
        <section>
        </section>
        {/* {paidFee && <LoanRequestForm/> } */}
        <LoanRequestForm />
      </div>
      </>
      );
  }
  
};

export default BorrowView;