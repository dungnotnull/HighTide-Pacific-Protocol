// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockFundToken - testnet-only stand-in for the Loss & Damage fund
///         currency. Public mint on purpose: demo faucets, not real value.
contract MockFundToken is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 100_000_000 ether;

    constructor() ERC20("HighTide Test Dollar", "HTD") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
