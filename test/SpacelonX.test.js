// test/SpacelonX.test.js
//
// Suite de tests complète pour le contrat SpacelonX (SLX).
// Framework : Hardhat + Chai + ethers v6
//
// Pour lancer ces tests :
//   1. npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
//   2. npx hardhat init   (choisir "JavaScript project")
//   3. Placer SpacelonX.sol dans contracts/ et ce fichier dans test/
//   4. npx hardhat test
//
// Couvre : déploiement, supply, taxes (buy/sell/exclusions/cap),
//          vesting (cliff, linéaire, release, revoke), burn, ownership.

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SpacelonX (SLX)", function () {
  // Constantes attendues
  const TOTAL_SUPPLY = ethers.parseUnits("10000000000", 18); // 10 milliards
  const TEAM_ALLOC = ethers.parseUnits("1500000000", 18);    // 15%
  const ADVISORS_ALLOC = ethers.parseUnits("500000000", 18); // 5%
  const TREASURY_ALLOC = ethers.parseUnits("1500000000", 18);// 15%
  const ECOSYSTEM_ALLOC = ethers.parseUnits("500000000", 18);// 5%
  const VESTED_TOTAL = ethers.parseUnits("4000000000", 18);  // 40%
  const DEPLOYER_BALANCE = ethers.parseUnits("6000000000", 18); // 60%

  const DAY = 24 * 60 * 60;
  const MONTH = 30 * DAY;
  const SIX_MONTHS = 180 * DAY;
  const ONE_YEAR = 365 * DAY;
  const TWO_YEARS = 730 * DAY;
  const THREE_YEARS = 1095 * DAY;
  const FOUR_YEARS = 1460 * DAY;

  // Variables partagées
  let SpacelonX, slx;
  let owner, taxWallet, team, advisors, treasury, ecosystem, user1, user2, ammPair;

  beforeEach(async function () {
    [owner, taxWallet, team, advisors, treasury, ecosystem, user1, user2, ammPair] =
      await ethers.getSigners();

    SpacelonX = await ethers.getContractFactory("SpacelonX");
    slx = await SpacelonX.deploy(
      taxWallet.address,
      team.address,
      advisors.address,
      treasury.address,
      ecosystem.address
    );
    await slx.waitForDeployment();
  });

  // ==========================================================
  //                     DÉPLOIEMENT & SUPPLY
  // ==========================================================
  describe("Déploiement & Supply", function () {
    it("a le bon nom et symbole", async function () {
      expect(await slx.name()).to.equal("SpacelonX");
      expect(await slx.symbol()).to.equal("SLX");
    });

    it("a 18 décimales", async function () {
      expect(await slx.decimals()).to.equal(18);
    });

    it("a une supply totale de 10 milliards", async function () {
      expect(await slx.totalSupply()).to.equal(TOTAL_SUPPLY);
    });

    it("attribue 60% au déployeur (40% en vesting)", async function () {
      expect(await slx.balanceOf(owner.address)).to.equal(DEPLOYER_BALANCE);
    });

    it("verrouille 40% dans le contrat (vesting)", async function () {
      expect(await slx.balanceOf(await slx.getAddress())).to.equal(VESTED_TOTAL);
      expect(await slx.totalLockedInVesting()).to.equal(VESTED_TOTAL);
    });

    it("crée 4 schedules de vesting", async function () {
      expect(await slx.vestingScheduleCount()).to.equal(4);
    });

    it("rejette une adresse zéro dans le constructeur", async function () {
      await expect(
        SpacelonX.deploy(
          ethers.ZeroAddress,
          team.address,
          advisors.address,
          treasury.address,
          ecosystem.address
        )
      ).to.be.revertedWith("Tax wallet zero");
    });

    it("définit le bon owner", async function () {
      expect(await slx.owner()).to.equal(owner.address);
    });

    it("exclut le déployeur et les wallets projet de la taxe", async function () {
      expect(await slx.isExcludedFromTax(owner.address)).to.equal(true);
      expect(await slx.isExcludedFromTax(taxWallet.address)).to.equal(true);
      expect(await slx.isExcludedFromTax(team.address)).to.equal(true);
    });
  });

  // ==========================================================
  //                          TAXES
  // ==========================================================
  describe("Taxes", function () {
    beforeEach(async function () {
      // Donner des tokens à user1 (exclu via owner, donc transfert sans taxe)
      await slx.transfer(user1.address, ethers.parseUnits("1000000", 18));
      // Marquer ammPair comme paire AMM
      await slx.setAMMPair(ammPair.address, true);
    });

    it("ne prélève PAS de taxe entre deux wallets normaux", async function () {
      // user1 -> user2 (ni l'un ni l'autre exclu, ni AMM)
      const amount = ethers.parseUnits("1000", 18);
      await slx.connect(user1).transfer(user2.address, amount);
      expect(await slx.balanceOf(user2.address)).to.equal(amount);
    });

    it("prélève la SELL tax (3%) quand on envoie vers une paire AMM", async function () {
      const amount = ethers.parseUnits("1000", 18);
      const expectedTax = (amount * 300n) / 10000n; // 3%
      const expectedNet = amount - expectedTax;

      await slx.connect(user1).transfer(ammPair.address, amount);

      expect(await slx.balanceOf(ammPair.address)).to.equal(expectedNet);
      expect(await slx.balanceOf(taxWallet.address)).to.equal(expectedTax);
    });

    it("prélève la BUY tax (2%) quand on reçoit depuis une paire AMM", async function () {
      // D'abord donner des tokens à la paire AMM (transfert depuis owner exclu = pas de taxe)
      await slx.transfer(ammPair.address, ethers.parseUnits("100000", 18));
      const taxWalletBefore = await slx.balanceOf(taxWallet.address);

      const amount = ethers.parseUnits("1000", 18);
      const expectedTax = (amount * 200n) / 10000n; // 2%
      const expectedNet = amount - expectedTax;

      // ammPair -> user2 (achat)
      await slx.connect(ammPair).transfer(user2.address, amount);

      expect(await slx.balanceOf(user2.address)).to.equal(expectedNet);
      expect(await slx.balanceOf(taxWallet.address)).to.equal(taxWalletBefore + expectedTax);
    });

    it("ne prélève pas de taxe si une adresse est exclue", async function () {
      await slx.setAMMPair(ammPair.address, true);
      await slx.setExcludedFromTax(user1.address, true);
      const amount = ethers.parseUnits("1000", 18);

      // user1 exclu -> ammPair : pas de taxe malgré AMM
      await slx.connect(user1).transfer(ammPair.address, amount);
      expect(await slx.balanceOf(ammPair.address)).to.equal(amount);
    });

    it("permet à l'owner de changer les taux dans la limite", async function () {
      await slx.setTaxRates(500, 700); // 5% / 7%
      expect(await slx.buyTaxBps()).to.equal(500);
      expect(await slx.sellTaxBps()).to.equal(700);
    });

    it("REJETTE un taux de taxe supérieur au cap de 10%", async function () {
      await expect(slx.setTaxRates(1001, 300)).to.be.revertedWith("Buy tax exceeds 10%");
      await expect(slx.setTaxRates(200, 1001)).to.be.revertedWith("Sell tax exceeds 10%");
    });

    it("accepte exactement 10% (le cap)", async function () {
      await slx.setTaxRates(1000, 1000);
      expect(await slx.buyTaxBps()).to.equal(1000);
    });

    it("permet de changer le taxWallet", async function () {
      await slx.setTaxWallet(user2.address);
      expect(await slx.taxWallet()).to.equal(user2.address);
      expect(await slx.isExcludedFromTax(user2.address)).to.equal(true);
    });
  });

  // ==========================================================
  //                         VESTING
  // ==========================================================
  describe("Vesting", function () {
    it("ne libère RIEN avant la fin du cliff (Team, cliff 12 mois)", async function () {
      // Schedule 0 = Team, cliff 12 mois
      await time.increase(SIX_MONTHS); // 180 jours (< cliff réel de 365 jours)
      expect(await slx.releasable(0)).to.equal(0);
    });

    it("libère une portion proportionnelle après le cliff (Team)", async function () {
      // Team : cliff 12 mois, vesting total 36 mois, linéaire depuis startTime
      await time.increase(ONE_YEAR + DAY); // juste après le cliff réel du contrat
      const releasable = await slx.releasable(0);
      // ~12/36 = 1/3 doit être libérable
      expect(releasable).to.be.gt(0);
      // approximativement un tiers (tolérance)
      const third = TEAM_ALLOC / 3n;
      expect(releasable).to.be.closeTo(third, ethers.parseUnits("50000000", 18));
    });

    it("libère la totalité après la durée complète (Team, 36 mois)", async function () {
      await time.increase(THREE_YEARS + DAY);
      expect(await slx.releasable(0)).to.equal(TEAM_ALLOC);
    });

    it("permet au bénéficiaire de release ses tokens", async function () {
      await time.increase(THREE_YEARS + DAY);
      const before = await slx.balanceOf(team.address);
      await slx.connect(team).release(0);
      const after = await slx.balanceOf(team.address);
      expect(after - before).to.equal(TEAM_ALLOC);
    });

    it("REJETTE un release par quelqu'un qui n'est pas le bénéficiaire", async function () {
      await time.increase(THREE_YEARS + DAY);
      await expect(slx.connect(user1).release(0)).to.be.revertedWith("Not beneficiary");
    });

    it("REJETTE un release quand il n'y a rien à libérer", async function () {
      // Avant le cliff
      await expect(slx.connect(team).release(0)).to.be.revertedWith("Nothing to release");
    });

    it("permet à l'owner de révoquer un schedule révocable (Advisors)", async function () {
      // Schedule 1 = Advisors, revocable = true
      await time.increase(ONE_YEAR);
      await expect(slx.revokeVesting(1)).to.not.be.reverted;
    });

    it("REJETTE la révocation d'un schedule NON révocable (Team)", async function () {
      // Schedule 0 = Team, revocable = false
      await expect(slx.revokeVesting(0)).to.be.revertedWith("Schedule not revocable");
    });

    it("REJETTE une double révocation", async function () {
      await time.increase(ONE_YEAR);
      await slx.revokeVesting(1);
      await expect(slx.revokeVesting(1)).to.be.revertedWith("Already revoked");
    });

    it("permet à l'owner de créer un nouveau schedule", async function () {
      const amount = ethers.parseUnits("1000000", 18);
      await slx.createVestingSchedule(
        user1.address, amount, 0, MONTH * 3, MONTH * 12, true, "Bug Bounty"
      );
      expect(await slx.vestingScheduleCount()).to.equal(5);
    });

    it("REJETTE un nouveau schedule avec cliff > durée", async function () {
      const amount = ethers.parseUnits("1000000", 18);
      await expect(
        slx.createVestingSchedule(user1.address, amount, 0, MONTH * 24, MONTH * 12, true, "Bad")
      ).to.be.revertedWith("Cliff > duration");
    });
  });

  // ==========================================================
  //                          BURN
  // ==========================================================
  describe("Burn", function () {
    it("permet à un holder de burn ses tokens", async function () {
      const burnAmount = ethers.parseUnits("1000000", 18);
      const supplyBefore = await slx.totalSupply();
      await slx.burn(burnAmount);
      expect(await slx.totalSupply()).to.equal(supplyBefore - burnAmount);
    });

    it("réduit le solde du holder lors du burn", async function () {
      const burnAmount = ethers.parseUnits("1000000", 18);
      const balBefore = await slx.balanceOf(owner.address);
      await slx.burn(burnAmount);
      expect(await slx.balanceOf(owner.address)).to.equal(balBefore - burnAmount);
    });

    it("REJETTE un burn supérieur au solde", async function () {
      const tooMuch = ethers.parseUnits("99000000000", 18);
      await expect(slx.burn(tooMuch)).to.be.reverted;
    });
  });

  // ==========================================================
  //                        OWNERSHIP
  // ==========================================================
  describe("Ownership", function () {
    it("REJETTE setTaxRates par un non-owner", async function () {
      await expect(slx.connect(user1).setTaxRates(100, 100)).to.be.reverted;
    });

    it("REJETTE setAMMPair par un non-owner", async function () {
      await expect(slx.connect(user1).setAMMPair(ammPair.address, true)).to.be.reverted;
    });

    it("REJETTE createVestingSchedule par un non-owner", async function () {
      await expect(
        slx.connect(user1).createVestingSchedule(
          user2.address, ethers.parseUnits("1", 18), 0, 0, MONTH, true, "x"
        )
      ).to.be.reverted;
    });

    it("permet le transfert d'ownership", async function () {
      await slx.transferOwnership(user1.address);
      expect(await slx.owner()).to.equal(user1.address);
    });

    it("permet à l'owner de renoncer à l'ownership", async function () {
      await slx.renounceOwnership();
      expect(await slx.owner()).to.equal(ethers.ZeroAddress);
    });
  });
});
