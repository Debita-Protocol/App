import React from "react";
import { useQuery } from "@apollo/client";


// @ts-ignore
import Styles from "./reputation-board-view.styles.less"
import { GRAPH_QUERIES } from "@augurproject/comps";
import { BlackArrows, WhiteArrows } from "@augurproject/comps/build/components/common/icons";
import moment from "moment";
import { useSimplifiedStore } from "modules/stores/simplified";

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

    const {
        settings: { theme },
      } = useSimplifiedStore();
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
                            <img src={theme === "Dark" ? WhiteArrows : BlackArrows} style={{width: 40, height: 40}} />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {managers?.map((manager, i) => {
                        console.log("manager: ", manager.lastUpdated);
                        let lastUpdated = moment(Number(manager.lastUpdated) * 1000);
                        let now = moment()


                        let delta = now.unix() - lastUpdated.unix() > 86400 ? "-" : Number(manager.delta) < 0 ? 
                            "-" + manager.delta : "+" + manager.delta;

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
                                    {lastUpdated.format("MMM D YY")}
                                    </div>
                                </td>
                                <td>
                                    <span>
                                    {manager.reputationScore}
                                    </span>
                                </td>
                                <td>
                                    <span>
                                        {delta}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
    )
}