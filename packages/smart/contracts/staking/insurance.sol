// // SPDX-License-Identifier: GPL-3.0-or-later
// pragma solidity ^0.8.4;
// import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
// import "./iDSlocker.sol";

// //Returned to insurannce stakers, who stake erc20 stablecoins to get this in return 
// contract iDS  {
//     uint256 public constant  MAX_LOCK_DURATION = 4 * 365 days; // 4 years
//     uint256 public constant  MAX_LOCK_MULTIPLIER_BPS = 40000;  // 4X
//     uint256 public constant  UNLOCKED_MULTIPLIER_BPS = 10000; // 1X
//     // 1 bps = 1/10000
//     uint256 internal constant MAX_BPS = 10000;

//     address idsLocker;

//     constructor(address idsLocker_ ) {
//         idsLocker = idsLocker_;
//     }



//     function balanceOf(address account) external view  returns (uint256 balance) {
//         IERC721Enumerable locker = IERC721Enumerable(idsLocker);
//         uint256 numOfLocks = locker.balanceOf(account);
//         balance = 0;
//         for (uint256 i = 0; i < numOfLocks; i++) {
//             uint256 idsLocker = locker.tokenOfOwnerByIndex(account, i);
//             balance += balanceOfLock(idsLocker);
//         }
//         return balance;
//     }

  
//     function balanceOfLock(uint256 iDSLockID) public view  returns (uint256 balance) {
//         iDSLocker locker = iDSLocker(idsLocker);
//         Lock memory lock = locker.locks(iDSLockID);
//         uint256 base = lock.amount * UNLOCKED_MULTIPLIER_BPS / MAX_BPS;
//         // solhint-disable-next-line not-rely-on-time
//         uint256 bonus = (lock.end <= block.timestamp)
//             ? 0 // unlocked
//             // solhint-disable-next-line not-rely-on-time
//             : lock.amount * (lock.end - block.timestamp) * (MAX_LOCK_MULTIPLIER_BPS - UNLOCKED_MULTIPLIER_BPS) / (MAX_LOCK_DURATION * MAX_BPS); // locked
//         return base + bonus;
//     }


//     function totalSupply() external view  returns (uint256 supply) {
//         IERC721Enumerable locker = IERC721Enumerable(idsLocker);
//         uint256 numOfLocks = locker.totalSupply();
//         supply = 0;
//         for (uint256 i = 0; i < numOfLocks; i++) {
//             uint256 xsLockID = locker.tokenByIndex(i);
//             supply += balanceOfLock(xsLockID);
//         }
//         return supply;
//     }

//     function name() external pure  returns (string memory) {
//         return "iDS";
//     }

//     function symbol() external pure  returns (string memory) {
//         return "iDS";
//     }


//     function decimals() external pure  returns (uint8) {
//         return 18;
//     }

//     function allowance(address owner, address spender) external pure  returns (uint256) {
//         return 0;
//     }

  
//     function transfer(address recipient, uint256 amount) external  returns (bool success) {
//         revert("transfer not allowed");
//     }


//     function transferFrom(address sender, address recipient, uint256 amount) external  returns (bool success) {
//         revert("transfer not allowed");
//     }

//     function approve(address spender, uint256 amount) external  returns (bool success) {
//         revert("transfer not allowed");
//     }
// }
