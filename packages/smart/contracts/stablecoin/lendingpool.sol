pragma solidity 0.7.6;
pragma abicoder v2; 

import "./owned.sol";
import "./DS.sol"; 
import "./DSS.sol"; 
import "./TransferHelper.sol";
import "../ERC20/ERC20.sol";
import "../Common/SafeMath.sol";
import "../turbo/CDSMarketFactory.sol";
//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";

//borrowers borrow and repay from this lendingpool 
contract LendingPool is Owned {
    using SafeMath for uint256;

    address private ds_address; 
    address private dss_address; 
    address private collateral_address; 
    address private creator_address; 
    address private timelock_address;

    uint256 pool_ceiling;
    uint256 bonus_rate;
    uint256 redemption_delay;
    uint256 minting_fee;
    uint256 redemption_fee;
    uint256 buyback_fee;
    uint256 recollat_fee;
    uint256 missing_decimals;
    uint8 loan_limit;

    uint256 private constant PRICE_PRECISION = 1e6;

    DS private DScontract;
    DSS private DSScontract;
    CDSMarketFactory private cds_factory;

    mapping (address => uint256) public redeemDSSBalances;
    mapping (address => uint256) public redeemCollateralBalances;
    uint256 public unclaimedPoolCollateral;
    uint256 public unclaimedPoolDSS;
    mapping (address => uint256) public lastRedeemed;

    // BORROWERS

    struct LoanMetadata {
        uint8 id;
        uint256 principal; 
        uint256 totalDebt;
        uint256 duration;
        uint256 repaymentDate;
        uint256 amountRepaid;
        bool approved;
    }

    struct LoanData{
        uint256 _total_borrowed_amount; 
        uint256 _accrued_interest; 
    }

    mapping(address=>bool) public is_borrower;
    
    mapping(address => LoanMetaData[]) current_loan_data;
    mapping(address => uint) num_proposals;
    mapping(address => uint) num_loans;
    uint8 immutable MAX_LOANS = 1;
    uint8 immutable MAX_PROPOSALS = 1;
    //uint256 immutable MAX_DURATION = 0;
    //uint256 immutable MAX_PRINCPAL = 0;

    address[] public borrowers_array;
    
    mapping(address=>uint256) public borrower_allowance; 
    mapping(address=>uint256) public borrower_debt;
    uint256 total_borrowed_amount;
    uint256 immutable public proposal_fee; // paying for cds market creation on proposal submission.
    uint256 accrued_interest;

    modifier onlyByOwnGov() {
        require(msg.sender == timelock_address || msg.sender == owner, "Not owner or timelock");
        _;
    }

    modifier onlyBorrower(){
        require(is_borrower[msg.sender], "Is Not Borrower"); 
        _;

    }

    constructor (
        address _ds_address,
        address _dss_address,
        address _collateral_address,
        address _creator_address,
        address _timelock_address,
        address _cds_factory
    ) public Owned(_creator_address){
        require(
            (_ds_address != address(0))
            && (_dss_address != address(0))
            && (_collateral_address != address(0))
            && (_creator_address != address(0))
            && (_timelock_address != address(0))
            && (_cds_factory != address(0))
        , "Zero address detected"); 

        DScontract = DS(_ds_address);
        DSScontract = DSS(_dss_address); 
        ds_address = _ds_address; 
        dss_address = _dss_address; 
        collateral_address = _collateral_address; 
        creator_address = _creator_address; 
        timelock_address = _timelock_address;
        cds_factory = CDSMarketFactory(_cds_factory);
        //missing_decimals = uint(6).sub(collateral_token.decimals());
        missing_decimals = uint(0);
        proposal_fee = 1e19;
        
    }

    function mintDS(uint256 collateral_amount, uint256 DS_out_min) external  {
        uint256 collateral_amount_d18 = collateral_amount * (10 ** missing_decimals);
      
        uint256 DS_amount_18 = collateral_amount_d18; //1to1
        DS_amount_18 = (DS_amount_18.mul(uint(1e6).sub(minting_fee))).div(uint(1e6));
        require(DS_out_min <= DS_amount_18); 

        TransferHelper.safeTransferFrom(collateral_address, msg.sender, address(this), collateral_amount);
        DScontract.pool_mint(msg.sender, DS_amount_18);
        
    }


    function redeemDS(uint256 DS_amount, uint256 DSS_out_min, uint256 COLLATERAL_out_min) external {
        uint256 dss_price = DScontract.dss_price();
        uint256 collateral_ratio = DScontract.get_collateral_ratio(); 
        uint256 DS_amount_18 = DS_amount.mul(10**missing_decimals);

        uint256 DS_amount_post_fee = (DS_amount.mul(uint(1e6).sub(redemption_fee))).div(uint(1e6)); 
        uint256 dss_dollar_value = DS_amount_post_fee.sub(DS_amount_post_fee.mul(collateral_ratio).div(PRICE_PRECISION)); 
        uint256 dss_amount = dss_dollar_value.mul(PRICE_PRECISION).div(dss_price); 

        uint256 DS_amount_precision = DS_amount_post_fee;
        uint256 collateral_dollar_value = DS_amount_precision.mul(collateral_ratio).div(PRICE_PRECISION);
        uint256 collateral_amount = collateral_dollar_value;//.mul(10**missing_decimals); //for now assume collateral is stable 

        redeemCollateralBalances[msg.sender] = redeemCollateralBalances[msg.sender].add(collateral_amount);
        unclaimedPoolCollateral = unclaimedPoolCollateral.add(collateral_amount);

        redeemDSSBalances[msg.sender] = redeemDSSBalances[msg.sender].add(dss_amount);
        unclaimedPoolDSS = unclaimedPoolDSS.add(dss_amount);

        lastRedeemed[msg.sender] = block.number; 
        DScontract.pool_burn(msg.sender, DS_amount_18);
        DSScontract.pool_mint(address(this), dss_amount);
    }

    function collectRedemption(uint256 col_idx) external returns (uint256 dss_amount, uint256 collateral_amount) {
        // require(redeemPaused[col_idx] == false, "Redeeming is paused");
        // require((lastRedeemed[msg.sender].add(redemption_delay)) <= block.number, "Too soon");
        bool sendDSS = false; 
        bool sendCollateral = false; 

        if (redeemDSSBalances[msg.sender]>0){
            dss_amount = redeemDSSBalances[msg.sender]; 
            redeemDSSBalances[msg.sender] = 0; 
            unclaimedPoolDSS = unclaimedPoolDSS.sub(dss_amount); 
            sendDSS = true;
        }

        if (redeemCollateralBalances[msg.sender]>0){
            collateral_amount = redeemCollateralBalances[msg.sender]; 
            redeemCollateralBalances[msg.sender] = 0; 
            unclaimedPoolCollateral = unclaimedPoolCollateral.sub(collateral_amount);
            sendCollateral = true;
        }

        if (sendDSS){
            TransferHelper.safeTransfer(address(DSScontract), msg.sender, dss_amount);
        }

        if (sendCollateral){
            TransferHelper.safeTransfer(collateral_address, msg.sender, collateral_amount);
        }

    }

    function setPoolParameters(uint256 new_ceiling, uint256 new_bonus_rate, uint256 new_redemption_delay, uint256 new_mint_fee, uint256 new_redeem_fee, uint256 new_buyback_fee, uint256 new_recollat_fee) external onlyByOwnGov {
        pool_ceiling = new_ceiling;
        bonus_rate = new_bonus_rate;
        redemption_delay = new_redemption_delay;
        minting_fee = new_mint_fee;
        redemption_fee = new_redeem_fee;
        buyback_fee = new_buyback_fee;
        recollat_fee = new_recollat_fee;

        //emit PoolParametersSet(new_ceiling, new_bonus_rate, new_redemption_delay, new_mint_fee, new_redeem_fee, new_buyback_fee, new_recollat_fee);
    }

    //Borrowing and Repaying 

    function submitProposal( //called by recipient.
        uint8 _id,
        uint256 _principal,
        uint256 _duration,
        uint256 _totalDebt
    ) external {
        require(num_proposals[msg.sender] < MAX_PROPOSALS, "proposal limit reached");
        
        for (uint i=0; i < num_proposals[msg.sender]; i++) {
            require(current_loan_data[msg.sender][i].id != id, "Loan ID must be unique");
        }
        num_proposals[msg.sender]++;
        current_loan_data[msg.sender].push(LoanMetaData({
            id: _id,
            principal: _principal,
            totalDebt: _totalDebt,
            amountRepaid: 0,
            duration: _duration,
            repaymentDate: 0,
            approved: false
        }));
        // create CDS Market here???
        emit LoanProposal(msg.sender, _id);
    }

    function removeProposal(uint8 id) external returns (bool) {
        return removeProposal(msg.sender, id);
    }

    function removeProposal(address recipient, uint8 id) onlyByOwnGov external returns (bool) {
        for (uint i = 0; i < num_proposals[recipient]; i++) {
            if (id == current_loan_data[recipient][i].id){
                emit LoanProposalRemoval(recipient, current_loan_data[recipient][i]);
                _removeLoan(recipient, i);
                num_proposals[recipient]--;
                // delete CDS Market here???
                return true;
            }
        }
        return false;
    }

    function _removeLoan(address addr, uint i) private {
        require(i < current_loan_data[addr].length, "invalid array index");
        uint256 terminal_index = current_loan_data[addr].length - 1;
        current_loan_data[addr][i] = current_loan_data[addr][terminal_index];
        current_loan_data[addr].pop();

    }

    function approveLoan(address recipient, uint256 id) onlyByOwnGov internal returns (bool) {
        require(num_loans[recipient] < MAX_LOANS, "max number of loans reached");
        for (uint i = 0; i < current_loan_data[recipient].length; i++) {
            if (id == current_loan_data[recipient][i].id) {
                require(!current_loan_data[recipient][i].approved, "loan already approved");
                
                emit LoanApproval(recipient, current_loan_data[recipient][i]);
                current_loan_data[recipient][i].approved = true;
                current_loan_data[recipient][i].repaymentDate = block.timestamp + current_loan_data[recipient][i].duration;
                
                if (!is_borrower[recipient]) {
                    is_borrower[recipient] = true;
                    borrowers_array.push(recipient);
                }
                
                num_loans[recipient]++;
                num_proposals[recipient]--;
                borrower_allowance[recipient] += current_loan_data[recipient].principal;
                borrower_debt[recipient] += current_loan_data[recipient].principal;
                // do something w/ cds market here?
                return true;
            }
        }
        return false;
    }

    function borrow(uint256 amount) external onlyBorrower {
        require(amount <= borrower_allowance[msg.sender], "Exceeds borrow allowance");
        require(amount > 0, "amount must be greater than 0");
        borrower_allowance[msg.sender] = borrower_allowance[msg.sender].sub(amount);
        TransferHelper.safeTransfer(collateral_address, msg.sender, amount);
        borrower_debt[msg.sender] = borrower_debt[msg.sender].add(amount);
        total_borrowed_amount = total_borrowed_amount.add(amount);
        emit FundsBorrowed(msg.sender, amount);
    }

    function repay(uint256 repay_principal, uint256 repay_interest, uint8 loan_id) external onlyBorrower returns (bool) {
        uint256 total_repayment = repay_principal.add(repay_interest);
        for (uint i = 0; i< current_loan_data[msg.sender].length; i++) {
            if (id == current_loan_data[msg.sender][i].id) {
                LoanMetaData storage loan = current_loan_data[msg.sender][i];
                require(loan.amountRepaid + total_repayment <= loan.principal, "overpaid for specified loan");
                
                loan.amountRepaid += total_repayment;
                borrower_debt[msg.sender] = borrower_debt[msg.sender].sub(repay_principal);
                accrued_interest.add(repay_interest);
                console.log('total_borrowed_amount', total_borrowed_amount);
                total_borrowed_amount = total_borrowed_amount.sub(repay_principal);

                TransferHelper.safeTransferFrom(collateral_address, msg.sender, address(this), total_repayment); 
                if (loan.amountRepaid == loan.totalDebt) {
                    emit FullRepayment(msg.sender, loan);
                    // do something w/ cds here.
                    num_loans[msg.sender]--;
                    _removeLoan(msg.sender, loan.id);
                    if (num_loans[msg.sender] == 0) {
                        is_borrower[msg.sender] = false;
                        removerBorrower(borrower);
                    }
                }
                return true;
            }
        }
        return false;
    }

    function removeBorrower(address borrower) private{
        uint length = borrowers_array.length;
        for (uint i = 0; i < length; i++) {
            if (borrower == borrowers_array[i]) {
                borrowers_array[i] = borrowers_array[length - 1];
                borrowers_array.pop();
            }
        }
    }

    function fullDefaultCheck() onlyByOwnGov public {
        for (uint i = 0; i < borrowers_array.length; i++) {
            address borrower = borrowers_array[i];
            for (uint j = 0; j < current_loan_data[borrower].length; j ++) {
                checkDefault(borrower, j);
            }
        }
    }

    function checkDefault(address recipient, uint256 index) private {
        if (current_loan_data[recipient][index].repaymentDate < block.timestamp) {
            emit Default(recipient, current_loan_data[recipient]);
            num_loans[recipient]--;
            // default logic handler => resolve cds market
        }
    }

    // restricitons on access?
    function addressCheckDefault(address reciepient) onlyByOwnGov public {
        for (uint i = 0; i < current_loan_data[recipient].length; i++) {
            if (current_loan_data[j].repaymentDate < block.timestamp) {
                    checkDefault(borrower, j);
                }
        }
    }

    function get_loan_data() public view returns(LoanData memory){
        LoanData memory loandata = LoanData({
            _total_borrowed_amount: total_borrowed_amount, 
            _accrued_interest : accrued_interest
            });
        return loandata; 
    }

    /* ========== EVENTS ========== */
    event LoanProposal(address indexed recipient, uint loan_id);
    event LoanApproval(address indexed recipient, LoanMetaData loan);
    event FullRepayment(address indexed recipient, LoanMetaData loan);
    event Default(address indexed defaultor, LoanMetaData loan);
    event LoanProposalRemoval(address indexed recipient, LoanMetaData loan);
    event FundsBorrowed(address indexed recipient, uint256 amount);
}