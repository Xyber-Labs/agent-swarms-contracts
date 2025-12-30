// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISwarmsUpgradeChecker {

    function swarmsContractName() external pure returns(string memory contractName);

}