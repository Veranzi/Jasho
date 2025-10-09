import { ethers } from "hardhat";

async function main() {
  const Ledger = await ethers.getContractFactory("Ledger");
  const ledger = await Ledger.deploy();
  await ledger.deployed();
  console.log("Ledger deployed to:", ledger.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
