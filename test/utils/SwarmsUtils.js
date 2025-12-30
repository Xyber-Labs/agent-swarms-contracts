const { time } = require('@nomicfoundation/hardhat-network-helpers');
const { zeroUUID } = require("./GlobalConstants");
const { expect } = require("chai");

const zeroHash = ethers.ZeroHash;
const zeroAddress = ethers.ZeroAddress
const AbiCoder = new ethers.AbiCoder();
const withDecimals = ethers.parseEther;

async function register(
    identityRegistry,
    provider,
    providerRole,
    uuid,
    name,
    baseURL,
    description,
    version,
    onchainAddress
) {
    if (!(await identityRegistry.hasRole(providerRole, provider.address))) {
        await expect(identityRegistry.connect(provider).register(
            uuid,
            name,
            baseURL,
            description,
            version,
            onchainAddress
        )).to.be.revertedWithCustomError(identityRegistry, "AccessControlUnauthorizedAccount");

        return "AccessControlUnauthorizedAccount";
    }

    if (uuid == zeroUUID) {
        await expect(identityRegistry.connect(provider).register(
            uuid,
            name,
            baseURL,
            description,
            version,
            onchainAddress
        )).to.be.revertedWithCustomError(identityRegistry, "IdentityRegistry__E0");

        return "IdentityRegistry__E0";
    }

    const agentProfileBefore = await identityRegistry.getAgentProfile(uuid);

    if (agentProfileBefore[5] > 0n) {
        await expect(identityRegistry.connect(provider).register(
            uuid,
            name,
            baseURL,
            description,
            version,
            onchainAddress
        )).to.be.revertedWithCustomError(identityRegistry, "IdentityRegistry__E1");

        return "IdentityRegistry__E1";
    }

    expect(agentProfileBefore).to.eql([0n, "", "", "", 0n, 0n, 0n, zeroAddress, 0n, []]);

    await expect(identityRegistry.connect(provider).register(
        uuid,
        name,
        baseURL,
        description,
        version,
        onchainAddress
    )).to.emit(identityRegistry, "AgentRegistered").withArgs(
        uuid,
        name,
        baseURL,
        description,
        version,
        onchainAddress
    );

    const agentProfileAfter = await identityRegistry.getAgentProfile(uuid);

    expect(agentProfileAfter[0]).to.equal(2n);
    expect(agentProfileAfter[1]).to.equal(name);
    expect(agentProfileAfter[2]).to.equal(baseURL);
    expect(agentProfileAfter[3]).to.equal(description);
    expect(agentProfileAfter[4]).to.equal(version);
    expect(agentProfileAfter[5]).to.closeTo(await time.latest(), 100);
    expect(agentProfileAfter[5]).to.equal(agentProfileAfter[6]);
    expect(agentProfileAfter[7]).to.equal(onchainAddress);
    expect(agentProfileAfter[8]).to.equal(await ethers.provider.getBalance(onchainAddress));
    expect(agentProfileAfter[9]).to.eql([]);

    await expect(identityRegistry.connect(provider).register(
        uuid,
        name,
        baseURL,
        description,
        version,
        onchainAddress
    )).to.be.revertedWithCustomError(identityRegistry, "IdentityRegistry__E1");

    return "Success";
};

async function update(
    identityRegistry,
    provider,
    providerRole,
    uuid,
    name,
    baseURL,
    description,
    version,
    onchainAddress
) {
    if (!(await identityRegistry.hasRole(providerRole, provider.address))) {
        await expect(identityRegistry.connect(provider).update(
            uuid,
            name,
            baseURL,
            description,
            version,
            onchainAddress
        )).to.be.revertedWithCustomError(identityRegistry, "AccessControlUnauthorizedAccount");

        return "AccessControlUnauthorizedAccount";
    }

    const agentProfileBefore = await identityRegistry.getAgentProfile(uuid);

    if (agentProfileBefore[5] == 0n) {
        await expect(identityRegistry.connect(provider).update(
            uuid,
            name,
            baseURL,
            description,
            version,
            onchainAddress
        )).to.be.revertedWithCustomError(identityRegistry, "IdentityRegistry__E2");

        return "IdentityRegistry__E2";
    }

    expect(agentProfileBefore[0]).to.equal(2n);
    expect(await time.latest()).to.above(agentProfileBefore[5]);
    expect(agentProfileBefore[8]).to.equal(await ethers.provider.getBalance(agentProfileBefore[7]));

    await expect(identityRegistry.connect(provider).update(
        uuid,
        name,
        baseURL,
        description,
        version,
        onchainAddress
    )).to.emit(identityRegistry, "AgentUpdated").withArgs(
        uuid,
        name,
        baseURL,
        description,
        version,
        onchainAddress
    );

    const agentProfileAfter = await identityRegistry.getAgentProfile(uuid);

    expect(agentProfileAfter[0]).to.equal(2n);
    expect(agentProfileAfter[1]).to.equal(name);
    expect(agentProfileAfter[2]).to.equal(baseURL);
    expect(agentProfileAfter[3]).to.equal(description);
    expect(agentProfileAfter[4]).to.equal(version);
    expect(agentProfileAfter[6]).to.closeTo(await time.latest(), 100);
    expect(agentProfileAfter[6]).to.above(agentProfileAfter[5]);
    expect(agentProfileAfter[7]).to.equal(onchainAddress);
    expect(agentProfileAfter[8]).to.equal(await ethers.provider.getBalance(onchainAddress));
    expect(agentProfileAfter[9]).to.eql(agentProfileBefore[9]);

    return "Success";
};

module.exports = { zeroHash, zeroAddress, AbiCoder, withDecimals, register, update };