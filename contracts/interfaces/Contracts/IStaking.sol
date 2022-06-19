//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IStaking {
   
   function balanceOf (address user_) external view returns (uint);

}