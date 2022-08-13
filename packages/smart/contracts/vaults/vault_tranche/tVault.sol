// pragma solidity ^0.8.4;


// import {Auth} from "../auth/Auth.sol";
// import {ERC4626} from "../mixins/ERC4626.sol";

// import {SafeCastLib} from "../utils/SafeCastLib.sol";
// import {SafeTransferLib} from "../utils/SafeTransferLib.sol";
// import {FixedPointMathLib} from "../utils/FixedPointMathLib.sol";

// import {ERC20} from "../tokens/ERC20.sol";
// import {Instrument} from "../instrument.sol";
// import {Vault} from "../vault.sol";
// import "@openzeppelin/contracts/utils/math/Math.sol";


// /// @notice super vault that accepts any combinations of ERC4626 instruments at initialization, and will
// /// automatically invest/divest when minting/redeeming 
// /// @dev instance is generated for every splitter
// contract tVault is Vault, Auth{
// 	using SafeCastLib for uint256; 
//     using SafeTransferLib for ERC20;
//     using FixedPointMathLib for uint256;

//     uint256 num_instrument; 
//     uint256[] ratios; 
//     address[] instruments; 
//     uint256 init_time; 
//     uint256 junior_weight; 
//     uint256 promisedReturn; 
//     ERC20 want; 

//     mapping(address=>uint256) addressToIndex; 

//     uint256[] initial_exchange_rates; 

//     uint256 constant PRICE_PRECISION = 1e18; 

//     /// @notice when intialized, will take in a few ERC4626 instruments (address) as base instruments
//     /// @param _want is the base assets for all the instruments e.g usdc
//     /// @param _instruments are ERC4626 addresses that will comprise this super vault
//     /// @param _ratios are the ratio of value invested for each instruments
//     /// @param _junior_weight is the allocation between junior/senior tranche (senior is 1-junior)
//     /// @param _time_to_maturity is time until the tranche tokens redemption price will be determined
//     /// and tranche tokens can be redeemed separately 
//     /// @param _promisedReturn is the promised senior return gauranteed by junior holders 
//     function init(
//     	ERC20 _want, 
//     	address[] memory _instruments, 
//     	uint256[] memory _ratios, 
//     	uint256 _junior_weight, 
//     	uint256 _promisedReturn, 
//     	uint256 _time_to_maturity)
//     internal 
//     {	
//     	want = _want; 
//     	instruments = _instruments; 
//     	num_instrument = _instruments.length; 
//     	ratios = _ratios; 
//     	junior_weight = _junior_weight; 
//     	promisedReturn = _promisedReturn; 
//     	time_to_maturity = _time_to_maturity; 
//     	init_time = block.timestamp; 

//     	//need to get initial exchange rate between the instruments and want 
//     	for (uint i=0; i< num_instrument; i++){
//     		addressToIndex[instruments[i]] = i; 
//     		initial_exchange_rates[i] = get_exchange_rate(instruments[i]); 
//     	}
//     }

//     /// @notice get the amount of shares for the instrument one would obtain
//     /// by depositing one want token 
//     function get_exchange_rate(address instrument) internal view returns(uint256){
//     	return ERC4626(instrument).previewDeposit(PRICE_PRECISION); 
//     }

//     /// @notice will automatically invest into the ERC4626 instruments and give out 
//     /// vault tokens as share
//     function mint(uint256 shares, address receiver) public  {
//         assets = previewMint(shares); // No need to check for rounding error, previewMint rounds up.

//         asset.safeTransferFrom(msg.sender, address(this), assets);
//         _mint(receiver, shares);
//         emit Deposit(msg.sender, receiver, assets, shares);
//         afterDeposit(assets, shares);

//         invest(shares); 

//     }


//     /// @notice will automatically divest from the instruments
//     function redeem(
//         uint256 shares,
//         address receiver,
//         address owner
//     ) public  {
//         if (msg.sender != owner) {
//             uint256 allowed = allowance[owner][msg.sender]; // Saves gas for limited approvals.

//             if (allowed != type(uint256).max) allowance[owner][msg.sender] = allowed - shares;
//         }

//         // Check for rounding error since we round down in previewRedeem.
//         require((assets = previewRedeem(shares)) != 0, "ZERO_ASSETS");
//         beforeWithdraw(assets, shares);
//         _burn(owner, shares);
//         emit Withdraw(msg.sender, receiver, owner, assets, shares);
//         asset.safeTransfer(receiver, assets);

//         divest(assets); 
//     }

//     /// @notice will invest into the current instruments, which is equivalent to minting erc4626
//     /// @param shares are denominated in vault token
//     function invest(uint256 shares) internal {

//     }

//     /// @notice will divest from current instruments, which is equivalent to redeeming erc4626
//     /// @param assets are denominated in underlying token
//     function divest(uint256 assets) internal{

//     }


//     function isMatured() public view returns(bool){
//     	return (block.timestamp - init_time) > time_to_maturity; 
//     }

//     function getUnderlying() public view returns(address){
//     	return address(underlying); 
//     }

//     function getJuniorWeight() public view returns(uint256){
//     	return junior_weight; 
//     }

//     function getPromisedReturn() public view returns(uint256){
//     	return promisedReturn; 
//     }

//     /// @notice get average real returns collected by the vault in this supervault until now  
//     /// real return is computed by (final_value_of_vault/initial_value_of_vault) - 1
//     function getCurrentRealReturn() public view returns(uint256){
//     	uint256[] memory real_returns = new uint256[](num_instrument); 
//     	uint256 sum_return; 
//     	for (uint i=0; i< num_instrument; i++){
//     		real_returns[i] = (get_exchange_rate(instruments[i])/initial_exchange_rates[i])*PRICE_PRECISION;
//     		sum_return += real_returns[i] - PRICE_PRECISION; 
// 		}

// 		return (sum_return/num_instrument); 
		
//     }



 

// }
