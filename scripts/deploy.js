const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Network:", hre.network.name);
  console.log("Deploying SpacelonX with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "POL/MATIC");

  if (hre.network.name === "polygon") {
    const expectedDeployer = "0x111829B2F80760Db1cFb51106b1a2d64FD1139f0";
    if (deployer.address.toLowerCase() !== expectedDeployer.toLowerCase()) {
      throw new Error(`Wrong deployer wallet. Expected ${expectedDeployer}, got ${deployer.address}`);
    }
  }

  const taxWallet = "0x3495c5F376c4EDeA3E62c3db5Bead33CB0415e81";
  const teamWallet = "0xd6E08c315703f9b0858d3F3dD8401bfAA515647e";
  const advisorsWallet = "0x3a6DAD51c5711df3B147A5386c3FB5fC367424a3";
  const treasuryWallet = "0xd327f5a85b63ecd09e464298f3F5Dd5B0C859FdA";
  const ecosystemWallet = "0x4b6ddF23729C1b42E717639C30A35d1e6C55f884";

  console.log("Constructor parameters:");
  console.log("Tax wallet:       ", taxWallet);
  console.log("Team wallet:      ", teamWallet);
  console.log("Advisors wallet:  ", advisorsWallet);
  console.log("Treasury wallet:  ", treasuryWallet);
  console.log("Ecosystem wallet: ", ecosystemWallet);

  const SpacelonX = await hre.ethers.getContractFactory("SpacelonX");
  const slx = await SpacelonX.deploy(
    taxWallet,
    teamWallet,
    advisorsWallet,
    treasuryWallet,
    ecosystemWallet
  );

  await slx.waitForDeployment();

  const contractAddress = await slx.getAddress();
  const deploymentTx = slx.deploymentTransaction();

  console.log("\n=== DEPLOYMENT RESULT ===");
  console.log("SpacelonX deployed to:", contractAddress);
  console.log("Deployer / initial owner:", deployer.address);
  console.log("Deployment tx:", deploymentTx ? deploymentTx.hash : "unknown");
  console.log("\nSave this address immediately. It is the Polygon mainnet SLX contract address.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
