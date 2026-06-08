const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.SLX_MAINNET_ADDRESS;
  if (!contractAddress) {
    throw new Error("Missing SLX_MAINNET_ADDRESS in .env");
  }

  const taxWallet = "0x3495c5F376c4EDeA3E62c3db5Bead33CB0415e81";
  const teamWallet = "0xd6E08c315703f9b0858d3F3dD8401bfAA515647e";
  const advisorsWallet = "0x3a6DAD51c5711df3B147A5386c3FB5fC367424a3";
  const treasuryWallet = "0xd327f5a85b63ecd09e464298f3F5Dd5B0C859FdA";
  const ecosystemWallet = "0x4b6ddF23729C1b42E717639C30A35d1e6C55f884";

  console.log("Verifying SpacelonX at:", contractAddress);

  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [
      taxWallet,
      teamWallet,
      advisorsWallet,
      treasuryWallet,
      ecosystemWallet,
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
