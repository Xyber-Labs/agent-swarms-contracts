// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IIdentityRegistry {

    struct AgentProfile {
        AgentState currentState;
        string name;
        string baseURL;
        string description;
        uint16 version;
        uint128 registeredAt;
        uint128 lastUpdatedAt;
        address onchainAddress;
        uint256 onchainBalance;
        string[] tags;
    }

    enum AgentState {
        Nonexistent,
        Pending,
        Active,
        Paused,
        Inactive
    }

    function getAgentProfile(bytes16 uuid) external view returns(AgentProfile memory agentData);

    function getTagData(uint256 tagId) external view returns(string memory tagData);

    function register(
        bytes16 uuid,
        string calldata name,
        string calldata baseURL,
        string calldata description,
        uint16 version,
        address onchainAddress
    ) external;

    function update(
        bytes16 uuid,
        string calldata newName,
        string calldata newBaseURL,
        string calldata newDescription,
        uint16 newVersion,
        address newOnchainAddress
    ) external;

    function updateTags(bytes16 uuid, uint256[] calldata tags) external;

    function setTag(uint256[] calldata tagId, string[] calldata tagData) external;

}