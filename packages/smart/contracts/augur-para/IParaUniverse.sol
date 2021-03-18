pragma solidity 0.5.15;

import "../augur-core/reporting/IV2ReputationToken.sol";
import "../augur-core/reporting/IMarket.sol";
import "../augur-core/reporting/IUniverse.sol";
import "./IFeePot.sol";


interface IParaUniverse {
    function augur() external view returns (address);
    function cash() external view returns (address);
    function openInterestCash() external view returns (address);
    function getFeePot() external view returns (IFeePot);
    function getReputationToken() external view returns (IV2ReputationToken);
    function originUniverse() external view returns (IUniverse);
    function setMarketFinalized(IMarket _market, uint256 _totalSupply) external returns (bool);
    function withdraw(address _recipient, uint256 _amount, address _market) external returns (bool);
    function deposit(address _sender, uint256 _amount, address _market) external returns (bool);
    function decrementOpenInterest(uint256 _amount) external returns (bool);
    function incrementOpenInterest(uint256 _amount) external returns (bool);
    function recordMarketCreatorFees(IMarket _market, uint256 _marketCreatorFees, address _sourceAccount) external returns (bool);
    function getMarketOpenInterest(IMarket _market) external view returns (uint256);
    function getOrCacheReportingFeeDivisor() external returns (uint256);
    function getReportingFeeDivisor() external view returns (uint256);
    function setOrigin(IUniverse _originUniverse) external;
}