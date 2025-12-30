// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

import "solady/src/utils/LibString.sol";

import "./ISwarmsUpgradeChecker.sol";

abstract contract SwarmsUpgradeChecker is ISwarmsUpgradeChecker {
    using LibString for *;

    error SwarmsUpgradeChecker__E0(); // invalid {newImplementation} contract

    function swarmsContractName() public pure virtual returns(string memory contractName);

    function _checkContractType(address newImplementation) internal view virtual {
        if (!ISwarmsUpgradeChecker(newImplementation).swarmsContractName().eq(swarmsContractName())) {
            revert SwarmsUpgradeChecker__E0();
        }

        if (!IERC165(newImplementation).supportsInterface(type(IAccessControl).interfaceId)) {
            revert SwarmsUpgradeChecker__E0();
        }
    }
}