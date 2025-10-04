from web3 import Web3
import os
from typing import Optional


class BlockchainClient:
    """Simple Ethereum-compatible client wrapper for logging transactions on-chain.

    Uses HTTP RPC via WEB3_RPC_URL and a private key in WEB3_PRIVATE_KEY to
    sign and send transactions to a configured contract (optional).
    """

    def __init__(self) -> None:
        self.rpc_url = os.getenv("WEB3_RPC_URL")
        self.private_key = os.getenv("WEB3_PRIVATE_KEY")
        self.contract_address = os.getenv("WEB3_CONTRACT_ADDRESS")
        self.web3: Optional[Web3] = None
        if self.rpc_url:
            self.web3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 20}))

    def is_configured(self) -> bool:
        return bool(self.web3 and self.private_key)

    def add_transaction(self, data: dict):
        """Keep original simulator method available for backward compatibility."""
        return {"status": "simulated", "data": data}

    def log_transaction_on_chain(self, payload: dict) -> dict:
        if not self.is_configured():
            return {"status": "simulated", "data": payload}

        account = self.web3.eth.account.from_key(self.private_key)
        # Encode payload as bytes. In production, use a contract with structured event.
        message = self.web3.to_json(payload)
        tx = {
            "to": account.address,  # self-send as a cheap log if no contract
            "value": 0,
            "data": message.encode("utf-8"),
            "nonce": self.web3.eth.get_transaction_count(account.address),
            "gas": 200000,
            "maxFeePerGas": self.web3.to_wei("30", "gwei"),
            "maxPriorityFeePerGas": self.web3.to_wei("2", "gwei"),
            "chainId": self.web3.eth.chain_id,
        }
        signed = account.sign_transaction(tx)
        tx_hash = self.web3.eth.send_raw_transaction(signed.rawTransaction)
        receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
        return {"status": "onchain", "tx_hash": tx_hash.hex(), "block": receipt.blockNumber}
# Jasho-backend/app/blockchain/simulator.py
import hashlib, time

class SimpleBlockchain:
    def __init__(self):
        self.chain = []

    def add_transaction(self, data: dict):
        block = {
            "index": len(self.chain) + 1,
            "timestamp": time.time(),
            "data": data,
            "prev_hash": self.chain[-1]["hash"] if self.chain else "0",
        }
        block["hash"] = hashlib.sha256(str(block).encode()).hexdigest()
        self.chain.append(block)
        return block
