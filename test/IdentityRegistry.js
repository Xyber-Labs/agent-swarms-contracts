const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { zeroAddress, register, update } = require("./utils/SwarmsUtils");
const { zeroUUID, oneUUID } = require("./utils/GlobalConstants");
const { SwarmsFixture } = require("./utils/SwarmsFixture");
const { expect } = require("chai");

describe("IdentityRegistry", function () {
    describe("Deploy", function () {
        it("Init settings", async function () {
            const { admin, provider, identityRegistry, adminRole, providerRole } = await loadFixture(SwarmsFixture);

            expect(await identityRegistry.hasRole(adminRole, admin.address)).to.equal(true);
            expect(await identityRegistry.hasRole(providerRole, provider.address)).to.equal(true);
            expect(await identityRegistry.getAgentProfile(zeroUUID)).to.eql([
                0n,
                "",
                "",
                "",
                0n,
                0n,
                0n,
                zeroAddress,
                0n,
                []
            ]);
            expect(await identityRegistry.getTagData(0)).to.equal("");
            expect(await identityRegistry.swarmsContractName()).to.equal("IdentityRegistry");
            expect(await identityRegistry.supportsInterface("0x78f21289")).to.equal(true);
            expect(await identityRegistry.supportsInterface("0x01ffc9a7")).to.equal(true);
        });

        it("Proxy", async function () {
            const { admin, provider, identityRegistryImplementation, identityRegistry } = await loadFixture(SwarmsFixture);

            await expect(identityRegistry.connect(provider).upgradeToAndCall(
                provider.address,
                "0x"
            )).to.be.revertedWithCustomError(identityRegistry, "AccessControlUnauthorizedAccount");

            await expect(identityRegistry.connect(provider).initialize(
                provider.address
            )).to.be.revertedWithCustomError(identityRegistry, "InvalidInitialization");

            await identityRegistry.connect(admin).upgradeToAndCall(identityRegistryImplementation.target, "0x");
        });
    });

    describe("register()", function () {
        it("AccessControl", async function () {
            const { admin, identityRegistry, providerRole } = await loadFixture(SwarmsFixture);

            const result = await register(
                identityRegistry,
                admin,
                providerRole,
                zeroUUID,
                "",
                "",
                "",
                0n,
                zeroAddress
            );

            expect(result).to.equal("AccessControlUnauthorizedAccount");
        });

        it("IdentityRegistry E0", async function () {
            const { provider, identityRegistry, providerRole } = await loadFixture(SwarmsFixture);

            const result = await register(
                identityRegistry,
                provider,
                providerRole,
                zeroUUID,
                "",
                "",
                "",
                0n,
                zeroAddress
            );

            expect(result).to.equal("IdentityRegistry__E0");
        });

        it("IdentityRegistry E1", async function () {
            const { provider, identityRegistry, providerRole } = await loadFixture(SwarmsFixture);

            const resultZero = await register(
                identityRegistry,
                provider,
                providerRole,
                oneUUID,
                "",
                "",
                "",
                0n,
                zeroAddress
            );

            expect(resultZero).to.equal("Success");

            const resultOne = await register(
                identityRegistry,
                provider,
                providerRole,
                oneUUID,
                "",
                "",
                "",
                0n,
                zeroAddress
            );

            expect(resultOne).to.equal("IdentityRegistry__E1");
        });

        it("Success", async function () {
            const { provider, identityRegistry, providerRole } = await loadFixture(SwarmsFixture);

            const resultZero = await register(
                identityRegistry,
                provider,
                providerRole,
                oneUUID,
                "someName",
                "someBaseURL",
                "someDescription",
                1n,
                provider.address
            );

            expect(resultZero).to.equal("Success");
        });
    });

    describe("update()", function () {
        it("AccessControl", async function () {
            const { admin, identityRegistry, providerRole } = await loadFixture(SwarmsFixture);

            const result = await update(
                identityRegistry,
                admin,
                providerRole,
                zeroUUID,
                "",
                "",
                "",
                0n,
                zeroAddress
            );

            expect(result).to.equal("AccessControlUnauthorizedAccount");
        });

        it("IdentityRegistry E2", async function () {
            const { provider, identityRegistry, providerRole } = await loadFixture(SwarmsFixture);

            const result = await update(
                identityRegistry,
                provider,
                providerRole,
                zeroUUID,
                "",
                "",
                "",
                0n,
                zeroAddress
            );

            expect(result).to.equal("IdentityRegistry__E2");
        });

        it("Success", async function () {
            const { provider, identityRegistry, providerRole } = await loadFixture(SwarmsFixture);

            const resultZero = await register(
                identityRegistry,
                provider,
                providerRole,
                oneUUID,
                "",
                "",
                "",
                0n,
                zeroAddress
            );

            expect(resultZero).to.equal("Success");

            const resultOne = await update(
                identityRegistry,
                provider,
                providerRole,
                oneUUID,
                "someName",
                "someBaseURL",
                "someDescription",
                1n,
                provider.address
            );

            expect(resultOne).to.equal("Success");
        });
    });

    describe("setTag()", function () {
        it("AccessControl", async function () {
            const { admin, identityRegistry } = await loadFixture(SwarmsFixture);

            await expect(identityRegistry.connect(admin).setTag(
                [],
                []
            )).to.be.revertedWithCustomError(identityRegistry, "AccessControlUnauthorizedAccount");
        });

        it("IdentityRegistry E3", async function () {
            const { provider, identityRegistry } = await loadFixture(SwarmsFixture);

            await expect(identityRegistry.connect(provider).setTag(
                [1n],
                []
            )).to.be.revertedWithCustomError(identityRegistry, "IdentityRegistry__E3");

            await expect(identityRegistry.connect(provider).setTag(
                [],
                ["1"]
            )).to.be.revertedWithCustomError(identityRegistry, "IdentityRegistry__E3");

            await expect(identityRegistry.connect(provider).setTag(
                [1n, 2n],
                ["1"]
            )).to.be.revertedWithCustomError(identityRegistry, "IdentityRegistry__E3");
        });

        it("Success", async function () {
            const { provider, identityRegistry, providerRole } = await loadFixture(SwarmsFixture);

            expect(await identityRegistry.getTagData(0n)).to.equal("");

            await expect(identityRegistry.connect(provider).setTag(
                [0n],
                ["TagZero"]
            )).to.emit(identityRegistry, "AgentTagSet").withArgs(
                0n,
                "TagZero"
            );

            expect(await identityRegistry.getTagData(0n)).to.equal("TagZero");
            expect(await identityRegistry.getTagData(2n)).to.equal("");

            const resultZero = await register(
                identityRegistry,
                provider,
                providerRole,
                oneUUID,
                "",
                "",
                "",
                0n,
                zeroAddress
            );

            expect(resultZero).to.equal("Success");

            await expect(identityRegistry.connect(provider).setTag(
                [0n, 2n],
                ["TagZeroNew", "TagTwo"]
            )).to.emit(identityRegistry, "AgentTagSet").withArgs(
                0n,
                "TagZeroNew"
            ).to.emit(identityRegistry, "AgentTagSet").withArgs(
                2n,
                "TagTwo"
            );

            expect(await identityRegistry.getTagData(0n)).to.equal("TagZeroNew");
            expect(await identityRegistry.getTagData(1n)).to.equal("");
            expect(await identityRegistry.getTagData(2n)).to.equal("TagTwo");

            const resultOne = await update(
                identityRegistry,
                provider,
                providerRole,
                oneUUID,
                "someName",
                "someBaseURL",
                "someDescription",
                1n,
                provider.address
            );

            expect(resultOne).to.equal("Success");
        });
    });

    describe("updateTags()", function () {
        it("AccessControl", async function () {
            const { admin, identityRegistry } = await loadFixture(SwarmsFixture);

            await expect(identityRegistry.connect(admin).updateTags(
                zeroUUID,
                []
            )).to.be.revertedWithCustomError(identityRegistry, "AccessControlUnauthorizedAccount");
        });

        it("IdentityRegistry E2", async function () {
            const { provider, identityRegistry } = await loadFixture(SwarmsFixture);

            await expect(identityRegistry.connect(provider).updateTags(
                zeroUUID,
                []
            )).to.be.revertedWithCustomError(identityRegistry, "IdentityRegistry__E2");
        });

        it("IdentityRegistry E4", async function () {
            const { provider, providerRole, identityRegistry } = await loadFixture(SwarmsFixture);

            const resultZero = await register(
                identityRegistry,
                provider,
                providerRole,
                oneUUID,
                "",
                "",
                "",
                0n,
                zeroAddress
            );

            expect(resultZero).to.equal("Success");

            await expect(identityRegistry.connect(provider).updateTags(
                oneUUID,
                [0n]
            )).to.be.revertedWithCustomError(identityRegistry, "IdentityRegistry__E4");
        });

        it("Success", async function () {
            const { provider, identityRegistry, providerRole } = await loadFixture(SwarmsFixture);

            await expect(identityRegistry.connect(provider).setTag(
                [0n, 1n, 2n],
                ["TagZero", "TagOne", "TagTwo"]
            )).to.emit(identityRegistry, "AgentTagSet").withArgs(
                0n,
                "TagZero"
            ).to.emit(identityRegistry, "AgentTagSet").withArgs(
                1n,
                "TagOne"
            ).to.emit(identityRegistry, "AgentTagSet").withArgs(
                2n,
                "TagTwo"
            );

            const resultZero = await register(
                identityRegistry,
                provider,
                providerRole,
                oneUUID,
                "",
                "",
                "",
                0n,
                zeroAddress
            );

            expect(resultZero).to.equal("Success");

            expect((await identityRegistry.getAgentProfile(oneUUID))[9]).to.eql([]);

            await expect(identityRegistry.connect(provider).updateTags(
                oneUUID,
                [0n]
            )).to.emit(identityRegistry, "AgentTagUpdated").withArgs(
                oneUUID,
                0n,
                "TagZero",
                true
            );

            expect((await identityRegistry.getAgentProfile(oneUUID))[9]).to.eql(["TagZero"]);

            await expect(identityRegistry.connect(provider).updateTags(
                oneUUID,
                [0n, 1n, 2n]
            )).to.emit(identityRegistry, "AgentTagUpdated").withArgs(
                oneUUID,
                0n,
                "TagZero",
                false
            ).to.emit(identityRegistry, "AgentTagUpdated").withArgs(
                oneUUID,
                1n,
                "TagOne",
                true
            ).to.emit(identityRegistry, "AgentTagUpdated").withArgs(
                oneUUID,
                2n,
                "TagTwo",
                true
            );

            expect((await identityRegistry.getAgentProfile(oneUUID))[9]).to.eql(["TagOne", "TagTwo"]);

            await expect(identityRegistry.connect(provider).setTag(
                [2n],
                ["TagTwoNew"]
            )).to.emit(identityRegistry, "AgentTagSet").withArgs(
                2n,
                "TagTwoNew"
            );

            expect((await identityRegistry.getAgentProfile(oneUUID))[9]).to.eql(["TagOne", "TagTwoNew"]);

            await expect(identityRegistry.connect(provider).updateTags(
                oneUUID,
                [2n]
            )).to.emit(identityRegistry, "AgentTagUpdated").withArgs(
                oneUUID,
                2n,
                "TagTwoNew",
                false
            );

            expect((await identityRegistry.getAgentProfile(oneUUID))[9]).to.eql(["TagOne"]);

            await expect(identityRegistry.connect(provider).updateTags(
                oneUUID,
                [2n]
            )).to.emit(identityRegistry, "AgentTagUpdated").withArgs(
                oneUUID,
                2n,
                "TagTwoNew",
                true
            );

            expect((await identityRegistry.getAgentProfile(oneUUID))[9]).to.eql(["TagOne", "TagTwoNew"]);
        });
    });
});