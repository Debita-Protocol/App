pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CoreStorage {
    enum LoanTypes {
        AMORTIZED,
        REVOLVING,
        BULLET
    }

    struct LoanMetadata {
        ERC20 underlyingToken;
        uint256 principal;
        uint256 totalDebt;
        uint256 maturity;
        uint256 amountRepaid;
        uint256 tenor;
        uint256 repaymentDate;
        address recipient;
    }

    struct LoanData{
        uint256 _total_borrowed_amount; 
        uint256 _accrued_interest; 
    }
}