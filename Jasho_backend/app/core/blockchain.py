"""
Blockchain Integration for Jasho Financial App
Implements blockchain-based transaction recording and smart contracts
"""

import os
import json
import hashlib
import time
from typing import Dict, Any, List, Optional, Tuple
from web3 import Web3
from eth_account import Account
from eth_utils import to_checksum_address
import logging
from datetime import datetime, timedelta
import redis
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.serialization import load_pem_private_key

logger = logging.getLogger(__name__)

class BlockchainConfig:
    """Blockchain configuration and constants"""
    
    # Ethereum network configuration
    ETHEREUM_RPC_URL = os.getenv("ETHEREUM_RPC_URL", "https://mainnet.infura.io/v3/YOUR_PROJECT_ID")
    PRIVATE_KEY = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
    CONTRACT_ADDRESS = os.getenv("SMART_CONTRACT_ADDRESS")
    
    # Smart contract ABI (simplified for demo)
    CONTRACT_ABI = [
        {
            "inputs": [
                {"internalType": "address", "name": "from", "type": "address"},
                {"internalType": "address", "name": "to", "type": "address"},
                {"internalType": "uint256", "name": "amount", "type": "uint256"},
                {"internalType": "string", "name": "description", "type": "string"}
            ],
            "name": "recordTransaction",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
            "name": "getTransactionHistory",
            "outputs": [
                {
                    "components": [
                        {"internalType": "address", "name": "from", "type": "address"},
                        {"internalType": "address", "name": "to", "type": "address"},
                        {"internalType": "uint256", "name": "amount", "type": "uint256"},
                        {"internalType": "string", "name": "description", "type": "string"},
                        {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
                    ],
                    "internalType": "struct TransactionRecord[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]

class BlockchainManager:
    """Manages blockchain operations and smart contract interactions"""
    
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(BlockchainConfig.ETHEREUM_RPC_URL))
        self.account = None
        self.contract = None
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=1,
            decode_responses=True
        )
        
        if BlockchainConfig.PRIVATE_KEY:
            self.account = Account.from_key(BlockchainConfig.PRIVATE_KEY)
        
        if BlockchainConfig.CONTRACT_ADDRESS:
            self.contract = self.w3.eth.contract(
                address=to_checksum_address(BlockchainConfig.CONTRACT_ADDRESS),
                abi=BlockchainConfig.CONTRACT_ABI
            )
    
    def is_connected(self) -> bool:
        """Check if blockchain connection is active"""
        try:
            return self.w3.is_connected()
        except Exception as e:
            logger.error(f"Blockchain connection check failed: {str(e)}")
            return False
    
    def record_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Record transaction on blockchain"""
        try:
            if not self.is_connected():
                return self._fallback_record_transaction(transaction_data)
            
            # Prepare transaction data
            from_address = to_checksum_address(transaction_data["from_address"])
            to_address = to_checksum_address(transaction_data["to_address"])
            amount = int(transaction_data["amount"] * 100)  # Convert to smallest unit
            description = transaction_data.get("description", "")
            
            # Build transaction
            transaction = self.contract.functions.recordTransaction(
                from_address,
                to_address,
                amount,
                description
            ).build_transaction({
                'from': self.account.address,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address)
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Store transaction hash in cache
            self._cache_transaction_hash(transaction_data["transaction_id"], tx_hash.hex())
            
            return {
                "success": True,
                "transaction_hash": tx_hash.hex(),
                "block_number": receipt.blockNumber,
                "gas_used": receipt.gasUsed,
                "status": "confirmed"
            }
            
        except Exception as e:
            logger.error(f"Blockchain transaction recording failed: {str(e)}")
            return self._fallback_record_transaction(transaction_data)
    
    def get_transaction_history(self, user_address: str) -> List[Dict[str, Any]]:
        """Get transaction history from blockchain"""
        try:
            if not self.is_connected():
                return self._get_cached_transaction_history(user_address)
            
            # Call smart contract function
            transactions = self.contract.functions.getTransactionHistory(
                to_checksum_address(user_address)
            ).call()
            
            # Format transaction data
            formatted_transactions = []
            for tx in transactions:
                formatted_transactions.append({
                    "from_address": tx[0],
                    "to_address": tx[1],
                    "amount": tx[2] / 100,  # Convert back to main unit
                    "description": tx[3],
                    "timestamp": datetime.fromtimestamp(tx[4]),
                    "blockchain_verified": True
                })
            
            return formatted_transactions
            
        except Exception as e:
            logger.error(f"Failed to get blockchain transaction history: {str(e)}")
            return self._get_cached_transaction_history(user_address)
    
    def verify_transaction(self, transaction_hash: str) -> Dict[str, Any]:
        """Verify transaction on blockchain"""
        try:
            if not self.is_connected():
                return {"verified": False, "error": "Blockchain not connected"}
            
            # Get transaction receipt
            receipt = self.w3.eth.get_transaction_receipt(transaction_hash)
            
            if receipt.status == 1:
                return {
                    "verified": True,
                    "block_number": receipt.blockNumber,
                    "gas_used": receipt.gasUsed,
                    "transaction_hash": transaction_hash
                }
            else:
                return {"verified": False, "error": "Transaction failed"}
                
        except Exception as e:
            logger.error(f"Transaction verification failed: {str(e)}")
            return {"verified": False, "error": str(e)}
    
    def _fallback_record_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback method when blockchain is not available"""
        try:
            # Create a local hash for the transaction
            transaction_id = transaction_data["transaction_id"]
            local_hash = self._create_local_transaction_hash(transaction_data)
            
            # Store in cache
            self._cache_transaction_hash(transaction_id, local_hash)
            
            return {
                "success": True,
                "transaction_hash": local_hash,
                "block_number": None,
                "gas_used": None,
                "status": "pending_blockchain_sync"
            }
            
        except Exception as e:
            logger.error(f"Fallback transaction recording failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _create_local_transaction_hash(self, transaction_data: Dict[str, Any]) -> str:
        """Create a local hash for transaction when blockchain is unavailable"""
        data_string = json.dumps(transaction_data, sort_keys=True)
        return hashlib.sha256(data_string.encode()).hexdigest()
    
    def _cache_transaction_hash(self, transaction_id: str, tx_hash: str):
        """Cache transaction hash for later verification"""
        key = f"tx_hash:{transaction_id}"
        self.redis_client.setex(key, 86400, tx_hash)  # 24 hours
    
    def _get_cached_transaction_history(self, user_address: str) -> List[Dict[str, Any]]:
        """Get cached transaction history when blockchain is unavailable"""
        # This would typically query the database
        return []

class SmartContractManager:
    """Manages smart contract operations and interactions"""
    
    def __init__(self, blockchain_manager: BlockchainManager):
        self.blockchain_manager = blockchain_manager
        self.contract = blockchain_manager.contract
    
    def deploy_contract(self, contract_bytecode: str) -> Dict[str, Any]:
        """Deploy smart contract to blockchain"""
        try:
            if not self.blockchain_manager.is_connected():
                return {"success": False, "error": "Blockchain not connected"}
            
            # Build deployment transaction
            transaction = self.blockchain_manager.w3.eth.contract(
                abi=BlockchainConfig.CONTRACT_ABI,
                bytecode=contract_bytecode
            ).constructor().build_transaction({
                'from': self.blockchain_manager.account.address,
                'gas': 2000000,
                'gasPrice': self.blockchain_manager.w3.eth.gas_price,
                'nonce': self.blockchain_manager.w3.eth.get_transaction_count(
                    self.blockchain_manager.account.address
                )
            })
            
            # Sign and send transaction
            signed_txn = self.blockchain_manager.w3.eth.account.sign_transaction(
                transaction, self.blockchain_manager.account.key
            )
            tx_hash = self.blockchain_manager.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for deployment
            receipt = self.blockchain_manager.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            return {
                "success": True,
                "contract_address": receipt.contractAddress,
                "transaction_hash": tx_hash.hex(),
                "block_number": receipt.blockNumber
            }
            
        except Exception as e:
            logger.error(f"Smart contract deployment failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def execute_contract_function(self, function_name: str, args: List[Any]) -> Dict[str, Any]:
        """Execute smart contract function"""
        try:
            if not self.contract:
                return {"success": False, "error": "Contract not initialized"}
            
            # Get contract function
            contract_function = getattr(self.contract.functions, function_name)
            
            # Build transaction
            transaction = contract_function(*args).build_transaction({
                'from': self.blockchain_manager.account.address,
                'gas': 200000,
                'gasPrice': self.blockchain_manager.w3.eth.gas_price,
                'nonce': self.blockchain_manager.w3.eth.get_transaction_count(
                    self.blockchain_manager.account.address
                )
            })
            
            # Sign and send transaction
            signed_txn = self.blockchain_manager.w3.eth.account.sign_transaction(
                transaction, self.blockchain_manager.account.key
            )
            tx_hash = self.blockchain_manager.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction receipt
            receipt = self.blockchain_manager.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            return {
                "success": True,
                "transaction_hash": tx_hash.hex(),
                "block_number": receipt.blockNumber,
                "gas_used": receipt.gasUsed
            }
            
        except Exception as e:
            logger.error(f"Contract function execution failed: {str(e)}")
            return {"success": False, "error": str(e)}

class TransactionBlockchain:
    """Main class for blockchain transaction management"""
    
    def __init__(self):
        self.blockchain_manager = BlockchainManager()
        self.smart_contract_manager = SmartContractManager(self.blockchain_manager)
    
    def process_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process transaction with blockchain integration"""
        try:
            # Validate transaction data
            if not self._validate_transaction_data(transaction_data):
                return {"success": False, "error": "Invalid transaction data"}
            
            # Record on blockchain
            blockchain_result = self.blockchain_manager.record_transaction(transaction_data)
            
            if blockchain_result["success"]:
                # Update local database
                self._update_local_transaction_record(transaction_data, blockchain_result)
                
                return {
                    "success": True,
                    "transaction_id": transaction_data["transaction_id"],
                    "blockchain_hash": blockchain_result["transaction_hash"],
                    "block_number": blockchain_result.get("block_number"),
                    "status": "confirmed"
                }
            else:
                return {"success": False, "error": "Blockchain recording failed"}
                
        except Exception as e:
            logger.error(f"Transaction processing failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def get_user_transaction_history(self, user_id: str, user_address: str) -> List[Dict[str, Any]]:
        """Get user's transaction history from blockchain"""
        try:
            # Get from blockchain
            blockchain_transactions = self.blockchain_manager.get_transaction_history(user_address)
            
            # Get from local database
            local_transactions = self._get_local_transaction_history(user_id)
            
            # Merge and deduplicate
            all_transactions = self._merge_transaction_histories(blockchain_transactions, local_transactions)
            
            return all_transactions
            
        except Exception as e:
            logger.error(f"Failed to get transaction history: {str(e)}")
            return []
    
    def verify_transaction_integrity(self, transaction_id: str) -> Dict[str, Any]:
        """Verify transaction integrity on blockchain"""
        try:
            # Get transaction hash from cache
            tx_hash = self._get_cached_transaction_hash(transaction_id)
            
            if not tx_hash:
                return {"verified": False, "error": "Transaction hash not found"}
            
            # Verify on blockchain
            verification_result = self.blockchain_manager.verify_transaction(tx_hash)
            
            return verification_result
            
        except Exception as e:
            logger.error(f"Transaction integrity verification failed: {str(e)}")
            return {"verified": False, "error": str(e)}
    
    def _validate_transaction_data(self, transaction_data: Dict[str, Any]) -> bool:
        """Validate transaction data before processing"""
        required_fields = ["transaction_id", "from_address", "to_address", "amount"]
        
        for field in required_fields:
            if field not in transaction_data:
                return False
        
        # Validate amount
        if transaction_data["amount"] <= 0:
            return False
        
        # Validate addresses
        try:
            to_checksum_address(transaction_data["from_address"])
            to_checksum_address(transaction_data["to_address"])
        except:
            return False
        
        return True
    
    def _update_local_transaction_record(self, transaction_data: Dict[str, Any], blockchain_result: Dict[str, Any]):
        """Update local transaction record with blockchain data"""
        # This would typically update the database
        pass
    
    def _get_local_transaction_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Get local transaction history from database"""
        # This would typically query the database
        return []
    
    def _merge_transaction_histories(self, blockchain_txs: List[Dict], local_txs: List[Dict]) -> List[Dict]:
        """Merge blockchain and local transaction histories"""
        # Simple merge - in production, this would be more sophisticated
        all_transactions = blockchain_txs + local_txs
        
        # Sort by timestamp
        all_transactions.sort(key=lambda x: x.get("timestamp", datetime.min), reverse=True)
        
        return all_transactions
    
    def _get_cached_transaction_hash(self, transaction_id: str) -> Optional[str]:
        """Get cached transaction hash"""
        key = f"tx_hash:{transaction_id}"
        return self.blockchain_manager.redis_client.get(key)

# Global blockchain manager instance
blockchain_manager = TransactionBlockchain()
