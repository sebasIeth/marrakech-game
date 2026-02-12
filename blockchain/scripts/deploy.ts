import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Base Sepolia USDC address
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const STAKE_AMOUNT = 1_000_000; // 1 USDC (6 decimals)
  const PLATFORM_FEE_BPS = 2000; // 20%
  const PLATFORM_WALLET = deployer.address; // Use deployer as platform wallet

  console.log("USDC Address:", USDC_ADDRESS);
  console.log("Stake Amount:", STAKE_AMOUNT, "(1 USDC)");
  console.log("Platform Fee:", PLATFORM_FEE_BPS / 100, "%");
  console.log("Platform Wallet:", PLATFORM_WALLET);

  const MarrakechFactory = await ethers.getContractFactory("MarrakechFactory");
  const factory = await MarrakechFactory.deploy(
    USDC_ADDRESS,
    STAKE_AMOUNT,
    PLATFORM_FEE_BPS,
    PLATFORM_WALLET
  );

  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("\nMarrakechFactory deployed to:", factoryAddress);

  // Save deployment info
  const deploymentDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deployment = {
    factory: factoryAddress,
    usdc: USDC_ADDRESS,
    stakeAmount: STAKE_AMOUNT,
    platformFeeBps: PLATFORM_FEE_BPS,
    platformWallet: PLATFORM_WALLET,
    network: "baseSepolia",
    chainId: 84532,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  fs.writeFileSync(
    path.join(deploymentDir, "baseSepolia.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\nDeployment info saved to deployments/baseSepolia.json");
  console.log("\nTo verify on Basescan:");
  console.log(`npx hardhat verify --network baseSepolia ${factoryAddress} ${USDC_ADDRESS} ${STAKE_AMOUNT} ${PLATFORM_FEE_BPS} ${PLATFORM_WALLET}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
