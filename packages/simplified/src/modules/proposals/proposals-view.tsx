import React, {useState} from "react"
import { useHistory } from "react-router-dom"
import {Link} from "react-router-dom";
import makePath from "./make-path";
import makeQuery from "./make-query";
// @ts-ignore
import Styles from "./proposals-view.styles.less";
import {TabNavItem, TabContent} from "./tabs";
import CreditLineProposalView from "../creditline-proposal/creditline-proposal-view";
import GeneralInstrumentForm from "./general-instrument-form";
import PoolProposalView from "../pool-proposal/pool-proposal-view";
import OptionsProposalView from "../options-proposal/options-proposal-view";
import { BaseSlider } from "../common/slider";

const ProposalsView = () => {
    const [ activeTab, setActiveTab ] = useState("0");

    return (
        <div className={Styles.ProposalsView}>
            
            <section>
                    <TabNavItem title="Options" id="0" activeTab={activeTab} setActiveTab={setActiveTab}/>
                    <TabNavItem title="Pool" id="1" activeTab={activeTab} setActiveTab={setActiveTab}/>
                    <TabNavItem title="General" id="2" activeTab={activeTab} setActiveTab={setActiveTab}/>
                    <TabNavItem title="Creditline" id="3" activeTab={activeTab} setActiveTab={setActiveTab}/>
            </section>
            <section>
                <TabContent id="0" activeTab={activeTab} className={Styles.poolTab}>
                    <OptionsProposalView />
                </TabContent>
                <TabContent id="1" activeTab={activeTab} className={Styles.PoolTab}>
                    <PoolProposalView />
                </TabContent>
                <TabContent id="2" activeTab={activeTab}>
                    <GeneralInstrumentForm />
                </TabContent>
                <TabContent id="3" activeTab={activeTab} className={Styles.poolTab}> 
                    <CreditLineProposalView />
                </TabContent>
               
            </section>
        </div>
    )
}
export default ProposalsView;