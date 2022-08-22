import { ContractCalls, useUserStore } from "@augurproject/comps";
import React, { useState, useCallback} from "react";
import BigNumber, { BigNumber as BN } from "bignumber.js";
import { BaseThemeButton } from "@augurproject/comps/build/components/common/buttons";
import Styles from "./instrument-proposal-view.styles.less";

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

const InstrumentProposalView = () => {
    const { account, loginAccount } = useUserStore();
    const [ principal, setPrincipal ] = useState("")
    const [ description, setDescription ] = useState("")
    const [ duration, setDuration ] = useState({
        years: "0",
        weeks: "0",
        days: "0",
        minutes: "0",
      })
    const [ expectedYield, setExpectedYield ] = useState("")
    const [ address, setAddress ] = useState("")
    const [ inputError, setInputError ] = useState("");
    
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
        } else if (!/^0x[a-fA-F0-9]{40}/.test(address)) {
            setInputError("Must have valid recipient address")
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
        setExpectedYield("")
        setDescription("")
      }

    const submitProposal = useCallback(async () => {
        let total_duration = new BN(365*24*60*60*Number(duration.years) + 7*24*60*60*Number(duration.weeks) + 24*60*60*Number(duration.days) + 60*Number(duration.minutes)).toString();
        let faceValue = new BN(expectedYield).plus(principal).toString();
        if (checkInput(
            new BN(total_duration),
            new BN(expectedYield),
            new BN(principal),
            description
        )) {
            let tx = await addProposal(
                account,
                loginAccount.library,
                faceValue,
                principal,
                expectedYield,
                total_duration,
                description,
                address
            )
            tx.wait()
            console.log("general proposal success");
        }
    })

    return (
        <>
        <section className={Styles.InstrumentProposalView}>
            <div>
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
            <div>
                <label>Expected Yield: </label> <br />
                <input 
                    type="text"
                    placeholder="0.0"
                    value={ expectedYield }
                    onChange={(e) => {
                    if (/^\d*\.?\d*$/.test(e.target.value)) {
                        setExpectedYield(e.target.value);
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
            <div className="description">
                <label>Description: </label> <br />
                <textarea 
                rows="4" 
                cols="15" 
                placeholder="description of instrument..."
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
            <BaseThemeButton action={submitProposal} text="submit proposal"/>
        </section>
        </>
    )
}

export default InstrumentProposalView;