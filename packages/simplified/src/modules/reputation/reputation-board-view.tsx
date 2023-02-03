import React from "react";
import { useQuery } from "@apollo/client";


// @ts-ignore
import Styles from "./reputation-board-view.styles.less"
import { GRAPH_QUERIES } from "@augurproject/comps";
import { BlackArrows, WhiteArrows } from "@augurproject/comps/build/components/common/icons";

// subgraph managers -> 
const ReputationView = () => {
    
    const { loading, error, data } = useQuery(GRAPH_QUERIES.GET_MANAGER_SCORES, {
        variables: {
            amount: 100
        }
    })

    console.log("board managers: ", data);
    return (
        <div className={Styles.ReputationBoardView}>
            <h3>Leader Board</h3>
            <LeaderBoard managers={data?.managers} />
        </div>
    )
}

export default ReputationView;

const LeaderBoard = ({ managers }) => {
    return (
            <table className={Styles.leaderBoard}>
                <thead>
                    <tr>
                        <th>
                        </th>
                        <th>
                            Address/ENS
                        </th>
                        <th>
                            Last Update
                        </th>
                        <th>
                            Score
                        </th>
                        <th>
                            <img src={WhiteArrows} style={{width: 40, height: 40}} />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {managers?.map((manager, i) => {
                        return (
                            <tr key={manager.address}>
                                <td>
                                    <div>
                                    {i + 1}
                                    </div>
                                </td>
                                <td>
                                    <div>
                                    {manager.address}
                                    </div>
                                </td>
                                <td>
                                    <div>
                                    2/1/2023
                                    </div>
                                </td>
                                <td>
                                    <span>
                                    {manager.reputationScore}
                                    </span>
                                </td>
                                <td>
                                    <span>
                                        +10
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
    )
}