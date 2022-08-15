pragma solidity ^0.8.4;

import "./owned.sol";
import "./DS.sol";
import "./DSS.sol";
import "../ERC20/IERC20.sol";
import "../ERC20/SafeERC20.sol";
import "hardhat/console.sol";
import "./ILendingPool.sol";
import "./IController.sol";
import "@openzeppelin/contracts/utils/Address.sol";

//borrowers borrow and repay from this lendingpool
contract LendingPool is ILendingPool, Owned {
    using SafeERC20 for IERC20;
    using Address for address;

    // addresses
    address private collateral_address;
    address private creator_address;
    address private timelock_address;
    IController private controller; 
    DS private DScontract;
    DSS private DSScontract;

    // pool parameters
    uint256 pool_ceiling;
    uint256 bonus_rate;
    uint256 redemption_delay;
    uint256 minting_fee;
    uint256 redemption_fee;
    uint256 buyback_fee;
    uint256 recollat_fee;
    uint256 missing_decimals;
    uint256 private constant PRICE_PRECISION = 1e6;
    uint256 public total_borrowed_amount;
    uint256 public accrued_interest;
    uint256 immutable public MAX_LOANS = 20;
    uint256 immutable public MAX_PROPOSALS = 20;

    // mint/redeem
    mapping(address => uint256) public redeemDSSBalances;
    mapping(address => uint256) public redeemCollateralBalances;
    uint256 public unclaimedPoolCollateral;
    uint256 public unclaimedPoolDSS;
    mapping(address => uint256) public lastRedeemed;

    // loan
    mapping(address => bool) public override is_borrower;
    mapping(address => uint256) public override borrower_allowance; // borrower total allowance
    mapping(address => uint256) public override amount_borrowed; // borrower total amount borrowed
    mapping(address => LoanMetadata[]) public current_loan_data; // current pending proposals and active loans for each user.
    mapping(address => uint256) public override num_loans;
    mapping(address => uint256) public override num_proposals;
    address[] public borrowers_array;
    mapping(bytes32 => bool) id_taken;

    modifier onlyByOwnGov() {
        require(msg.sender == timelock_address || msg.sender == owner, "Not owner or timelock");
        _;
    }

    modifier onlyController() {
        require(address(controller) == msg.sender, "is not controller");
        _;
    }

    modifier onlyBorrower() {
        require(is_borrower[msg.sender], "is not borrower");
        _;
    }

    modifier onlyVerified() {
        //require(controller.verified(msg.sender), "address not verified");
        _;
    }

    modifier onlyValidator() {
        require(controller.validators(msg.sender), "address must be validator");
        _;
    }

    modifier onlyContract() {
        require(address(msg.sender).isContract(), "is not smart contract");
        _;
    }

    constructor(
        address _ds_address,
        address _dss_address,
        address _collateral_address,
        address _creator_address,
        address _timelock_address
    ) public Owned(_creator_address) {
        require(
            (_ds_address != address(0)) &&
                (_dss_address != address(0)) &&
                (_collateral_address != address(0)) &&
                (_creator_address != address(0)) &&
                (_timelock_address != address(0)),
            "Zero address detected"
        );

        DScontract = DS(_ds_address);
        DSScontract = DSS(_dss_address);
        collateral_address = _collateral_address;
        creator_address = _creator_address;
        timelock_address = _timelock_address;
        missing_decimals = uint256(0);
    }

    //Currently ds decimals is 6, same as USDC, so collateral amount should also be decimal 6
    function mintDS(uint256 collateral_amount, uint256 DS_out_min) external override {
        uint256 collateral_amount_d18 = collateral_amount * (10**missing_decimals);

        uint256 DS_amount_18 = collateral_amount_d18; //1to1
        DS_amount_18 = (DS_amount_18 * (1e6 - minting_fee)) / 1e6; // (DS_amount_18.mul(uint(1e6).sub(minting_fee))).div(uint(1e6));
        require(DS_out_min <= DS_amount_18);

        IERC20(collateral_address).safeTransferFrom(msg.sender, address(this), collateral_amount);
        //TransferHelper.safeTransferFrom(collateral_address, msg.sender, address(this), collateral_amount);
        DScontract.pool_mint(msg.sender, DS_amount_18);
    }

    function redeemDS(
        uint256 DS_amount,
        uint256 DSS_out_min,
        uint256 COLLATERAL_out_min
    ) external override {
        uint256 dss_price = DScontract.dss_price();
        uint256 collateral_ratio = DScontract.get_collateral_ratio();
        uint256 DS_amount_18 = DS_amount * 10**missing_decimals; // DS_amount.mul(10**missing_decimals);

        uint256 DS_amount_post_fee = (DS_amount * (1e6 - redemption_fee)) / 1e6; // (DS_amount.mul(uint(1e6).sub(redemption_fee))).div(uint(1e6));
        uint256 dss_dollar_value = DS_amount_post_fee - ((DS_amount_post_fee * collateral_ratio) / PRICE_PRECISION); // DS_amount_post_fee.sub(DS_amount_post_fee.mul(collateral_ratio).div(PRICE_PRECISION));
        uint256 dss_amount = (dss_dollar_value * PRICE_PRECISION) / dss_price; // dss_dollar_value.mul(PRICE_PRECISION).div(dss_price);

        uint256 DS_amount_precision = DS_amount_post_fee;
        uint256 collateral_dollar_value = (DS_amount_precision * collateral_ratio) / PRICE_PRECISION; // DS_amount_precision.mul(collateral_ratio).div(PRICE_PRECISION);
        uint256 collateral_amount = collateral_dollar_value; //.mul(10**missing_decimals); //for now assume collateral is stable

        redeemCollateralBalances[msg.sender] = redeemCollateralBalances[msg.sender] + collateral_amount; // redeemCollateralBalances[msg.sender].add(collateral_amount);
        unclaimedPoolCollateral = unclaimedPoolCollateral + collateral_amount; // unclaimedPoolCollateral.add(collateral_amount);

        redeemDSSBalances[msg.sender] = redeemDSSBalances[msg.sender] + dss_amount; // redeemDSSBalances[msg.sender].add(dss_amount);
        unclaimedPoolDSS = unclaimedPoolDSS + dss_amount; // unclaimedPoolDSS.add(dss_amount);

        lastRedeemed[msg.sender] = block.number;
        DScontract.pool_burn(msg.sender, DS_amount_18);
        DSScontract.pool_mint(address(this), dss_amount);
    }

    function collectRedemption(uint256 col_idx)
        external
        override
        returns (uint256 dss_amount, uint256 collateral_amount)
    {
        // require(redeemPaused[col_idx] == false, "Redeeming is paused");
        // require((lastRedeemed[msg.sender].add(redemption_delay)) <= block.number, "Too soon");
        bool sendDSS = false;
        bool sendCollateral = false;

        if (redeemDSSBalances[msg.sender] > 0) {
            dss_amount = redeemDSSBalances[msg.sender];
            redeemDSSBalances[msg.sender] = 0;
            unclaimedPoolDSS = unclaimedPoolDSS - dss_amount; // unclaimedPoolDSS.sub(dss_amount);
            sendDSS = true;
        }

        if (redeemCollateralBalances[msg.sender] > 0) {
            collateral_amount = redeemCollateralBalances[msg.sender];
            redeemCollateralBalances[msg.sender] = 0;
            unclaimedPoolCollateral = unclaimedPoolCollateral - collateral_amount; // unclaimedPoolCollateral.sub(collateral_amount);
            sendCollateral = true;
        }

        if (sendDSS) {
            //TransferHelper.safeTransfer(address(DSScontract), msg.sender, dss_amount);
            IERC20(address(DSScontract)).safeTransfer(msg.sender, dss_amount);
        }

        if (sendCollateral) {
            //TransferHelper.safeTransfer(collateral_address, msg.sender, collateral_amount);
            IERC20(address(collateral_address)).safeTransfer(msg.sender, collateral_amount);
        }
    }

    function setPoolParameters(
        uint256 new_ceiling,
        uint256 new_bonus_rate,
        uint256 new_redemption_delay,
        uint256 new_mint_fee,
        uint256 new_redeem_fee,
        uint256 new_buyback_fee,
        uint256 new_recollat_fee
    ) external override onlyByOwnGov {
        pool_ceiling = new_ceiling;
        bonus_rate = new_bonus_rate;
        redemption_delay = new_redemption_delay;
        minting_fee = new_mint_fee;
        redemption_fee = new_redeem_fee;
        buyback_fee = new_buyback_fee;
        recollat_fee = new_recollat_fee;

        //emit PoolParametersSet(new_ceiling, new_bonus_rate, new_redemption_delay, new_mint_fee, new_redeem_fee, new_buyback_fee, new_recollat_fee);
    }

    //Controller Functions

    function setController(address _controller) external override onlyByOwnGov {
        controller = IController(_controller);
    }

    function controllerMintDS(uint256 amount) external override onlyController {
        DScontract.pool_mint(msg.sender, amount);
    }

    function controllerBurnDS(uint256 amount) external override onlyController {
        DScontract.pool_burn(msg.sender, amount);
    }

    //TODO external for now, but needs to be internal+called when borrower proposes
    function addValidator(address validator) external override {
        controller.addValidator(validator);
    }

    // loan functions
    function addDiscretionaryLoanProposal(
        bytes32 _id,
        uint256 _principal,
        uint256 _duration,
        uint256 _totalInterest,
        string calldata _description,
        IController.MarketInfo memory market_info
    ) external override onlyVerified {
        require(_principal > 0, "principal must be greater than 0");
        require(_duration > 0, "duration must be greater than 0");
        require(_totalInterest > 0, "total interst must be greater than 0");
        require(num_proposals[msg.sender] < MAX_PROPOSALS, "proposal limit reached");
        require(_principal >= 10**DScontract.decimals(), "Needs to be in decimal format"); // should be collateral address, not DS. Can't be less than 1.0 X?
        require(!id_taken[_id], "loan id must be unique");

        num_proposals[msg.sender]++;
        id_taken[_id] = true;

        current_loan_data[msg.sender].push(
            LoanMetadata({
                id: _id,
                principal: _principal,
                totalInterest: _totalInterest,
                duration: _duration,
                interestPaid: 0,
                amountBorrowed: 0,
                description: _description,
                approved: false,
                allowance: 0,
                repaymentDate: 0,
                recipient: address(0)
            })
        );

        //controller.initiateMarket_(market_info, msg.sender, _id);

        emit LoanProposal(msg.sender, _id);
    }

    function addContractLoanProposal(
        bytes32 _id,
        address _recipient,
        uint256 _principal,
        uint256 _duration,
        uint256 _totalInterest,
        string calldata _description,
        IController.MarketInfo memory market_info
    ) external override onlyVerified {
        require(_principal > 0, "principal must be greater than 0");
        require(_duration > 0, "duration must be greater than 0");
        require(_totalInterest > 0, "total interst must be greater than 0");
        require(num_proposals[msg.sender] < MAX_PROPOSALS, "proposal limit reached");
        require(_principal >= 10**DScontract.decimals(), "Needs to be in decimal format");
        require(address(_recipient).isContract(), "Recipient must be contract");
        require(!id_taken[_id], "loan id must be unique");

        num_proposals[msg.sender]++;
        id_taken[_id] = true;

        current_loan_data[msg.sender].push(
            LoanMetadata({
                id: _id,
                principal: _principal,
                totalInterest: _totalInterest,
                duration: _duration,
                interestPaid: 0,
                amountBorrowed: 0,
                description: _description,
                approved: false,
                allowance: 0,
                repaymentDate: 0,
                recipient: _recipient
            })
        );

        //controller._initiateMarket(market_info, msg.sender, _id);

        emit LoanProposal(msg.sender, _id);
    }

    function removeProposal(bytes32 id) external override onlyVerified returns (bool) {
        return _removeProposal(msg.sender, id);
    }

    function removeProposalGov(address recipient, bytes32 id) external override onlyByOwnGov returns (bool) {
        return _removeProposal(recipient, id);
    }

    function _removeProposal(address recipient, bytes32 id) internal returns (bool) {

        for (uint256 i = 0; i < num_proposals[recipient]; i++) {
            if (id == current_loan_data[recipient][i].id) {
                emit LoanProposalRemoval(recipient, current_loan_data[recipient][i]);

                _removeLoan(recipient, i);

                num_proposals[recipient]--;
                id_taken[id] = false;
                return true;
            }
        }
        return false;
    }

    // called by controller
    function approveLoan(
        address recipient, // owner of loan
        bytes32 id,
        address marketFactoryAddress
    ) public override onlyValidator {
        require(num_loans[recipient] < MAX_LOANS, "max number of loans reached");

        for (uint256 i = 0; i < current_loan_data[recipient].length; i++) {
            if (id == current_loan_data[recipient][i].id) {
                require(!current_loan_data[recipient][i].approved, "loan already approved");

                //require(controller.canBeApproved(recipient, id, marketFactoryAddress), "not market approved");

                LoanMetadata storage loan = current_loan_data[recipient][i];

                loan.approved = true;

                loan.repaymentDate = block.timestamp + loan.duration;

                emit LoanApproval(recipient, current_loan_data[recipient][i]);

                if (!is_borrower[recipient]) {
                    is_borrower[recipient] = true;
                    borrowers_array.push(recipient);
                }

                num_loans[recipient]++;
                num_proposals[recipient]--;
                borrower_allowance[recipient] += loan.principal;
                loan.allowance = loan.principal;
                return;
            }
        }
        revert("loan not found");
    }

    function removeBorrower(address borrower) private {
        uint256 length = borrowers_array.length;
        for (uint256 i = 0; i < length; i++) {
            if (borrower == borrowers_array[i]) {
                borrowers_array[i] = borrowers_array[length - 1];
                borrowers_array.pop();
            }
        }
    }

    function borrow(bytes32 id, uint256 amount) external override onlyBorrower onlyVerified {

        for (uint256 i = 0; i < current_loan_data[msg.sender].length; i++) {
            if (current_loan_data[msg.sender][i].id == id) {
                LoanMetadata storage loan = current_loan_data[msg.sender][i];

                require(loan.approved, "loan not approved");

                require(loan.repaymentDate > block.timestamp, "Loan has already reached maturity");

                require(loan.allowance >= amount, "amount exceed's loan allowance");

                loan.allowance -= amount;

                borrower_allowance[msg.sender] -= amount;

                IERC20(collateral_address).safeTransfer(msg.sender, amount);

                amount_borrowed[msg.sender] += amount;

                loan.amountBorrowed += amount;

                total_borrowed_amount += amount;

                emit FundsBorrowed(msg.sender, amount);

                return;
            }
        }
        revert("loan not found");
    }

    function contractBorrow(
        address owner,
        bytes32 id,
        uint256 amount
    ) external override onlyContract {

        for (uint256 i = 0; i < current_loan_data[owner].length; i++) {
            if (id == current_loan_data[owner][i].id) {
                LoanMetadata storage loan = current_loan_data[owner][i];

                require(loan.recipient == msg.sender, "loan recipient doesn't match caller");
                require(loan.approved, "loan not approved");
                require(loan.repaymentDate > block.timestamp, "Loan has already reached maturity");
                require(loan.allowance >= amount, "amount exceed's loan allowance");

                loan.allowance -= amount;

                borrower_allowance[owner] -= amount;

                IERC20(collateral_address).safeTransfer(msg.sender, amount);

                amount_borrowed[owner] += amount;

                loan.amountBorrowed += amount;

                total_borrowed_amount += amount;

                emit FundsBorrowed(msg.sender, amount);
            }
        }
        revert("loan not found");
    }

    function repay(
        bytes32 id,
        uint256 repay_principal,
        uint256 repay_interest
    ) external override onlyBorrower {
        uint256 total_repayment = repay_principal + repay_interest;

        for (uint256 i = 0; i < current_loan_data[msg.sender].length; i++) {
            if (id == current_loan_data[msg.sender][i].id) {
                LoanMetadata storage loan = current_loan_data[msg.sender][i];

                require(loan.approved, "loan not approved");
                require(loan.repaymentDate > block.timestamp, "Loan has already reached maturity");
                require(loan.interestPaid + repay_interest <= loan.totalInterest, "overpaid for loan interest");
                require(loan.amountBorrowed >= repay_principal, "overpaid for loan principal");

                amount_borrowed[msg.sender] -= repay_principal;

                loan.amountBorrowed -= repay_principal;

                loan.interestPaid += repay_interest;

                accrued_interest += repay_interest;

                console.log("total_borrowed_amount", total_borrowed_amount);

                total_borrowed_amount = total_borrowed_amount - repay_principal;

                //TransferHelper.safeTransferFrom(collateral_address, msg.sender, address(this), total_repayment);
                IERC20(collateral_address).safeTransferFrom(msg.sender, address(this), total_repayment);
                return;
            }
        }
        revert("loan not found");
    }

    function contractRepay(
        address owner,
        bytes32 id,
        uint256 repay_principal,
        uint256 repay_interest
    ) external override onlyContract {
        uint256 total_repayment = repay_principal + repay_interest;

        for (uint256 i = 0; i < current_loan_data[owner].length; i++) {
            if (id == current_loan_data[owner][i].id) {
                LoanMetadata storage loan = current_loan_data[owner][i];

                require(loan.recipient == msg.sender, "loan recipient doesn't match caller");
                require(loan.approved, "loan not approved");
                require(loan.repaymentDate > block.timestamp, "Loan has already reached maturity");
                require(loan.interestPaid + repay_interest <= loan.totalInterest, "overpaid for loan interest");
                require(loan.amountBorrowed >= repay_principal, "overpaid for loan principal");

                amount_borrowed[owner] -= repay_principal;

                loan.amountBorrowed -= repay_principal;

                loan.interestPaid += repay_interest;

                accrued_interest += repay_interest;

                console.log("total_borrowed_amount", total_borrowed_amount);

                total_borrowed_amount = total_borrowed_amount - repay_principal;

                //TransferHelper.safeTransferFrom(collateral_address, msg.sender, address(this), total_repayment);
                IERC20(collateral_address).safeTransferFrom(msg.sender, address(this), total_repayment);
                return;
            }
        }
        revert("loan not found");
    }

    // called by debtor if they want to resolve loan early.
    function resolveLoan(bytes32 id) public override onlyBorrower onlyVerified {
        for (uint256 i = 0; i < current_loan_data[msg.sender].length; i++) {
            if (id == current_loan_data[msg.sender][i].id) {
                LoanMetadata storage loan = current_loan_data[msg.sender][i];

                require(loan.approved, "must be an active loan");
                require(loan.amountBorrowed == 0, "not fully paid back principal");
                require(loan.interestPaid == loan.totalInterest, "not fully paid back interest");
                require(loan.repaymentDate > block.timestamp, "loan already matured");
                _checkLoanStatus(msg.sender, i);
            }
        }
        revert("loan not found");
    }

    function contractResolveLoan(address owner, bytes32 id) public override onlyContract {
        for (uint256 i = 0; i < current_loan_data[owner].length; i++) {
            if (id == current_loan_data[msg.sender][i].id) {
                LoanMetadata storage loan = current_loan_data[owner][i];

                require(loan.recipient == msg.sender, "loan recipient doesn't match caller");
                require(loan.approved, "must be an active loan");
                require(loan.amountBorrowed == 0, "not fully paid back principal");
                require(loan.interestPaid == loan.totalInterest, "not fully paid back interest");
                require(loan.repaymentDate > block.timestamp, "loan already matured");
                _checkLoanStatus(owner, i);
            }
        }
        revert("loan not found");
    }

    // restrictions on acccess?
    function fullLoanCheck() public override {
        for (uint256 i = 0; i < borrowers_array.length; i++) {
            address borrower = borrowers_array[i];
            checkAddressLoans(borrower);
        }
    }

    // helper function: check individual loan
    function _checkLoanStatus(address borrower, uint256 i) private {
        LoanMetadata storage loan = current_loan_data[borrower][i];
        if (loan.amountBorrowed > 0 || loan.interestPaid < loan.totalInterest) {
            if (block.timestamp > loan.repaymentDate) {
                //controller.resolveMarket(borrower, loan.id, true);

                emit Default(borrower, loan);

                num_loans[borrower]--;
                id_taken[loan.id] = false;

                _removeLoan(borrower, i);
            }
        } else {
            // controller.resolveMarket(borrower, loan.id, false);
            emit FullRepayment(borrower, loan);
            // resolve market
            num_loans[borrower]--;
            id_taken[loan.id] = false;
            _removeLoan(borrower, i);
        }
    }

    // checks all user's loan's
    function checkAddressLoans(address borrower) public override {
        for (uint256 i = 0; i < current_loan_data[borrower].length; i++) {
            if (current_loan_data[borrower][i].approved) {
                _checkLoanStatus(borrower, i);
            }
        }
    }

    function checkLoanStatus (address owner, bytes32 id) public override {

        for (uint256 i = 0; i < current_loan_data[owner].length; i++) {
            if (id == current_loan_data[owner][i].id) {
                require(current_loan_data[owner][i].approved, "loan not approved");

                _checkLoanStatus(owner, i);
                return;
            }
        }
        revert("loan not found");
    }

    function _removeLoan(address addr, uint256 i) private {
        require(i < current_loan_data[addr].length, "invalid array index");
        uint256 terminal_index = current_loan_data[addr].length - 1;
        current_loan_data[addr][i] = current_loan_data[addr][terminal_index];
        current_loan_data[addr].pop();
    }

    // GETTERS
    
    function getLoan(address borrower, bytes32 id) public view override returns (LoanMetadata memory) {
        for (uint256 i = 0; i < current_loan_data[borrower].length; i++) {
            if (id == current_loan_data[borrower][i].id) {
                return current_loan_data[borrower][i];
            }
        }
        revert("loan not found");
    }

    function getLoans(address borrower) public view override returns (LoanMetadata[] memory) {
        return current_loan_data[borrower];
    }


    function getBorrowerLoanData(address recipient) public view override returns (LoanMetadata memory) {
        uint256 id = 0; //get first loandata
        return current_loan_data[recipient][id];
    }

    function getProtocolLoanData() public view override returns (LoanData memory) {
        LoanData memory loandata = LoanData({
            _total_borrowed_amount: total_borrowed_amount,
            _accrued_interest: accrued_interest
        });
        return loandata;
    }

    function isApproved(address borrower, uint256 idx) public view returns (bool) {
        LoanMetadata memory loan = current_loan_data[borrower][idx];
        return loan.approved;
    }

    event LoanProposal(address indexed recipient, bytes32 loan_id);
    event LoanApproval(address indexed recipient, LoanMetadata loan);
    event FullRepayment(address indexed recipient, LoanMetadata loan);
    event Default(address indexed defaultor, LoanMetadata loan);
    event LoanProposalRemoval(address indexed recipient, LoanMetadata loan);
    event FundsBorrowed(address indexed recipient, uint256 amount);
}
