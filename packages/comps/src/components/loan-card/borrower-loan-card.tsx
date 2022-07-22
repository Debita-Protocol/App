import makePath from "utils/links/make-path";
import makeQuery from "utils/links/make-query";
import React, { useState} from "react";
import Link from "react-router-dom";
import classNames from "classnames";
import Styles from "../market-card/market-card.styles.less";
import { ValueLabel } from "components/common/labels";
import BN from "bignumber.js"
import { PRICE_PRECISION } from "data/constants";
import {Loan} from "../../types"


const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";


const BorrowerLoanLink = ({ id, dontGoToMarket, children }) => {
    return (
      <>
        {!dontGoToMarket ? (
          <Link
            data-testid={`link-${id}`}
            to={
              !dontGoToMarket
                ? {
                    pathname: makePath("loan"),
                    search: makeQuery({
                      id
                    }),
                  }
                : null
            }
          >
            {children}
          </Link>
        ) : (
          <section>{children}</section>
        )}
      </>
    );
  };

export const LoanCard = ({
  id,
  principal,
  totalInterest,
  duration,
  repaymentDate,
  interestPaid,
  allowance,
  amountBorrowed,
  description,
  approved,
  recipient
}: Loan) => {

  const date = new Date(Number(repaymentDate) * 1000).toDateString()
  const _duration = new BN(duration.toNumber()).div(60*60*24).toFixed()
  const _principal = new BN(principal.toNumber()).div(10**PRICE_PRECISION).toFixed().toString()
  return (
    <article
    className={classNames(Styles.MarketCard, {
      [Styles.Popular]: true,
    })}
    > 
      <Link
            data-testid={`link-${id}`}
            to={{
              pathname: makePath("loan"),
              search: makeQuery({id}),
            }}
      >
        <ValueLabel label={"Loan ID:"} value={id} large={true} sublabel={recipient === ZERO_ADDRESS ? "Discretionary" : "Smart Contract"}/>
        <ValueLabel label={"Approved:"} value={approved ? "Yes!" : "Nope."} />
        <ValueLabel label={"Principal:"} value={_principal}/>
        { approved ? (
          <section>
            <ValueLabel label={"Repayment Date:"} value={date}/>
          </section>
        ) : (
          <ValueLabel label={"Loan Duration (days):"} value={ _duration }/>
        )}
        <div>
          { description }  
        </div>
      </Link>
    </article>
  )
}