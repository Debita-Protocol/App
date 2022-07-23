import makePath from "./make-path";
import makeQuery from "./make-query";
import React, { useState } from "react";
import {Link} from "react-router-dom";
import classNames from "classnames";
import {ValueLabel} from "../common/labels";
import BN from "bignumber.js"
import { PRICE_PRECISION } from "../../data/constants";
import {Loan} from "../../types";
import { utils } from "ethers" 


const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const { parseBytes32String } = utils;

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
  console.log("rendering loan-card")
  const ID = parseBytes32String(id);
  const date = new Date(Number(repaymentDate) * 1000).toDateString()
  const _duration = new BN(duration.toNumber()).div(60*60*24).toFixed()
  const _principal = new BN(principal.toNumber()).div(10**PRICE_PRECISION).toFixed().toString()

  return (
      <Link
            data-testid={`link-${ID}`}
            to={{
              pathname: makePath("loan"),
              search: makeQuery({ID}),
            }}
      >
        <ValueLabel label={"Loan ID:"} value={ID} large={true} sublabel={recipient === ZERO_ADDRESS ? "Discretionary" : "Smart Contract"}/>
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
  )
}