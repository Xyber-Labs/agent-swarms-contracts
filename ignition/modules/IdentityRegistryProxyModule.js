const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("IdentityRegistryProxyModule", (m) => {

    const initializeCalldata = m.getParameter("initializeCalldata");

    const identityRegistryImplementation = m.contract("IdentityRegistry", []);

    const identityRegistryProxy = m.contract('ERC1967Proxy', [identityRegistryImplementation, initializeCalldata]);

    return { identityRegistryImplementation, identityRegistryProxy };
});