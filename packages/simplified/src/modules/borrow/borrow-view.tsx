import React from "react"
import { useDataStore } from "@augurproject/comps"


const BorrowView: React.FC = () => {
    const { vaults } = useDataStore();
    
    return <div>BorrowView</div>
}

export default BorrowView