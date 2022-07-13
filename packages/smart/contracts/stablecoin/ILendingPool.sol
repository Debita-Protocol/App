// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

interface ILendingPool {
    function redeemDSSBalance(address user) external returns (uint);
    function redeemCollateralBalances(address user) external returns (uint);
    function unclaimedPoolCollateral() external returns (uint);
    function unclaimedPoolDSS() external returns (uint);
    function lastRedeemed(address user) external returns (uint);
    function mintDS(uint256 collateral_amount, uint256 DS_out_min) external;
    function redeemDS(uint256 DS_amount, uint256 DSS_out_min, uint256 COLLATERAL_out_min) external;
    function collectRedemption(uint256 col_idx) external returns (uint256 dss_amount, uint256 collateral_amount);
    function setPoolParameters(uint256 new_ceiling, uint256 new_bonus_rate, uint256 new_redemption_delay, uint256 new_mint_fee, uint256 new_redeem_fee, uint256 new_buyback_fee, uint256 new_recollat_fee) external;
    function addProposal() external;
    function removeProposal() external;
    function approveProposal() external;
}