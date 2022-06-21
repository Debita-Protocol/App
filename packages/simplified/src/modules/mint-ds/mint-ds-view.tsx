import React from 'react';
import { NameValuePair, SquareDropdown, DropdownProps } from '@augurproject/comps/build/components/common/selection';
import MarketViewStyles from "../liquidity/market-liquidity-view.styles.less";
import Styles from "./mint-ds-view.styles.less"
import { AmountInput, AmountInputProps } from '@augurproject/comps/build/components/common/inputs';
import 

const acceptedCurrencies: NameValuePair[] = [
    { label: 'DAI', value: 'DAI' },
    { label: 'USDC', value: 'USDC' },
    { label: 'FRAX', value: 'FRAX' },
]

interface SupplyAmountInputProps {
    initialAmount : number,

}
const SupplyAmountInput = ({ placeholder, value, onChange }) => {
    return (
      <input
        type="number"
        className={Styles.SupplyAmountInput}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };

const MintDSView = () => {
    const [selectedCurrency, setSelectedCurrency] = React.useState(acceptedCurrencies[0]);
    const [supplyAmount, setSupplyAmount] = React.useState('');

    const CollateralMenuProps : DropdownProps = {
        onChange: (option) => {
            setSelectedCurrency(option);
        },
        options: acceptedCurrencies,
        defaultValue: 'DAI',
    }

    return (
        <div className={MarketViewStyles.MarketLiquidityView}>
            <div className='collateral-selection'>
                <span>Collateral Type:</span>
                <SquareDropdown {...CollateralMenuProps}/>
            </div>
            <div className='collateral-amount'>
                
            </div>
        </div>
    );
}

export default MintDSView;