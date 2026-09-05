// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ClimateDataRegistry - immutably anchors dataset and AI-output
///        hashes so every number the protocol uses is provably the number
///        that was published.
contract ClimateDataRegistry is Ownable {
    struct Anchor {
        string source;
        string indicator;
        uint32 periodStart;
        uint32 periodEnd;
        uint64 anchoredAt;
    }

    event Anchored(
        bytes32 indexed dataHash,
        string source,
        string indicator,
        uint32 periodStart,
        uint32 periodEnd
    );

    error AlreadyAnchored(bytes32 dataHash);

    mapping(bytes32 => Anchor) private _anchors;
    mapping(bytes32 => bool) private _exists;

    constructor() Ownable(msg.sender) {}

    function anchor(
        bytes32 dataHash,
        string calldata source,
        string calldata indicator,
        uint32 periodStart,
        uint32 periodEnd
    ) external onlyOwner {
        if (_exists[dataHash]) revert AlreadyAnchored(dataHash);
        _exists[dataHash] = true;
        _anchors[dataHash] = Anchor({
            source: source,
            indicator: indicator,
            periodStart: periodStart,
            periodEnd: periodEnd,
            anchoredAt: uint64(block.timestamp)
        });
        emit Anchored(dataHash, source, indicator, periodStart, periodEnd);
    }

    function getAnchor(bytes32 dataHash) external view returns (Anchor memory) {
        return _anchors[dataHash];
    }
}
