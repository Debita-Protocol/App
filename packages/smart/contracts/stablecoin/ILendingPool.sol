pragma solidity 0.7.6;


interface ILendingPool{

    function mintDS(uint256 collateral_amount, uint256 DS_out_min) external;


    function redeemDS(uint256 DS_amount, uint256 DSS_out_min, uint256 COLLATERAL_out_min) external;

    function collectRedemption(uint256 col_idx) external returns (uint256 dss_amount, uint256 collateral_amount) ;
    function setPoolParameters(uint256 new_ceiling, uint256 new_bonus_rate, uint256 new_redemption_delay, uint256 new_mint_fee, uint256 new_redeem_fee, uint256 new_buyback_fee, uint256 new_recollat_fee) external;
    // 

    //Manager Functions

    function addManager(address manager) external ;
    function managerMintDS(uint256 amount) external ;
    function managerBurnDS(uint256 amount) external ;


    //Borrowing and Repaying 

    //Approved Borrower is added by owner or governance 
    // function addBorrower(address _recipient, uint256 _principal, 
    //     uint256 _totalDebt, uint256 _duration, ERC20 _underlyingToken) public onlyByOwnGov {
    //     require(!isBorrower[_recipient], "Already Approved Borrower"); 
    //     isBorrower[_recipient] = true;
    //     borrower_allowance[_recipient] = _principal;

    //     borrower_data[_recipient] = LoanMetadata(
    //         _underlyingToken,
    //         _principal,
    //         _totalDebt,
    //         0,
    //         _duration,
    //         _duration + block.timestamp,
    //         _recipient
    //     );
    // }

    // function approveBorrower(address _recipient) public onlyByOwnGov onlyRegistered(_recipient) {
    //     require(!isBorrower[_recipient], "Already Approved Borrower"); 
    //     isBorrower[_recipient] = true;
    // }

    // function registerBorrower() external {
    //     require(!isRegistered[msg.sender], "already paid proposal fee");
    //     TransferHelper.safeTransferFrom(address(collateral_token), msg.sender,address(this), proposal_fee);
    //     isRegistered[msg.sender] = true;
    // }

    // function submitProposal (
    //     address _recipient, 
    //     uint256 _principal, 
    //     uint256 _totalDebt, 
    //     uint256 _duration, 
    //     ERC20 _underlyingToken
    // ) public onlyRegistered(_recipient) {
    //     require(!isBorrower[_recipient], "Already Approved Borrower");
    //     require(_recipient != address(0));
    //     borrower_data[_recipient] = LoanMetadata(
    //         _underlyingToken,
    //         _principal,
    //         _totalDebt,
    //         0,
    //         _duration,
    //         _duration + block.timestamp,
    //         _recipient
    //     );
    // }

    // function getRegistrationStatus(address addr) external view returns (bool) {
    //     return isRegistered[addr];
    // }


    // function borrow(uint256 amount) external onlyBorrower onlyRegistered(msg.sender) {
    //     require(amount <= borrower_allowance[msg.sender], "Exceeds borrow allowance");
    //     require(borrower_debt[msg.sender] <= borrower_data[msg.sender].principal, "Already Borrowed"); 

    //     borrower_allowance[msg.sender] = borrower_allowance[msg.sender].sub(amount); 
    //     TransferHelper.safeTransfer(collateral_address, msg.sender, amount);
    //     borrower_debt[msg.sender] = borrower_debt[msg.sender].add(amount); 
    //     total_borrowed_amount = total_borrowed_amount.add(amount); 


    // }

    // function repay(uint256 repay_principal, uint256 repay_interest) external onlyBorrower {

    //     uint256 total_repayment = repay_principal.add(repay_interest);
    //     TransferHelper.safeTransferFrom(collateral_address, msg.sender, address(this), total_repayment); 

    //     borrower_debt[msg.sender] = borrower_debt[msg.sender].sub(repay_principal); 
    //     accrued_interest.add(repay_interest);
    //     console.log('total_borrowed_amount', total_borrowed_amount);
    //     total_borrowed_amount = total_borrowed_amount.sub(repay_principal);

    //     if (borrower_debt[msg.sender]==0){
    //         isBorrower[msg.sender] = false; 
    //         delete borrower_data[msg.sender]; 

    //     }
    // }


    // function getBorrowerData(address borrower_address) public view returns (LoanMetadata memory)  {
    //     return borrower_data[borrower_address]; 

    // }

    // function _isBorrower(address borrower_address) public view returns(bool){ // solidity automatically creates getter.
    //     return isBorrower[borrower_address]; 
    // }

    // function get_loan_data() public view returns(LoanData memory){
    //     LoanData memory loandata = LoanData({
    //         _total_borrowed_amount: total_borrowed_amount, 
    //         _accrued_interest : accrued_interest
    //         });
    //     return loandata; 
    // }

} 