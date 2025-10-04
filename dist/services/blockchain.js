import { ethers } from 'ethers';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
const provider = new ethers.JsonRpcProvider(env.ETH_RPC_URL);
const wallet = env.LEDGER_PRIVATE_KEY ? new ethers.Wallet(env.LEDGER_PRIVATE_KEY, provider) : null;
const abi = [
    'event TxLogged(bytes32 indexed txId, string userId, string type, uint256 amount, string currency, string metadata)',
    'function logTx(bytes32 txId, string userId, string type, uint256 amount, string currency, string metadata) public'
];
const contract = env.LEDGER_CONTRACT_ADDRESS && wallet ? new ethers.Contract(env.LEDGER_CONTRACT_ADDRESS, abi, wallet) : null;
export async function logTransactionToChain(params) {
    if (!contract) {
        logger.warn('Blockchain not configured. Skipping on-chain log.');
        return { skipped: true };
    }
    const txHash = ethers.id(params.txId);
    const amt = BigInt(params.amountMinor);
    const tx = await contract.logTx(txHash, params.userId, params.type, amt, params.currency, params.metadata);
    const receipt = await tx.wait();
    return { skipped: false, chainTx: receipt?.transactionHash };
}
