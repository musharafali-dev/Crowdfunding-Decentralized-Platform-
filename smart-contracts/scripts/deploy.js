const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying CrowdfundingPlatform...");

  const CrowdfundingPlatform = await hre.ethers.getContractFactory("CrowdfundingPlatform");
  const platformFee = 200; // 2% platform fee
  const contract = await CrowdfundingPlatform.deploy(platformFee);

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`CrowdfundingPlatform deployed to: ${contractAddress}`);

  // Create frontend contract data directory if it doesn't exist
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  // Get contract artifact for ABI
  const artifact = artifacts.readArtifactSync("CrowdfundingPlatform");

  // Save ABI and Address for frontend
  fs.writeFileSync(
    path.join(frontendContractsDir, "contractAddress.json"),
    JSON.stringify({ address: contractAddress }, null, 2)
  );

  fs.writeFileSync(
    path.join(frontendContractsDir, "CrowdfundingPlatform.json"),
    JSON.stringify(artifact, null, 2)
  );

  console.log(`Saved contract address and ABI to frontend contracts directory: ${frontendContractsDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
