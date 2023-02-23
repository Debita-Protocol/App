import React from "react"
// import Styles from "./tabs.styles.less";
import classNames from "classnames";
// @ts-ignore
import Styles from "./tabs.styles.less";

export const TabContent: React.FC = ({id, activeTab, children, className}) => {
 return (
   activeTab === id ?
   <div className={className}>
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
      <div onClick={handleClick} className={classNames(Styles.Tab, { [Styles.Active]: activeTab === id})}>
        { title }
      </div>
    );
   };