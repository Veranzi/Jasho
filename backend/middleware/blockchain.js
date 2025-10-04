const { ethers } = require('ethers');
const Web3 = require('web3');
const crypto = require('crypto');

// Blockchain configuration
const BLOCKCHAIN_CONFIG = {
  // Ethereum mainnet (for production)
  ethereum: {
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    chainId: 1,
    gasLimit: 21000,
    gasPrice: '20000000000' // 20 gwei
  },
  // Polygon (for lower fees)
  polygon: {
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    chainId: 137,
    gasLimit: 21000,
    gasPrice: '30000000000' // 30 gwei
  },
  // Binance Smart Chain
  bsc: {
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    chainId: 56,
    gasLimit: 21000,
    gasPrice: '5000000000' // 5 gwei
  }
};

// Smart contract ABI for Jashoo transactions
const JASHOO_CONTRACT_ABI = [
  {
    "inputs": [
      {"name": "from", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "currency", "type": "string"},
      {"name": "transactionType", "type": "string"},
      {"name": "metadata", "type": "string"}
    ],
    "name": "recordTransaction",
    "outputs": [{"name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "userId", "type": "string"},
      {"name": "amount", "type": "uint256"},
      {"name": "currency", "type": "string"}
    ],
    "name": "updateBalance",
    "outputs": [{"name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "userId", "type": "string"}
    ],
    "name": "getBalance",
    "outputs": [
      {"name": "kesBalance", "type": "uint256"},
      {"name": "usdtBalance", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "userId", "type": "string"},
      {"name": "amount", "type": "uint256"},
      {"name": "purpose", "type": "string"}
    ],
    "name": "requestLoan",
    "outputs": [
      {"name": "loanId", "type": "uint256"},
      {"name": "success", "type": "bool"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "loanId", "type": "uint256"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "repayLoan",
    "outputs": [{"name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

class BlockchainManager {
  constructor() {
    this.providers = {};
    this.contracts = {};
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize providers for different networks
    Object.keys(BLOCKCHAIN_CONFIG).forEach(network => {
      const config = BLOCKCHAIN_CONFIG[network];
      this.providers[network] = new ethers.JsonRpcProvider(config.rpcUrl);
    });
  }

  // Create wallet from private key or mnemonic
  createWallet(privateKeyOrMnemonic, network = 'ethereum') {
    try {
      let wallet;
      
      if (privateKeyOrMnemonic.startsWith('0x')) {
        // Private key
        wallet = new ethers.Wallet(privateKeyOrMnemonic, this.providers[network]);
      } else {
        // Mnemonic
        wallet = ethers.Wallet.fromPhrase(privateKeyOrMnemonic, this.providers[network]);
      }
      
      return wallet;
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  // Generate new wallet
  generateWallet(network = 'ethereum') {
    const wallet = ethers.Wallet.createRandom();
    const connectedWallet = wallet.connect(this.providers[network]);
    
    return {
      address: connectedWallet.address,
      privateKey: connectedWallet.privateKey,
      mnemonic: wallet.mnemonic.phrase,
      network
    };
  }

  // Record transaction on blockchain
  async recordTransaction(transactionData) {
    try {
      const {
        fromUserId,
        toUserId,
        amount,
        currency,
        transactionType,
        metadata,
        network = 'ethereum'
      } = transactionData;

      // Get contract instance
      const contract = await this.getContract(network);
      
      // Prepare transaction data
      const txData = {
        from: fromUserId,
        to: toUserId,
        amount: ethers.parseEther(amount.toString()),
        currency,
        transactionType,
        metadata: JSON.stringify(metadata)
      };

      // Estimate gas
      const gasEstimate = await contract.recordTransaction.estimateGas(
        txData.from,
        txData.to,
        txData.amount,
        txData.currency,
        txData.transactionType,
        txData.metadata
      );

      // Execute transaction
      const tx = await contract.recordTransaction(
        txData.from,
        txData.to,
        txData.amount,
        txData.currency,
        txData.transactionType,
        txData.metadata,
        { gasLimit: gasEstimate }
      );

      // Wait for confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        network
      };
    } catch (error) {
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  // Update balance on blockchain
  async updateBalance(userId, amount, currency, network = 'ethereum') {
    try {
      const contract = await this.getContract(network);
      
      const tx = await contract.updateBalance(
        userId,
        ethers.parseEther(amount.toString()),
        currency
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        network
      };
    } catch (error) {
      throw new Error(`Balance update failed: ${error.message}`);
    }
  }

  // Get balance from blockchain
  async getBalance(userId, network = 'ethereum') {
    try {
      const contract = await this.getContract(network);
      
      const [kesBalance, usdtBalance] = await contract.getBalance(userId);

      return {
        kesBalance: ethers.formatEther(kesBalance),
        usdtBalance: ethers.formatEther(usdtBalance),
        network
      };
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  // Request loan on blockchain
  async requestLoan(userId, amount, purpose, network = 'ethereum') {
    try {
      const contract = await this.getContract(network);
      
      const tx = await contract.requestLoan(
        userId,
        ethers.parseEther(amount.toString()),
        purpose
      );

      const receipt = await tx.wait();

      // Extract loan ID from transaction logs
      const loanId = receipt.logs[0]?.topics[1];

      return {
        success: true,
        loanId: loanId ? parseInt(loanId, 16) : null,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        network
      };
    } catch (error) {
      throw new Error(`Loan request failed: ${error.message}`);
    }
  }

  // Repay loan on blockchain
  async repayLoan(loanId, amount, network = 'ethereum') {
    try {
      const contract = await this.getContract(network);
      
      const tx = await contract.repayLoan(
        loanId,
        ethers.parseEther(amount.toString())
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        network
      };
    } catch (error) {
      throw new Error(`Loan repayment failed: ${error.message}`);
    }
  }

  // Get contract instance
  async getContract(network = 'ethereum') {
    if (!this.contracts[network]) {
      const config = BLOCKCHAIN_CONFIG[network];
      const provider = this.providers[network];
      
      this.contracts[network] = new ethers.Contract(
        process.env.JASHOO_CONTRACT_ADDRESS,
        JASHOO_CONTRACT_ABI,
        provider
      );
    }

    return this.contracts[network];
  }

  // Verify transaction on blockchain
  async verifyTransaction(transactionHash, network = 'ethereum') {
    try {
      const provider = this.providers[network];
      const tx = await provider.getTransaction(transactionHash);
      
      if (!tx) {
        return { verified: false, reason: 'Transaction not found' };
      }

      const receipt = await provider.getTransactionReceipt(transactionHash);
      
      return {
        verified: receipt.status === 1,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        network
      };
    } catch (error) {
      return { verified: false, reason: error.message };
    }
  }

  // Get transaction history from blockchain
  async getTransactionHistory(userId, network = 'ethereum', fromBlock = 0) {
    try {
      const contract = await this.getContract(network);
      
      // Get Transfer events
      const filter = contract.filters.Transfer(userId);
      const events = await contract.queryFilter(filter, fromBlock);

      return events.map(event => ({
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        from: event.args.from,
        to: event.args.to,
        amount: ethers.formatEther(event.args.amount),
        timestamp: new Date()
      }));
    } catch (error) {
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  // Create smart contract for new user
  async createUserContract(userId, initialBalance = 0) {
    try {
      // This would typically be done through a factory contract
      // For now, we'll simulate the creation
      const contractAddress = this.generateContractAddress(userId);
      
      return {
        success: true,
        contractAddress,
        userId,
        initialBalance
      };
    } catch (error) {
      throw new Error(`Failed to create user contract: ${error.message}`);
    }
  }

  // Generate deterministic contract address
  generateContractAddress(userId) {
    const hash = crypto.createHash('sha256')
      .update(`${userId}-${process.env.CONTRACT_SALT}`)
      .digest('hex');
    
    return `0x${hash.substring(0, 40)}`;
  }

  // Multi-signature wallet support
  async createMultiSigWallet(owners, threshold, network = 'ethereum') {
    try {
      // This would integrate with Gnosis Safe or similar
      // For now, we'll simulate the creation
      const multiSigAddress = this.generateContractAddress(`multisig-${owners.join('-')}`);
      
      return {
        success: true,
        multiSigAddress,
        owners,
        threshold,
        network
      };
    } catch (error) {
      throw new Error(`Failed to create multi-sig wallet: ${error.message}`);
    }
  }

  // Cross-chain transaction support
  async initiateCrossChainTransaction(transactionData) {
    try {
      const {
        fromNetwork,
        toNetwork,
        amount,
        currency,
        recipientAddress
      } = transactionData;

      // This would integrate with cross-chain bridges like Polygon Bridge
      // For now, we'll simulate the process
      const bridgeTx = await this.createBridgeTransaction(
        fromNetwork,
        toNetwork,
        amount,
        currency,
        recipientAddress
      );

      return {
        success: true,
        bridgeTransaction: bridgeTx,
        estimatedTime: '10-30 minutes',
        networks: [fromNetwork, toNetwork]
      };
    } catch (error) {
      throw new Error(`Cross-chain transaction failed: ${error.message}`);
    }
  }

  // Simulate bridge transaction
  async createBridgeTransaction(fromNetwork, toNetwork, amount, currency, recipientAddress) {
    return {
      bridgeId: crypto.randomUUID(),
      fromNetwork,
      toNetwork,
      amount,
      currency,
      recipientAddress,
      status: 'pending',
      createdAt: new Date()
    };
  }
}

// Blockchain middleware for Express
const blockchainMiddleware = (req, res, next) => {
  req.blockchain = new BlockchainManager();
  next();
};

// Transaction verification middleware
const verifyBlockchainTransaction = async (req, res, next) => {
  try {
    const { transactionHash, network } = req.body;
    
    if (!transactionHash) {
      return res.status(400).json({
        success: false,
        message: 'Transaction hash is required'
      });
    }

    const verification = await req.blockchain.verifyTransaction(transactionHash, network);
    
    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: 'Transaction verification failed',
        reason: verification.reason
      });
    }

    req.blockchainVerification = verification;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Blockchain verification error',
      error: error.message
    });
  }
};

module.exports = {
  BlockchainManager,
  blockchainMiddleware,
  verifyBlockchainTransaction,
  BLOCKCHAIN_CONFIG,
  JASHOO_CONTRACT_ABI
};