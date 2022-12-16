import React, { useState } from "react"
import { useDataStore } from "@augurproject/comps"
import Styles from "./borrow-view.styles.less";
import {TabContent, TabNavItem} from "./Tabs";

const Pools: React.FC = () => {
    // retrieve all the pools ever created.
    const { vaults, markets, instruments } = useDataStore();

    // iterate through all the markets
    for (let i=0; i< vaults.length; i++) {
        let l = vaults[i].marketIds.length;
        for (let j=0; j<l; j++) { 

        }
    }

    return (
        <div className="Pools">
            <h3>Pools</h3>
        </div>
    )
}

const MyLoans: React.FC = () => {
    return (
        <div className="MyLoansPage">
            <h3>My Loans</h3>
        </div>
    )
}

const BorrowView: React.FC = () => {
    const { vaults } = useDataStore();
    const [ activeTab, setActiveTab ] = useState("0");

    return (
        <div className={Styles.BorrowViewTabs}>
            <ul className="nav">
                <TabNavItem title="Pools" id="0" activeTab={activeTab} setActiveTab={setActiveTab}/>
                <TabNavItem title="My Loans" id="1" activeTab={activeTab} setActiveTab={setActiveTab}/>
            </ul>
            <div className="outlet">
                <TabContent id="0" activeTab={activeTab}> 
                    <Pools />
                </TabContent>
                <TabContent id="1" activeTab={activeTab}>
                    <MyLoans />
                </TabContent>
            </div>
        </div>
    )
}

export default BorrowView