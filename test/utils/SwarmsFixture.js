const IdentityRegistryProxyModule = require("../../ignition/modules/IdentityRegistryProxyModule");

async function SwarmsFixture() {
    const [admin, provider] = await ethers.getSigners();

    const initCalldata = ethers.id('initialize(address)').substring(0, 10) + ethers.zeroPadValue(admin.address, 32).slice(2);

    const { identityRegistryImplementation, identityRegistryProxy } = await ignition.deploy(IdentityRegistryProxyModule, {
        parameters: {
            IdentityRegistryProxyModule: {
                initializeCalldata: initCalldata
            },
        },
    });

    const identityRegistry = await ethers.getContractAt("IdentityRegistry", identityRegistryProxy);

    const adminRole = await identityRegistry.DEFAULT_ADMIN_ROLE();
    const providerRole = await identityRegistry.PROVIDER_ROLE();

    await identityRegistry.connect(admin).grantRole(providerRole, provider.address);

    return { admin, provider, identityRegistryImplementation, identityRegistry, adminRole, providerRole };
};

module.exports = { SwarmsFixture };