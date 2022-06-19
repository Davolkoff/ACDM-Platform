//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDAO {

    function endWithdrawing(address user_) external;

    function activeVotingsExists(address user_) external view returns (bool);

}