// // SPDX-License-Identifier: GPL-3.0-or-later
// pragma solidity ^0.8.4;
// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// //import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
// import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
// // import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
// //import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// // import "./../utils/Governable.sol";
// // import "./../interfaces/staking/IxsListener.sol";
// // import "./../interfaces/staking/IxsLocker.sol";


// struct Lock {
//     uint256 amount;
//     uint256 end;}

// contract iDSLocker is ERC721Enhanced, ReentrancyGuard{
//     using EnumerableSet for EnumerableSet.AddressSet;



//     address collateral_address;
//     uint256 public constant  MAX_LOCK_DURATION = 4 * (365 days);
//     uint256 public  totalNumLocks;

//     mapping(uint256 => Lock) private _locks;
//     EnumerableSet.AddressSet private _iDSLockListeners;

//     constructor(address collateral_address_)
//         ERC721Enhanced("iDS lock", "iDSLOCK")
//     {
//         collateral_address = collateral_address_;
//     }

//     function locks(uint256 iDSLockID) external view  tokenMustExist(iDSLockID) returns (Lock memory lock_) {
//         return _locks[iDSLockID];
//     }


//     function isLocked(uint256 iDSLockID) external view  tokenMustExist(iDSLockID) returns (bool locked) {
//         // solhint-disable-next-line not-rely-on-time
//         return _locks[iDSLockID].end > block.timestamp;
//     }

//     function timeLeft(uint256 iDSLockID) external view  tokenMustExist(iDSLockID) returns (uint256 time) {
//         // solhint-disable-next-line not-rely-on-time
//         return (_locks[iDSLockID].end > block.timestamp)
//             // solhint-disable-next-line not-rely-on-time
//             ? _locks[iDSLockID].end - block.timestamp // locked
//             : 0; // unlocked
//     }


//     function stakedBalance(address account) external view  returns (uint256 balance) {
//         uint256 numOfLocks = balanceOf(account);
//         balance = 0;
//         for (uint256 i = 0; i < numOfLocks; i++) {
//             uint256 iDSLockID = tokenOfOwnerByIndex(account, i);
//             balance += _locks[iDSLockID].amount;
//         }
//         return balance;

//     }

//     function createLock(address recipient, uint256 amount, uint256 end) external  nonReentrant returns (uint256 iDSLockID) {
//         // pull solace
//         SafeERC20.safeTransferFrom(IERC20(collateral_address), msg.sender, address(this), amount);
//         // accounting
//         return _createLock(recipient, amount, end);
//     }



//     function _createLock(address recipient, uint256 amount, uint256 end) internal returns (uint256 iDSLockID) {
//         iDSLockID = ++totalNumLocks;
//         Lock memory newLock = Lock(amount, end);
//         // solhint-disable-next-line not-rely-on-time
//         require(newLock.end <= block.timestamp + MAX_LOCK_DURATION, "Max lock is 4 years");
//         // accounting
//         _locks[iDSLockID] = newLock;
//         _safeMint(recipient, iDSLockID);
//     }

//     function increaseAmount(uint256 iDSLockID, uint256 amount) external  nonReentrant tokenMustExist(iDSLockID) {
//         // pull solace
//         SafeERC20.safeTransferFrom(IERC20(collateral_address), msg.sender, address(this), amount);
//         // accounting
//         uint256 newAmount = _locks[iDSLockID].amount + amount;
//         _updateLock(iDSLockID, newAmount, _locks[iDSLockID].end);
//     }
    
//     function _updateLock(uint256 iDSLockID, uint256 amount, uint256 end) internal {
//         // checks
//         Lock memory prevLock = _locks[iDSLockID];
//         Lock memory newLock = Lock(amount, end); // end was sanitized before passed in
//         // accounting
//         _locks[iDSLockID] = newLock;
//        // address owner = ownerOf(iDSLockID);
//        // _notify(iDSLockID, owner, owner, prevLock, newLock);
//      //   emit LockUpdated(iDSLockID, amount, newLock.end);
//     }

//     function withdrawInPart(uint256 iDSLockID, address recipient, uint256 amount) external  nonReentrant onlyOwnerOrApproved(iDSLockID) {
//         require(amount <= _locks[iDSLockID].amount, "excess withdraw");
//         _withdraw(iDSLockID, amount);
//         // transfer solace
//         SafeERC20.safeTransfer(IERC20(collateral_address), recipient, amount);
//     }

//    function _withdraw(uint256 iDSLockID, uint256 amount) internal {
//         // solhint-disable-next-line not-rely-on-time
//         require(_locks[iDSLockID].end <= block.timestamp, "locked"); // cannot withdraw while locked
//         // accounting
//         if(amount == _locks[iDSLockID].amount) {
//             _burn(iDSLockID);
//             delete _locks[iDSLockID];
//         }
//         else {
//             Lock memory oldLock = _locks[iDSLockID];
//             Lock memory newLock = Lock(oldLock.amount-amount, oldLock.end);
//             _locks[iDSLockID].amount -= amount;
//             // address owner = ownerOf(iDSLockID);
//             // _notify(iDSLockID, owner, owner, oldLock, newLock);
//         }
//        // emit Withdrawl(iDSLockID, amount);
//     }
// }


