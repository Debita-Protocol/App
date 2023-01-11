import React from "react"

// @ts-ignore
import Styles from "./borrow-view.styles.less";

import classNames from "classnames";

export const TabContent: React.FC = ({id, activeTab, children}) => {
 return (
   activeTab === id ? <div className="TabContent">
     { children }
   </div>
   : null
 );
};

export const TabNavItem: React.FC = ({ id, title, activeTab, setActiveTab }) => {
    const handleClick = () => {
      setActiveTab(id);
    };
    
   return (
      <div onClick={handleClick} className={classNames({ [Styles.Active]: activeTab === id})}>
        { title }
      </div>
    );
   };
 