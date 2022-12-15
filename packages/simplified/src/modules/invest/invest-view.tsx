import React, { useEffect, useState, useContext } from "react";
import { useDataStore } from "@augurproject/comps";


const InvestView = p => {
    const {
        vaults
    } = useDataStore();
    console.log(vaults);
    return (
        <div>
        <h1>Invest</h1>
        </div>
    );
};

export default InvestView;