pragma solidity ^0.8.4;
import "./IController.sol";

interface ILendingPool{
    struct LoanMetadata {
        bytes32 id;
        uint256 principal; 
        uint256 totalInterest; // total interest paid over duration
        uint256 duration;
        uint256 repaymentDate;
        uint256 interestPaid; // how much paid toward interest
        uint256 allowance;
        uint256 amountBorrowed; // how much currently borrowed, should be 0 on full loan repayment
        string description;
        bool approved; // proposal => false, active loan => true
        // bool marketApproved;
    }

    struct LoanData{
        uint256 _total_borrowed_amount; 
        uint256 _accrued_interest; 
    }
    function mintDS(uint256 collateral_amount, uint256 DS_out_min) external;
    function redeemDS(uint256 DS_amount, uint256 DSS_out_min, uint256 COLLATERAL_out_min) external;
    function collectRedemption(uint256 col_idx) external returns (uint256 dss_amount, uint256 collateral_amount) ;
    function setPoolParameters(uint256 new_ceiling, uint256 new_bonus_rate, uint256 new_redemption_delay, uint256 new_mint_fee, uint256 new_redeem_fee, uint256 new_buyback_fee, uint256 new_recollat_fee) external;
    function setController(address controller) external;
    function controllerMintDS(uint256 amount) external;
    function controllerBurnDS(uint256 amount) external;
    function addValidator(address validator) external;
    function addProposal(string calldata _id, uint256 _principal, uint256 _duration, uint256 _totalDebt, string calldata _description, IController.MarketInfo memory market_info ) external;
    function removeProposal(string calldata id) external returns (bool); // called by recipient
    function removeProposalGov(address recipient, string calldata id) external returns (bool);
    function approveLoan(address recipient, string calldata id, address marketFactoryAddress) external;
    function borrow(uint256 amount, string calldata loan_id) external;
    function repay(uint256 repay_principal, uint256 repay_interest, string calldata loan_id) external;
    function checkAddressLoans(address recipient) external;
    function fullLoanCheck() external;
    function getLoanData() external returns(LoanData memory);
    function is_borrower(address addr) external returns (bool);
    function retrieveLoan(address borrower, string calldata id) external returns (LoanMetadata memory);
    function borrower_allowance(address addr) external returns (uint256);
    function amount_borrowed(address addr) external returns (uint256);
    function num_loans(address addr) external returns (uint256);
    function num_proposals(address addr) external returns (uint256);
    function getBorrowerLoanData(address recipient) external returns(LoanMetadata memory);
} 