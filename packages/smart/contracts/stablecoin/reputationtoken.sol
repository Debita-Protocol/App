pragma solidity ^0.8.4; 
//https://github.com/poap-xyz/poap-contracts/tree/master/contracts
import {ERC721} from "solmate/src/tokens/ERC721.sol";
import {Controller} from "./controller.sol";
import {IReputationNFT} from "./IReputationNFT.sol";


contract ReputationNFT is IReputationNFT, ERC721 {
  mapping(uint256 => ReputationData) internal _reputation;
  mapping(address => uint256) internal _ownerToId;
  uint256 private nonce = 1;
  Controller controller;
  struct ReputationData {
    uint256 n; // number of markets participated in.
    uint256 score; // averaged reputation score
  }

  modifier onlyController() {
    require(msg.sender == address(controller));
    _;
  }

  constructor (
    Controller _controller
  ) ERC721("Debita Reputation Token", "DRT") {
    controller = _controller;
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
    super._mint(to, nonce);
    _ownerToId[to] = nonce;
    nonce++;
  }

  function getReputationScore(address owner) view external returns (ReputationData memory){
    require(_ownerToId[owner] != uint256(0), "No Id found");
    return _reputation[_ownerToId[owner]];
  }

  function addScore(address to, uint256 score) external {
    require(_ownerToId[to] != uint256(0), "No Id found");

    ReputationData storage data = _reputation[_ownerToId[to]];
    
    if (data.n == 0) {
      data.score = score;
    } else {
      data.score = ((data.score / data.n) + score) / (data.n + 1);
    }
    data.n++;
  }
}