import React from "react"
import { useHistory } from "react-router-dom"
import {Link} from "react-router-dom";
import makePath from "./make-path";
import makeQuery from "./make-query";
import Styles from "./proposals-view.styles.less"

const proposal_types = [
    {
        title: "Uncollateralized Loans",
        path: "creditline"
    },
    {
        title: "Strategies",
        path: "other"
    }
]

const ProposalsView = () => {
    const ProposalLinks = proposal_types.map((proposal_type) => {
        return <div>
            <Link to={
            {
                pathname: makePath(["proposal", proposal_type.path])
            }
        }> 
        <h3>
            {proposal_type.title}
        </h3>
        <br />
        </Link>
        </div>
    })
    return (
        <>
            <div className={Styles.ProposalsView}>
                { ProposalLinks }
            </div>
        </>
    )
}
export default ProposalsView;