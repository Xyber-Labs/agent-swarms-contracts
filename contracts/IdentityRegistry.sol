// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./libraries/SwarmsUpgradeChecker.sol";

import "./interfaces/IIdentityRegistry.sol";

contract IdentityRegistry is IIdentityRegistry, SwarmsUpgradeChecker, AccessControlUpgradeable, UUPSUpgradeable {
    using EnumerableSet for EnumerableSet.UintSet;

    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");

    /// @custom:storage-location erc7201:Swarms.storage.IdentityRegistry
    struct IdentityRegistryStorage {
        mapping(bytes16 uuid => AgentData) _agents;
        mapping(uint256 tagId => string) _tags;
    }

    /// @dev keccak256(abi.encode(uint256(keccak256("Swarms.storage.IdentityRegistry")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant IDENTITY_REGISTRY_STORAGE_LOCATION = 0xf8b0223e8b633a5c0edf92ee2b6ad23589103b8532a206b6aba0527f6b776a00;

    struct AgentData {
        string name;
        string baseURL;
        string description;
        uint16 version;
        uint128 registeredAt;
        uint128 lastUpdatedAt;
        address onchainAddress;
        EnumerableSet.UintSet tags;
    }

    error IdentityRegistry__E0(); // invalid {uuid}
    error IdentityRegistry__E1(); // agent already registered
    error IdentityRegistry__E2(); // nonexistent agent
    error IdentityRegistry__E3(); // arguments length mismatch
    error IdentityRegistry__E4(); // invalid {tagData}

    event AgentRegistered(
        bytes16 indexed uuid,
        string name,
        string baseURL,
        string description,
        uint16 version,
        address onchainAddress
    );

    event AgentUpdated(
        bytes16 indexed uuid,
        string newName,
        string newBaseURL,
        string newDescription,
        uint16 newVersion,
        address newOnchainAddress
    );

    event AgentTagUpdated(
        bytes16 indexed uuid,
        uint256 indexed tagId,
        string tag,
        bool indexed added
    );

    event AgentTagSet(uint256 indexed tagId, string tag);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address defaultAdmin) external initializer() {
        __UUPSUpgradeable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    }

    function register(
        bytes16 uuid,
        string calldata name,
        string calldata baseURL,
        string calldata description,
        uint16 version,
        address onchainAddress
    ) external onlyRole(PROVIDER_ROLE) {
        require(uuid != bytes16(0), IdentityRegistry__E0());

        IdentityRegistryStorage storage $ = _getIdentityRegistryStorage();
        AgentData storage agent = $._agents[uuid];

        require(agent.registeredAt == 0, IdentityRegistry__E1());

        agent.name = name;
        agent.baseURL = baseURL;
        agent.description = description;
        agent.version = version;
        agent.registeredAt = uint128(block.timestamp);
        agent.lastUpdatedAt = uint128(block.timestamp);
        agent.onchainAddress = onchainAddress;      

        emit AgentRegistered(uuid, name, baseURL, description, version, onchainAddress);
    }

    function update(
        bytes16 uuid,
        string calldata newName,
        string calldata newBaseURL,
        string calldata newDescription,
        uint16 newVersion,
        address newOnchainAddress
    ) external onlyRole(PROVIDER_ROLE) {
        IdentityRegistryStorage storage $ = _getIdentityRegistryStorage();
        AgentData storage agent = $._agents[uuid];

        require(agent.registeredAt > 0, IdentityRegistry__E2());

        agent.name = newName;
        agent.baseURL = newBaseURL;
        agent.description = newDescription;
        agent.version = newVersion;
        agent.lastUpdatedAt = uint128(block.timestamp);   
        agent.onchainAddress = newOnchainAddress;    

        emit AgentUpdated(uuid, newName, newBaseURL, newDescription, newVersion, newOnchainAddress);
    }

    function updateTags(bytes16 uuid, uint256[] calldata tags) external onlyRole(PROVIDER_ROLE) {
        IdentityRegistryStorage storage $ = _getIdentityRegistryStorage();
        AgentData storage agent = $._agents[uuid];

        require(agent.registeredAt > 0, IdentityRegistry__E2());

        for (uint256 i; tags.length > i; i++) {
            string memory _tag = $._tags[tags[i]];
            bool _contains = agent.tags.contains(tags[i]);

            if (_contains) {
                agent.tags.remove(tags[i]);
            } else {
                require(bytes(_tag).length > 0, IdentityRegistry__E4());

                agent.tags.add(tags[i]);
            }

            emit AgentTagUpdated(uuid, tags[i], _tag, !_contains);
        }
    }

    function setTag(uint256[] calldata tagIds, string[] calldata tagData) external onlyRole(PROVIDER_ROLE) {
        require(tagIds.length == tagData.length, IdentityRegistry__E3());

        IdentityRegistryStorage storage $ = _getIdentityRegistryStorage();

        for (uint256 i; tagIds.length > i; i++) {
            $._tags[tagIds[i]] = tagData[i];

            emit AgentTagSet(tagIds[i], tagData[i]);
        }
    }

    function getAgentProfile(bytes16 uuid) external view returns(AgentProfile memory agentData) {
        IdentityRegistryStorage storage $ = _getIdentityRegistryStorage();
        AgentData storage agent = $._agents[uuid];

        address _onchainAddress = agent.onchainAddress;
        string[] memory _tags = new string[](agent.tags.length());

        for (uint256 i; _tags.length > i; i++) _tags[i] = $._tags[agent.tags.values()[i]];

        return AgentProfile({
            currentState: _getCurrentAgentState(uuid),
            name: agent.name,
            baseURL: agent.baseURL,
            description: agent.description,
            version: agent.version,
            registeredAt: agent.registeredAt,
            lastUpdatedAt: agent.lastUpdatedAt,
            onchainAddress: _onchainAddress,
            onchainBalance: _onchainAddress == address(0) ? 0 : _onchainAddress.balance,
            tags: _tags
        });
    }

    function getTagData(uint256 tagId) external view returns(string memory tagData) {
        IdentityRegistryStorage storage $ = _getIdentityRegistryStorage();
        return $._tags[tagId];
    }

    function swarmsContractName() public pure override returns(string memory contractName) {
        return "IdentityRegistry";
    }

    function supportsInterface(bytes4 interfaceId) public view override returns(bool) {
        return interfaceId == type(IIdentityRegistry).interfaceId || super.supportsInterface(interfaceId);
    }

    function _getCurrentAgentState(bytes16 uuid) internal view returns(AgentState currentAgentState) {
        IdentityRegistryStorage storage $ = _getIdentityRegistryStorage();
        AgentData storage agent = $._agents[uuid];

        if (agent.registeredAt == 0) return AgentState.Nonexistent;
        return AgentState.Active;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {
        _checkContractType(newImplementation);
    }

    function _getIdentityRegistryStorage() private pure returns(IdentityRegistryStorage storage $) {
        assembly {
            $.slot := IDENTITY_REGISTRY_STORAGE_LOCATION
        }
    }

}