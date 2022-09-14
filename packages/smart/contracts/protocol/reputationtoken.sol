pragma solidity ^0.8.4; 
//https://github.com/poap-xyz/poap-contracts/tree/master/contracts
import {ERC721} from "solmate/src/tokens/ERC721.sol";
import {Controller} from "./controller.sol";
import {IReputationNFT} from "./IReputationNFT.sol";
import {BondingCurve} from "../bonds/bondingcurve.sol";
import "hardhat/console.sol";



contract ReputationNFT is IReputationNFT, ERC721 {
  mapping(uint256 => ReputationData) internal _reputation; // id to reputation
  mapping(address => uint256) internal _ownerToId;
  mapping(uint256 => TraderData[]) internal _marketData; // **MarketId to Market's data needed for calculating brier score.

  uint256 private nonce = 1;
  Controller controller;
  uint256 SCALE = 1e18;


  struct ReputationData {
    uint256 n; // number of markets participated in => regular uint256
    uint256 score; // averaged reputation score => 60.18
  }

  struct TraderData { // for each market
    address trader;
    uint256 tokensBought;
  }

    struct TopReputation{
    address trader; 
    uint256 score; 
  }

  uint256 private constant topRep = 100; 
  TopReputation[topRep] topReputations; 

  mapping(uint256=>mapping(address=>bool)) canTrade; //marketID-> address-> cantrade
  mapping(uint256=>bool) allowAll; 
  mapping(address=>bool) isUnique; 
  address[] unique_traders; 
  mapping(uint256=>mapping(address=>uint256)) public balances; // marketId => market manager address => how much collateral already bought.

  modifier onlyController() {
    require(msg.sender == address(controller));
    _;
  }

  constructor (
    address _controller
  ) ERC721("Debita Reputation Token", "DRT") {
    controller = Controller(_controller);
  }

  /**
   @notice incrementBalance
   */
  function incrementBalance(uint256 marketId, address trader, uint256 amount) external onlyController {
    balances[marketId][trader] += amount;
  }

  /**
   @notice called post reputation update
   */
  function removeBalance(uint256 marketId, address trader) external onlyController {
    delete balances[marketId][trader];
  }

  function _baseURI() internal pure returns (string memory baseURI) {
    baseURI = "";
  }

  function tokenURI(uint256 id) public view override returns (string memory) {
    require(_ownerOf[id] != address(0), "Invalid Identifier");

    string memory baseURI = _baseURI();
    return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, id)) : "";
  }

  function mint(address to) external {
    require(_ownerToId[to] == uint256(0), "can only mint one reputation token");
    super._mint(to, nonce);
    _ownerToId[to] = nonce;

    nonce++;
  }

  function getReputationScore(address owner) view external returns (uint256){
    require(_ownerToId[owner] != uint256(0), "No Id found");
    return _reputation[_ownerToId[owner]].score;
  }

  /**
   @notice add scores and stores topX 
   @param score: 60.18 format
   */
  function addScore(address to, uint256 score) external onlyController
   {
    require(_ownerToId[to] != uint256(0), "No Id found");

    ReputationData storage data = _reputation[_ownerToId[to]];
    data.score = data.score + score; 

    storeTopX(data.score, to); 
  }

  /**
   @notice calculates average of scores added.
   @param score: 60.18 format
   */
  function addAverageScore(address to, uint256 score) external onlyController

   {
    require(_ownerToId[to] != uint256(0), "No Id found");

    ReputationData storage data = _reputation[_ownerToId[to]];
    
    if (data.n == 0) {
      data.score = score;
    } else {
      data.score = (data.score / data.n + score) / (data.n + 1);
    }

    data.n++;
  }

  /**
   @notice reset scores
   */
  function resetScore(address to) external {
    require(_ownerToId[to] != uint256(0), "No Id found");
    delete _reputation[_ownerToId[to]];
  }

  /// @notice called by controller when initiating market,
  function storeTopReputation(uint256 topX, uint256 marketId) external onlyController{
    if (getAvailableTopX() < topX) {
      allowAll[marketId] =true; 
      return; 
    }

    for (uint256 i; i<topX; i++){
      canTrade[marketId][topReputations[i].trader] = true;
    }

  }

  /// @notice gets the x's ranked score from all reputation scores 
  /// @dev returns 0 if topX is greater then avaiable nonzero rep scores-> everyone is allowed
  /// during reputation constraint periods 
  function getMinRepScore(uint256 topX, uint256 marketId) public view returns(uint256){
    if (getAvailableTopX() < topX) {
      return 0; 
    }
    return topReputations[topX].score; 

  }

  function getAvailableTopX() public view returns(uint256){
    return unique_traders.length; 
  }

  function getAvailableTraderNum() public view returns(uint256){
    return nonce -1; 
  }

  /// @notice whether trader is above reputation threshold 
  function traderCanTrade(uint256 marketId, address trader) external returns(bool){
    return allowAll[marketId]? true : canTrade[marketId][trader]; 
  }

  /// @notice called whenever a score is incremented   
  function storeTopX(uint256 score, address trader) internal {
    uint256 i = 0;

    for(i; i < topReputations.length; i++) {
        if(topReputations[i].score < score) {
            break;
        }
    }
    // shifting the array of position (getting rid of the last element) 
    for(uint j = topReputations.length - 1; j > i; j--) {
        topReputations[j].score = topReputations[j - 1].score;
        topReputations[j].trader = topReputations[j - 1].trader;
    }
    // update the new max element 
    topReputations[i].score = score;
    topReputations[i].trader = trader;

    if (isUnique[trader]) return; 
    isUnique[trader] = true; 
    unique_traders.push(trader);

  }


 

  function testStore() public view {
    for (uint i=0; i<10; i++){
      console.log('score', topReputations[i].score); 
    }
  }

  
}