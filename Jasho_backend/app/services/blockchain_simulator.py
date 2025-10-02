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
