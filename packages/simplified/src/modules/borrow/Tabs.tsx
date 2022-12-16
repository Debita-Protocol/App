import React from "react"

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
      <li onClick={handleClick} className={activeTab === id ? "active" : ""}>
        { title }
      </li>
    );
   };
 