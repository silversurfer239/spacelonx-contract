// test/SpacelonX.additional.test.js
// Compléments d'audit fonctionnel pour SpacelonX.

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SpacelonX (SLX) - Additional professional checks", function () {
  const DAY = 24 * 60 * 60;
  const ONE_YEAR = 365 * DAY;
  const TWO_YEARS = 730 * DAY;
  const ADVISORS_ALLOC = ethers.parseUnits("500000000", 18);

  let SpacelonX, slx;
  let owner, taxWallet, team, advisors, treasury, ecosystem, user1, user2, ammPair;

  beforeEach(async function () {
    [owner, taxWallet, team, advisors, treasury, ecosystem, user1, user2, ammPair] = await ethers.getSigners();
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

  describe("Constructor guardrails", function () {
    it("REJETTE un team wallet zéro", async function () {
      await expect(
        SpacelonX.deploy(taxWallet.address, ethers.ZeroAddress, advisors.address, treasury.address, ecosystem.address)
      ).to.be.revertedWith("Team wallet zero");
    });

    it("REJETTE un advisors wallet zéro", async function () {
      await expect(
        SpacelonX.deploy(taxWallet.address, team.address, ethers.ZeroAddress, treasury.address, ecosystem.address)
      ).to.be.revertedWith("Advisors wallet zero");
    });

    it("REJETTE un treasury wallet zéro", async function () {
      await expect(
        SpacelonX.deploy(taxWallet.address, team.address, advisors.address, ethers.ZeroAddress, ecosystem.address)
      ).to.be.revertedWith("Treasury wallet zero");
    });

    it("REJETTE un ecosystem wallet zéro", async function () {
      await expect(
        SpacelonX.deploy(taxWallet.address, team.address, advisors.address, treasury.address, ethers.ZeroAddress)
      ).to.be.revertedWith("Ecosystem wallet zero");
    });
  });

  describe("Admin guardrails", function () {
    it("REJETTE setTaxWallet vers adresse zéro", async function () {
      await expect(slx.setTaxWallet(ethers.ZeroAddress)).to.be.revertedWith("Zero address");
    });

    it("REJETTE setAMMPair avec adresse zéro", async function () {
      await expect(slx.setAMMPair(ethers.ZeroAddress, true)).to.be.revertedWith("Zero address");
    });

    it("permet de désactiver une paire AMM et supprime alors la taxe", async function () {
      await slx.transfer(user1.address, ethers.parseUnits("10000", 18));
      await slx.setAMMPair(ammPair.address, true);
      await slx.setAMMPair(ammPair.address, false);

      const amount = ethers.parseUnits("1000", 18);
      await slx.connect(user1).transfer(ammPair.address, amount);
      expect(await slx.balanceOf(ammPair.address)).to.equal(amount);
    });
  });

  describe("Vesting accounting", function () {
    it("révoquer Advisors après vesting complet transfère 100% au bénéficiaire et 0 au owner", async function () {
      const ownerBefore = await slx.balanceOf(owner.address);
      const advisorsBefore = await slx.balanceOf(advisors.address);

      await time.increase(TWO_YEARS + DAY);
      await slx.revokeVesting(1);

      expect(await slx.balanceOf(advisors.address)).to.equal(advisorsBefore + ADVISORS_ALLOC);
      expect(await slx.balanceOf(owner.address)).to.equal(ownerBefore);
    });

    it("après release complète Team, le releasable retombe à zéro", async function () {
      await time.increase(ONE_YEAR * 3 + DAY);
      await slx.connect(team).release(0);
      expect(await slx.releasable(0)).to.equal(0);
    });
  });
});
