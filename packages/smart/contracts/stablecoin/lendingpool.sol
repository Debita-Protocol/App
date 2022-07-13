pragma solidity 0.7.6;
pragma abicoder v2; 

import "./owned.sol";
import "./DS.sol"; 
import "./DSS.sol"; 
import "./TransferHelper.sol";
import "../ERC20/ERC20.sol";
import "../Common/SafeMath.sol";
//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";
import "./ILendingPool.sol";
import "./IManager.sol";

//borrowers borrow and repay from this lendingpool 
contract LendingPool is ILendingPool, Owned {

    struct LoanMetadata {
        ERC20 underlyingToken;
        uint256 principal;
        uint256 totalDebt;
        uint256 amountRepaid;
        uint256 duration;
        uint256 repaymentDate;
        address recipient;
    }

    struct LoanData{
        uint256 _total_borrowed_amount; 
        uint256 _accrued_interest; 
    }


    using SafeMath for uint256;

    address ds_address; 
    address dss_address; 
    address collateral_address; 
    address creator_address; 
    address timelock_address; 


    uint256 pool_ceiling;
    uint256 bonus_rate;
    uint256 redemption_delay;
    uint256 minting_fee;
    uint256 redemption_fee;
    uint256 buyback_fee;
    uint256 recollat_fee;
    uint256 missing_decimals; 

    uint256 private constant PRICE_PRECISION = 1e6;

    ERC20 private collateral_token;

    DS private DScontract;
    DSS private DSScontract;

    mapping (address => uint256) public redeemDSSBalances;
    mapping (address => uint256) public redeemCollateralBalances;
    uint256 public unclaimedPoolCollateral;
    uint256 public unclaimedPoolDSS;
    mapping (address => uint256) public lastRedeemed;

    //Borrowers Variable 
    mapping(address=>bool) public isBorrower;
    mapping(address=>bool) public isRegistered;
    mapping(address=>uint256) public borrower_allowance; 
    mapping(address=>uint256) public borrower_debt; 
    mapping(address=>LoanMetadata) public borrower_data; 
    uint256 total_borrowed_amount;
    uint256 immutable public proposal_fee;
    uint256 accrued_interest;

    //Manager
    mapping(address=>bool) public isManager; 

    modifier onlyByOwnGov() {
        require(msg.sender == timelock_address || msg.sender == owner, "Not owner or timelock");
        _;
    }

    modifier onlyManager(){
        require(isManager[msg.sender], "Is Not Manager"); 
        _;
    }

    modifier onlyBorrower(){
        require(isBorrower[msg.sender], "Is Not Borrower"); 
        _;

    }

    modifier onlyRegistered(address addr) {
        require(isRegistered[addr], "is not registered");
        _;
    }

    constructor (
        address _ds_address,
        address _dss_address,
        address _collateral_address,
        address _creator_address,

        address _timelock_address,
        address _cds_factory

        address _timelock_address
       // uint256 _pool_ceiling
    ) public Owned(_creator_address){
        require(
            (_ds_address != address(0))
            && (_dss_address != address(0))
            && (_collateral_address != address(0))
            && (_creator_address != address(0))
            && (_timelock_address != address(0))
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

    //Currently ds decimals is 6, same as USDC, so collateral amount should also be decimal 6
    function mintDS(uint256 collateral_amount, uint256 DS_out_min) external override {
        uint256 collateral_amount_d18 = collateral_amount * (10 ** missing_decimals);
      
        uint256 DS_amount_18 = collateral_amount_d18; //1to1
        DS_amount_18 = (DS_amount_18.mul(uint(1e6).sub(minting_fee))).div(uint(1e6));
        require(DS_out_min <= DS_amount_18); 

        TransferHelper.safeTransferFrom(address(collateral_token), msg.sender, address(this), collateral_amount);
        DScontract.pool_mint(msg.sender, DS_amount_18);
        
    }


    function redeemDS(uint256 DS_amount, uint256 DSS_out_min, uint256 COLLATERAL_out_min) external override {
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

    function collectRedemption(uint256 col_idx) external override returns (uint256 dss_amount, uint256 collateral_amount) {
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
    function setPoolParameters(uint256 new_ceiling, uint256 new_bonus_rate, uint256 new_redemption_delay, uint256 new_mint_fee, uint256 new_redeem_fee, uint256 new_buyback_fee, uint256 new_recollat_fee) external override onlyByOwnGov {
        pool_ceiling = new_ceiling;
        bonus_rate = new_bonus_rate;
        redemption_delay = new_redemption_delay;
        minting_fee = new_mint_fee;
        redemption_fee = new_redeem_fee;
        buyback_fee = new_buyback_fee;
        recollat_fee = new_recollat_fee;

        //emit PoolParametersSet(new_ceiling, new_bonus_rate, new_redemption_delay, new_mint_fee, new_redeem_fee, new_buyback_fee, new_recollat_fee);
    }

    //Manager Functions

    function addManager(address manager) external override onlyByOwnGov{
        isManager[manager] = true; 
    }

    function managerMintDS(uint256 amount) external override onlyManager {
        DScontract.pool_mint(msg.sender, amount);

    }
    function managerBurnDS(uint256 amount) external override onlyManager {
        DScontract.pool_burn(msg.sender, amount);

    }

    //TODO external for now, but needs to be internal+called when borrower proposes
    function addValidator(address validator, address manager) external {
        IManager(manager).addValidator(validator);
        

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




    //Borrowing and Repaying 

    //Approved Borrower is added by owner or governance 
    function addBorrower(address _recipient, uint256 _principal, 
        uint256 _totalDebt, uint256 _duration, ERC20 _underlyingToken) public onlyByOwnGov {
        require(!isBorrower[_recipient], "Already Approved Borrower"); 
        isBorrower[_recipient] = true;
        borrower_allowance[_recipient] = _principal;

        borrower_data[_recipient] = LoanMetadata(
            _underlyingToken,
            _principal,
            _totalDebt,
            0,
            _duration,
            _duration + block.timestamp,
            _recipient
        );
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

    function approveBorrower(address _recipient) public onlyByOwnGov onlyRegistered(_recipient) {
        require(!isBorrower[_recipient], "Already Approved Borrower"); 
        isBorrower[_recipient] = true;

    }

    function registerBorrower() external {
        require(!isRegistered[msg.sender], "already paid proposal fee");
        TransferHelper.safeTransferFrom(address(collateral_token), msg.sender,address(this), proposal_fee);
        isRegistered[msg.sender] = true;
    }

    function submitProposal (
        address _recipient, 
        uint256 _principal, 
        uint256 _totalDebt, 
        uint256 _duration, 
        ERC20 _underlyingToken
    ) public onlyRegistered(_recipient) {
        require(!isBorrower[_recipient], "Already Approved Borrower");
        require(_recipient != address(0));
        borrower_data[_recipient] = LoanMetadata(
            _underlyingToken,
            _principal,
            _totalDebt,
            0,
            _duration,
            _duration + block.timestamp,
            _recipient
        );
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


    function borrow(uint256 amount) external onlyBorrower onlyRegistered(msg.sender) {
        require(amount <= borrower_allowance[msg.sender], "Exceeds borrow allowance");
        require(amount > 0, "amount must be greater than 0");
        borrower_allowance[msg.sender] = borrower_allowance[msg.sender].sub(amount);
        TransferHelper.safeTransfer(collateral_address, msg.sender, amount);
        borrower_debt[msg.sender] = borrower_debt[msg.sender].add(amount); 
        total_borrowed_amount = total_borrowed_amount.add(amount); 


    }

    function repay(uint256 repay_principal, uint256 repay_interest) external onlyBorrower {

        uint256 total_repayment = repay_principal.add(repay_interest);
        TransferHelper.safeTransferFrom(collateral_address, msg.sender, address(this), total_repayment); 

        borrower_debt[msg.sender] = borrower_debt[msg.sender].sub(repay_principal); 
        accrued_interest.add(repay_interest);
        console.log('total_borrowed_amount', total_borrowed_amount);
        total_borrowed_amount = total_borrowed_amount.sub(repay_principal);

        if (borrower_debt[msg.sender]==0){
            isBorrower[msg.sender] = false; 
            delete borrower_data[msg.sender]; 

        }
    }


    function getBorrowerData(address borrower_address) public view returns (LoanMetadata memory)  {
        return borrower_data[borrower_address]; 

    }


    function get_loan_data() public view returns(LoanData memory){
        LoanData memory loandata = LoanData({
            _total_borrowed_amount: total_borrowed_amount, 
            _accrued_interest : accrued_interest
            });
        return loandata; 
    }


}