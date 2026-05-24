// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SpacelonX (SLX)
 * @dev ERC-20 avec :
 *      - Supply fixe de 10 milliards
 *      - Burn possible par les holders
 *      - Taxe configurable buy/sell (cap dur a 10%)
 *      - Vesting integre : 40% de la supply bloques au deploiement
 *        repartis sur 4 schedules (Team 15%, Advisors 5%, Treasury 15%, Ecosystem 5%)
 */
contract SpacelonX is ERC20, ERC20Burnable, Ownable {

    // ============================================================
    //                      SUPPLY & CONSTANTES
    // ============================================================

    uint256 public constant INITIAL_SUPPLY = 10_000_000_000 * 10**18;

    uint256 public constant TEAM_ALLOCATION       = 1_500_000_000 * 10**18;
    uint256 public constant ADVISORS_ALLOCATION   =   500_000_000 * 10**18;
    uint256 public constant TREASURY_ALLOCATION   = 1_500_000_000 * 10**18;
    uint256 public constant ECOSYSTEM_ALLOCATION  =   500_000_000 * 10**18;

    uint256 public constant MAX_TAX_BPS = 1000; // 10%

    uint64 private constant SIX_MONTHS  = 180 days;
    uint64 private constant ONE_YEAR    = 365 days;
    uint64 private constant TWO_YEARS   = 730 days;
    uint64 private constant THREE_YEARS = 1095 days;
    uint64 private constant FOUR_YEARS  = 1460 days;

    // ============================================================
    //                          TAXE
    // ============================================================

    uint256 public buyTaxBps = 200;
    uint256 public sellTaxBps = 300;

    address public taxWallet;

    mapping(address => bool) public isExcludedFromTax;
    mapping(address => bool) public isAMMPair;

    bool private _inTaxTransfer;

    event TaxRatesUpdated(uint256 buyTaxBps, uint256 sellTaxBps);
    event TaxWalletUpdated(address indexed newWallet);
    event AMMPairUpdated(address indexed pair, bool isPair);
    event TaxExclusionUpdated(address indexed account, bool excluded);

    // ============================================================
    //                          VESTING
    // ============================================================

    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 released;
        uint64 startTime;
        uint64 cliffDuration;
        uint64 vestingDuration;
        bool revocable;
        bool revoked;
        string label;
    }

    mapping(uint256 => VestingSchedule) public vestingSchedules;
    uint256 public vestingScheduleCount;
    uint256 public totalLockedInVesting;

    event VestingScheduleCreated(
        uint256 indexed id,
        address indexed beneficiary,
        uint256 amount,
        uint64 startTime,
        uint64 cliffDuration,
        uint64 vestingDuration,
        string label
    );
    event TokensReleased(uint256 indexed id, address indexed beneficiary, uint256 amount);
    event VestingRevoked(uint256 indexed id, uint256 returnedToOwner);

    // ============================================================
    //                      CONSTRUCTEUR
    // ============================================================

    constructor(
        address _taxWallet,
        address _teamWallet,
        address _advisorsWallet,
        address _treasuryWallet,
        address _ecosystemWallet
    )
        ERC20("SpacelonX", "SLX")
        Ownable(msg.sender)
    {
        require(_taxWallet      != address(0), "Tax wallet zero");
        require(_teamWallet     != address(0), "Team wallet zero");
        require(_advisorsWallet != address(0), "Advisors wallet zero");
        require(_treasuryWallet != address(0), "Treasury wallet zero");
        require(_ecosystemWallet!= address(0), "Ecosystem wallet zero");

        taxWallet = _taxWallet;

        isExcludedFromTax[msg.sender]       = true;
        isExcludedFromTax[address(this)]    = true;
        isExcludedFromTax[_taxWallet]       = true;
        isExcludedFromTax[_teamWallet]      = true;
        isExcludedFromTax[_advisorsWallet]  = true;
        isExcludedFromTax[_treasuryWallet]  = true;
        isExcludedFromTax[_ecosystemWallet] = true;

        _mint(msg.sender, INITIAL_SUPPLY);

        uint64 nowTs = uint64(block.timestamp);

        _createSchedule(_teamWallet,      TEAM_ALLOCATION,      nowTs, ONE_YEAR,    THREE_YEARS, false, "Team");
        _createSchedule(_advisorsWallet,  ADVISORS_ALLOCATION,  nowTs, SIX_MONTHS,  TWO_YEARS,   true,  "Advisors");
        _createSchedule(_treasuryWallet,  TREASURY_ALLOCATION,  nowTs, 0,           FOUR_YEARS,  false, "Treasury");
        _createSchedule(_ecosystemWallet, ECOSYSTEM_ALLOCATION, nowTs, SIX_MONTHS,  THREE_YEARS, true,  "Ecosystem");
    }

    // ============================================================
    //              OVERRIDE TRANSFERT (pour la taxe)
    // ============================================================

    function _update(address from, address to, uint256 value) internal override {
        if (
            from == address(0) ||
            to == address(0) ||
            isExcludedFromTax[from] ||
            isExcludedFromTax[to] ||
            _inTaxTransfer
        ) {
            super._update(from, to, value);
            return;
        }

        uint256 taxBps = 0;
        if (isAMMPair[from]) {
            taxBps = buyTaxBps;
        } else if (isAMMPair[to]) {
            taxBps = sellTaxBps;
        }

        if (taxBps > 0) {
            uint256 taxAmount = (value * taxBps) / 10_000;
            uint256 netAmount = value - taxAmount;

            _inTaxTransfer = true;
            super._update(from, taxWallet, taxAmount);
            _inTaxTransfer = false;

            super._update(from, to, netAmount);
        } else {
            super._update(from, to, value);
        }
    }

    // ============================================================
    //                  ADMIN - TAXE
    // ============================================================

    function setTaxRates(uint256 _buyTaxBps, uint256 _sellTaxBps) external onlyOwner {
        require(_buyTaxBps  <= MAX_TAX_BPS, "Buy tax exceeds 10%");
        require(_sellTaxBps <= MAX_TAX_BPS, "Sell tax exceeds 10%");
        buyTaxBps = _buyTaxBps;
        sellTaxBps = _sellTaxBps;
        emit TaxRatesUpdated(_buyTaxBps, _sellTaxBps);
    }

    function setTaxWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Zero address");
        taxWallet = _newWallet;
        isExcludedFromTax[_newWallet] = true;
        emit TaxWalletUpdated(_newWallet);
    }

    function setAMMPair(address pair, bool status) external onlyOwner {
        require(pair != address(0), "Zero address");
        isAMMPair[pair] = status;
        emit AMMPairUpdated(pair, status);
    }

    function setExcludedFromTax(address account, bool excluded) external onlyOwner {
        isExcludedFromTax[account] = excluded;
        emit TaxExclusionUpdated(account, excluded);
    }

    // ============================================================
    //                  VESTING - CREATION
    // ============================================================

    function _createSchedule(
        address _beneficiary,
        uint256 _amount,
        uint64 _startTime,
        uint64 _cliffDuration,
        uint64 _vestingDuration,
        bool _revocable,
        string memory _label
    ) internal returns (uint256) {
        _transfer(msg.sender, address(this), _amount);

        uint256 id = vestingScheduleCount;
        vestingSchedules[id] = VestingSchedule({
            beneficiary: _beneficiary,
            totalAmount: _amount,
            released: 0,
            startTime: _startTime,
            cliffDuration: _cliffDuration,
            vestingDuration: _vestingDuration,
            revocable: _revocable,
            revoked: false,
            label: _label
        });
        vestingScheduleCount++;
        totalLockedInVesting += _amount;

        emit VestingScheduleCreated(
            id, _beneficiary, _amount, _startTime, _cliffDuration, _vestingDuration, _label
        );
        return id;
    }

    function createVestingSchedule(
        address _beneficiary,
        uint256 _amount,
        uint64 _startTime,
        uint64 _cliffDuration,
        uint64 _vestingDuration,
        bool _revocable,
        string calldata _label
    ) external onlyOwner returns (uint256) {
        require(_beneficiary != address(0), "Zero beneficiary");
        require(_amount > 0, "Zero amount");
        require(_vestingDuration > 0, "Zero duration");
        require(_cliffDuration <= _vestingDuration, "Cliff > duration");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");

        uint64 startTime = _startTime == 0 ? uint64(block.timestamp) : _startTime;
        return _createSchedule(_beneficiary, _amount, startTime, _cliffDuration, _vestingDuration, _revocable, _label);
    }

    // ============================================================
    //              VESTING - CALCUL & LIBERATION
    // ============================================================

    function vestedAmount(uint256 _id) public view returns (uint256) {
        VestingSchedule memory s = vestingSchedules[_id];
        if (s.totalAmount == 0) return 0;
        if (s.revoked) return s.released;

        uint256 currentTime = block.timestamp;

        if (currentTime < s.startTime + s.cliffDuration) {
            return 0;
        }
        if (currentTime >= s.startTime + s.vestingDuration) {
            return s.totalAmount;
        }
        return (s.totalAmount * (currentTime - s.startTime)) / s.vestingDuration;
    }

    function releasable(uint256 _id) public view returns (uint256) {
        return vestedAmount(_id) - vestingSchedules[_id].released;
    }

    function release(uint256 _id) external {
        VestingSchedule storage s = vestingSchedules[_id];
        require(msg.sender == s.beneficiary, "Not beneficiary");

        uint256 amount = releasable(_id);
        require(amount > 0, "Nothing to release");

        s.released += amount;
        totalLockedInVesting -= amount;

        _transfer(address(this), s.beneficiary, amount);
        emit TokensReleased(_id, s.beneficiary, amount);
    }

    function revokeVesting(uint256 _id) external onlyOwner {
        VestingSchedule storage s = vestingSchedules[_id];
        require(s.revocable, "Schedule not revocable");
        require(!s.revoked, "Already revoked");

        uint256 vested = vestedAmount(_id);
        uint256 toBeneficiary = vested - s.released;
        uint256 toOwner = s.totalAmount - vested;

        s.revoked = true;
        s.released = vested;
        totalLockedInVesting -= (toBeneficiary + toOwner);

        if (toBeneficiary > 0) {
            _transfer(address(this), s.beneficiary, toBeneficiary);
        }
        if (toOwner > 0) {
            _transfer(address(this), owner(), toOwner);
        }

        emit VestingRevoked(_id, toOwner);
    }
}
