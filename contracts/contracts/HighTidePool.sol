// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title HighTidePool - parametric Loss & Damage payout engine.
/// @notice Verifies EIP-712-signed oracle readings, evaluates trend-adjusted
///         trigger thresholds (1e6 fixed point, mirroring the off-chain AI
///         engine), pays affected countries, and makes double counting
///         impossible: one evaluation per (country, year), one payout per
///         event id.
contract HighTidePool is Ownable {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    uint256 public constant SCALE = 1_000_000;

    struct CountryParams {
        string name;
        int256 interceptScaled; // 1e6
        int256 slopeScaled;     // 1e6
        int256 sigmaScaled;     // 1e6, > 0
        uint256 kScaled;        // 1e6
        uint8 nConsecutive;     // readings above threshold to fire
        uint64 weightScaled;    // 1e6, share of reference pool
        address beneficiary;
    }

    struct TriggerState {
        uint8 streak;
        int256 bestZScaled; // max z within current streak, 1e6
        uint32 streakStartYear;
    }

    struct PayoutRecord {
        address beneficiary;
        uint256 amount;      // entitlement
        uint256 paid;        // actually transferred
        uint256 outstanding; // unpaid remainder when pool ran short
        bool executed;
    }

    IERC20 public immutable token;
    address public immutable registry;
    uint256 public immutable referencePool; // fund size per full allocation

    address public oracle;

    mapping(bytes2 => CountryParams) public countryParams;
    mapping(bytes2 => TriggerState) private _states;
    mapping(bytes2 => mapping(uint32 => bool)) public yearEvaluated;
    mapping(bytes32 => PayoutRecord) public payouts;
    mapping(bytes2 => uint256) public totalPaidByCountry;

    // EIP-712: Reading(bytes2 country, uint32 year, int256 valueScaled)
    bytes32 public constant READING_TYPEHASH =
        keccak256("Reading(bytes2 country,uint32 year,int256 valueScaled)");
    bytes32 public immutable DOMAIN_SEPARATOR;

    event OracleSet(address indexed oracle);
    event CountrySet(bytes2 indexed code, string name);
    event Funded(address indexed donor, uint256 amount);
    event Triggered(
        bytes2 indexed country,
        bytes32 indexed eventId,
        uint32 startYear,
        uint32 endYear,
        int256 peakZScaled,
        uint256 tierScaled
    );
    event PayoutExecuted(
        bytes32 indexed eventId,
        address indexed beneficiary,
        uint256 amount,
        uint256 paid,
        uint256 outstanding
    );

    error UnknownCountry(bytes2 country);
    error InvalidSignature(address recovered);
    error ReadingAlreadyEvaluated(bytes2 country, uint32 year);
    error PayoutAlreadyExecuted(bytes32 eventId);
    error ZeroSigma(bytes2 country);
    error ZeroWeight(bytes2 country);
    error ZeroNConsecutive(bytes2 country);
    error ZeroK(bytes2 country);

    constructor(
        address token_,
        address registry_,
        address oracle_,
        uint256 referencePool_
    ) Ownable(msg.sender) {
        token = IERC20(token_);
        registry = registry_;
        oracle = oracle_;
        referencePool = referencePool_;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("HighTideOracle")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function setOracle(address oracle_) external onlyOwner {
        oracle = oracle_;
        emit OracleSet(oracle_);
    }

    function setCountry(
        bytes2 code,
        string calldata name,
        int256 interceptScaled,
        int256 slopeScaled,
        int256 sigmaScaled,
        uint256 kScaled,
        uint8 nConsecutive,
        uint64 weightScaled,
        address beneficiary
    ) external onlyOwner {
        if (sigmaScaled <= 0) revert ZeroSigma(code);
        if (weightScaled == 0) revert ZeroWeight(code);
        if (nConsecutive == 0) revert ZeroNConsecutive(code);
        if (kScaled == 0) revert ZeroK(code);
        countryParams[code] = CountryParams({
            name: name,
            interceptScaled: interceptScaled,
            slopeScaled: slopeScaled,
            sigmaScaled: sigmaScaled,
            kScaled: kScaled,
            nConsecutive: nConsecutive,
            weightScaled: weightScaled,
            beneficiary: beneficiary
        });
        emit CountrySet(code, name);
    }

    function fund(uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Funded(msg.sender, amount);
    }

    // ------------------------------------------------------------------
    // Trigger evaluation
    // ------------------------------------------------------------------

    function expectedScaled(bytes2 code, uint32 year) public view returns (int256) {
        CountryParams memory p = countryParams[code];
        return p.interceptScaled + p.slopeScaled * int256(uint256(year));
    }

    function zScoreScaled(
        bytes2 code,
        uint32 year,
        int256 valueScaled
    ) public view returns (int256) {
        CountryParams memory p = countryParams[code];
        return ((valueScaled - expectedScaled(code, year)) * int256(SCALE)) / p.sigmaScaled;
    }

    function tierScaledFor(int256 z) public pure returns (uint256) {
        if (z >= 3 * int256(SCALE)) return 1_000_000; // 100%
        if (z >= 2 * int256(SCALE)) return 600_000;   // 60%
        if (z >= 1 * int256(SCALE)) return 300_000;   // 30%
        return 0;
    }

    function submitReading(
        bytes2 country,
        uint32 year,
        int256 valueScaled,
        bytes calldata signature
    ) external {
        CountryParams memory p = countryParams[country];
        if (bytes(p.name).length == 0) revert UnknownCountry(country);
        if (yearEvaluated[country][year]) {
            revert ReadingAlreadyEvaluated(country, year);
        }

        // Inline struct hash to keep the frame shallow (stack-too-deep guard).
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(READING_TYPEHASH, country, year, valueScaled))
            )
        );
        address recovered = digest.recover(signature);
        if (recovered != oracle) revert InvalidSignature(recovered);

        yearEvaluated[country][year] = true;

        TriggerState storage st = _states[country];
        int256 z = zScoreScaled(country, year, valueScaled);
        if (z >= int256(p.kScaled)) {
            if (st.streak == 0) st.streakStartYear = year;
            st.streak += 1;
            if (z > st.bestZScaled) st.bestZScaled = z;
        } else {
            st.streak = 0;
            st.bestZScaled = 0;
        }

        if (st.streak == p.nConsecutive) {
            // snapshot then reset - mirrors hightide/stats.py update_trigger
            // (peak is stashed in z to keep the frame shallow)
            uint32 startYear = st.streakStartYear;
            z = st.bestZScaled;
            st.streak = 0;
            st.bestZScaled = 0;
            st.streakStartYear = 0;

            bytes32 eventId =
                keccak256(abi.encodePacked(country, startYear, year));
            if (payouts[eventId].executed) revert PayoutAlreadyExecuted(eventId);

            uint256 tier = tierScaledFor(z);
            emit Triggered(country, eventId, startYear, year, z, tier);
            _pay(
                eventId,
                p.beneficiary,
                country,
                (referencePool * tier / SCALE) * uint256(p.weightScaled) / SCALE
            );
        }
    }

    function _pay(
        bytes32 eventId,
        address beneficiary,
        bytes2 country,
        uint256 amount
    ) private {
        uint256 balance = token.balanceOf(address(this));
        uint256 paid = balance >= amount ? amount : balance;
        uint256 outstanding = amount - paid;

        payouts[eventId] = PayoutRecord({
            beneficiary: beneficiary,
            amount: amount,
            paid: paid,
            outstanding: outstanding,
            executed: true
        });
        totalPaidByCountry[country] += paid;
        if (paid > 0) {
            token.safeTransfer(beneficiary, paid);
        }
        emit PayoutExecuted(eventId, beneficiary, amount, paid, outstanding);
    }
}
