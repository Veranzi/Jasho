import { Router } from "express";
import { verifyFirebaseToken, AuthedRequest } from "../middleware/auth";
import { ethers } from "ethers";

export const blockchainRouter = Router();

blockchainRouter.use(verifyFirebaseToken);

function getProviderAndWallet() {
  const rpc = process.env.CHAIN_RPC_URL;
  const pk = process.env.CHAIN_PRIVATE_KEY;
  if (!rpc || !pk) throw new Error("Missing CHAIN_RPC_URL or CHAIN_PRIVATE_KEY");
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);
  return { provider, wallet };
}

blockchainRouter.post("/anchor", async (req: AuthedRequest, res) => {
  const { id, amount, currency } = req.body as { id: string; amount: number; currency: string };
  const address = process.env.LEDGER_CONTRACT_ADDRESS;
  if (!address) return res.status(500).json({ error: "missing_contract" });
  try {
    const { wallet } = getProviderAndWallet();
    const abi = ["function record(bytes32 id, int256 amount, string currency)"]; 
    const contract = new ethers.Contract(address, abi, wallet);
    const tx = await contract.record(ethers.id(id), BigInt(amount), currency);
    const receipt = await tx.wait();
    return res.json({ txHash: receipt?.hash || tx.hash });
  } catch (e: any) {
    return res.status(500).json({ error: "anchor_failed", message: e?.message });
  }
});
