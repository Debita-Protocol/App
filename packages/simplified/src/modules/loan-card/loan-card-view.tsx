import makePath from "./make-path";
import makeQuery from "./make-query";
import React, { useState } from "react";
import {Link} from "react-router-dom";
import classNames from "classnames";
import { ValueLabel } from "@augurproject/comps/build/components/common/labels";
import type { Loan } from "@augurproject/comps/build/types";
import BN from "bignumber.js"
import Styles from "./loan-card.styles.less";

import { utils, BytesLike, BigNumber } from "ethers" 

const PRICE_PRECISION = 6;
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
}: Loan ) => {
  console.log("rendering loan-card")
  const ID = parseBytes32String(id);
  const date = new Date(Number(repaymentDate) * 1000).toDateString()
  const _duration = new BN(duration.toNumber()).div(60*60*24).toFixed()
  const _principal = new BN(principal.toNumber()).div(10**PRICE_PRECISION).toString()

  return (
    <article
      className={Styles.LoanCard}
    >
      <Link
            data-testid={`link-${ID}`}
            to={{
              pathname: makePath("loan"),
              search: makeQuery({id:ID}),
            }}
      >
      <section>
        <div>
          <ValueLabel label={"Loan ID:"} value={ID} large={true}/>
        </div>
        <div>
          <ValueLabel label={"Loan Type:"} value={recipient === ZERO_ADDRESS ? "Discretionary" : "Smart Contract"} />
        </div>
        <div>
          <ValueLabel label={"Approved:"} value={approved ? "Yes!" : "Nope."} />
        </div>
        <div>
          <ValueLabel label={"Principal:"} value={_principal}/>
        </div>
      </section>
      <section>
      { approved ? (
                <div>
                  <ValueLabel label={"Repayment Date:"} value={date}/>
                </div>
            ) : (
              <div>
                <ValueLabel label={"Loan Duration (days):"} value={ _duration }/>
              </div>
              
            )}
            <div>
              <ValueLabel label={"Loan Description:"} value={ description }/>
            </div>
      </section>
      </Link>
    </article>
  )
}