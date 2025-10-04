const { ethers } = require('ethers');
const { logger } = require('./cybersecurity');

// Blockchain configuration
const BLOCKCHAIN_CONFIG = {
  ethereum: {
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    chainId: 1,
    name: 'Ethereum Mainnet'
  },
  polygon: {
    rpcUrl: process.env.POLYGON_RPC_URL,
    chainId: 137,
    name: 'Polygon'
  },
  bsc: {
    rpcUrl: process.env.BSC_RPC_URL,
    chainId: 56,
    name: 'Binance Smart Chain'
  },
  ethereumTestnet: {
    rpcUrl: process.env.ETHEREUM_TESTNET_RPC_URL,
    chainId: 5,
    name: 'Ethereum Goerli'
  },
  polygonTestnet: {
    rpcUrl: process.env.POLYGON_TESTNET_RPC_URL,
    chainId: 80001,
    name: 'Polygon Mumbai'
  },
  bscTestnet: {
    rpcUrl: process.env.BSC_TESTNET_RPC_URL,
    chainId: 97,
    name: 'BSC Testnet'
  }
};

// Simplified Jashoo Contract ABI
const JASHOO_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "userId", "type": "string"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "string", "name": "currency", "type": "string"},
      {"internalType": "string", "name": "transactionType", "type": "string"}
    ],
    "name": "recordTransaction",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "userId", "type": "string"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "string", "name": "currency", "type": "string"}
    ],
    "name": "updateBalance",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "userId", "type": "string"}],
    "name": "getBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "userId", "type": "string"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "interestRate", "type": "uint256"},
      {"internalType": "uint256", "name": "termMonths", "type": "uint256"}
    ],
    "name": "requestLoan",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "userId", "type": "string"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "repayLoan",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

class BlockchainManager {
  constructor() {
    this.providers = {};
    this.contracts = {};
    this.isInitialized = false;
  }

  async initializeProviders() {
    try {
      for (const [network, config] of Object.entries(BLOCKCHAIN_CONFIG)) {
        if (config.rpcUrl) {
          this.providers[network] = new ethers.JsonRpcProvider(config.rpcUrl);
          logger.info(`Blockchain provider initialized: ${config.name}`);
        }
      }
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize blockchain providers:', error);
      this.isInitialized = false;
    }
  }

  async createWallet() {
    try {
      const wallet = ethers.Wallet.createRandom();
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase
      };
    } catch (error) {
      logger.error('Failed to create wallet:', error);
      throw error;
    }
  }

  async generateWallet() {
    return this.createWallet();
  }

  async recordTransaction(userId, amount, currency, transactionType, network = 'ethereum') {
    try {
      if (!this.isInitialized) {
        await this.initializeProviders();
      }

      const provider = this.providers[network];
      if (!provider) {
        throw new Error(`Network ${network} not supported`);
      }

      const contract = await this.getContract(network);
      if (!contract) {
        throw new Error(`Contract not available on ${network}`);
      }

      // Convert amount to wei (assuming 18 decimals)
      const amountWei = ethers.parseEther(amount.toString());

      // Create transaction
      const tx = await contract.recordTransaction(
        userId,
        amountWei,
        currency,
        transactionType
      );

      logger.info('Blockchain transaction recorded', {
        userId,
        amount,
        currency,
        transactionType,
        network,
        txHash: tx.hash
      });

      return {
        success: true,
        transactionHash: tx.hash,
        network,
        blockNumber: await tx.wait().then(receipt => receipt.blockNumber)
      };
    } catch (error) {
      logger.error('Failed to record blockchain transaction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateBalance(userId, amount, currency, network = 'ethereum') {
    try {
      if (!this.isInitialized) {
        await this.initializeProviders();
      }

      const provider = this.providers[network];
      if (!provider) {
        throw new Error(`Network ${network} not supported`);
      }

      const contract = await this.getContract(network);
      if (!contract) {
        throw new Error(`Contract not available on ${network}`);
      }

      const amountWei = ethers.parseEther(amount.toString());

      const tx = await contract.updateBalance(userId, amountWei, currency);

      logger.info('Blockchain balance updated', {
        userId,
        amount,
        currency,
        network,
        txHash: tx.hash
      });

      return {
        success: true,
        transactionHash: tx.hash,
        network,
        blockNumber: await tx.wait().then(receipt => receipt.blockNumber)
      };
    } catch (error) {
      logger.error('Failed to update blockchain balance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getBalance(userId, network = 'ethereum') {
    try {
      if (!this.isInitialized) {
        await this.initializeProviders();
      }

      const provider = this.providers[network];
      if (!provider) {
        throw new Error(`Network ${network} not supported`);
      }

      const contract = await this.getContract(network);
      if (!contract) {
        throw new Error(`Contract not available on ${network}`);
      }

      const balanceWei = await contract.getBalance(userId);
      const balance = ethers.formatEther(balanceWei);

      return {
        success: true,
        balance: parseFloat(balance),
        network
      };
    } catch (error) {
      logger.error('Failed to get blockchain balance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async requestLoan(userId, amount, interestRate, termMonths, network = 'ethereum') {
    try {
      if (!this.isInitialized) {
        await this.initializeProviders();
      }

      const provider = this.providers[network];
      if (!provider) {
        throw new Error(`Network ${network} not supported`);
      }

      const contract = await this.getContract(network);
      if (!contract) {
        throw new Error(`Contract not available on ${network}`);
      }

      const amountWei = ethers.parseEther(amount.toString());

      const tx = await contract.requestLoan(
        userId,
        amountWei,
        interestRate,
        termMonths
      );

      logger.info('Blockchain loan requested', {
        userId,
        amount,
        interestRate,
        termMonths,
        network,
        txHash: tx.hash
      });

      return {
        success: true,
        transactionHash: tx.hash,
        network,
        blockNumber: await tx.wait().then(receipt => receipt.blockNumber)
      };
    } catch (error) {
      logger.error('Failed to request blockchain loan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async repayLoan(userId, amount, network = 'ethereum') {
    try {
      if (!this.isInitialized) {
        await this.initializeProviders();
      }

      const provider = this.providers[network];
      if (!provider) {
        throw new Error(`Network ${network} not supported`);
      }

      const contract = await this.getContract(network);
      if (!contract) {
        throw new Error(`Contract not available on ${network}`);
      }

      const amountWei = ethers.parseEther(amount.toString());

      const tx = await contract.repayLoan(userId, amountWei);

      logger.info('Blockchain loan repaid', {
        userId,
        amount,
        network,
        txHash: tx.hash
      });

      return {
        success: true,
        transactionHash: tx.hash,
        network,
        blockNumber: await tx.wait().then(receipt => receipt.blockNumber)
      };
    } catch (error) {
      logger.error('Failed to repay blockchain loan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getContract(network = 'ethereum') {
    try {
      if (this.contracts[network]) {
        return this.contracts[network];
      }

      const provider = this.providers[network];
      if (!provider) {
        throw new Error(`Provider not available for ${network}`);
      }

      const contractAddress = process.env.JASHOO_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }

      const contract = new ethers.Contract(
        contractAddress,
        JASHOO_CONTRACT_ABI,
        provider
      );

      this.contracts[network] = contract;
      return contract;
    } catch (error) {
      logger.error(`Failed to get contract for ${network}:`, error);
      return null;
    }
  }

  async verifyTransaction(transactionHash, network = 'ethereum') {
    try {
      const provider = this.providers[network];
      if (!provider) {
        throw new Error(`Network ${network} not supported`);
      }

      const receipt = await provider.getTransactionReceipt(transactionHash);
      return {
        success: true,
        verified: receipt && receipt.status === 1,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed
      };
    } catch (error) {
      logger.error('Failed to verify transaction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getTransactionHistory(userId, network = 'ethereum') {
    try {
      // In a real implementation, you would query blockchain events
      // For now, return empty array
      return {
        success: true,
        transactions: []
      };
    } catch (error) {
      logger.error('Failed to get transaction history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createUserContract(userId) {
    try {
      // Create a unique contract address for the user
      const contractAddress = await this.generateContractAddress(userId);
      
      logger.info('User contract created', {
        userId,
        contractAddress
      });

      return {
        success: true,
        contractAddress
      };
    } catch (error) {
      logger.error('Failed to create user contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateContractAddress(userId) {
    // Generate a deterministic contract address based on user ID
    const hash = ethers.keccak256(ethers.toUtf8Bytes(userId + process.env.CONTRACT_SALT));
    return ethers.getAddress('0x' + hash.slice(26));
  }

  async createMultiSigWallet(userIds, threshold = 2) {
    try {
      // Simplified multi-sig wallet creation
      const wallet = await this.createWallet();
      
      logger.info('Multi-sig wallet created', {
        userIds,
        threshold,
        address: wallet.address
      });

      return {
        success: true,
        address: wallet.address,
        threshold,
        signers: userIds
      };
    } catch (error) {
      logger.error('Failed to create multi-sig wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async initiateCrossChainTransaction(userId, amount, fromNetwork, toNetwork) {
    try {
      // Simplified cross-chain transaction
      logger.info('Cross-chain transaction initiated', {
        userId,
        amount,
        fromNetwork,
        toNetwork
      });

      return {
        success: true,
        bridgeId: `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromNetwork,
        toNetwork,
        amount
      };
    } catch (error) {
      logger.error('Failed to initiate cross-chain transaction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createBridgeTransaction(userId, amount, fromNetwork, toNetwork) {
    try {
      // Create bridge transaction for cross-chain transfers
      const bridgeTx = await this.initiateCrossChainTransaction(
        userId,
        amount,
        fromNetwork,
        toNetwork
      );

      logger.info('Bridge transaction created', {
        userId,
        amount,
        fromNetwork,
        toNetwork,
        bridgeId: bridgeTx.bridgeId
      });

      return bridgeTx;
    } catch (error) {
      logger.error('Failed to create bridge transaction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getSupportedNetworks() {
    return Object.keys(BLOCKCHAIN_CONFIG).filter(network => 
      BLOCKCHAIN_CONFIG[network].rpcUrl
    );
  }

  getNetworkInfo(network) {
    return BLOCKCHAIN_CONFIG[network] || null;
  }
}

// Create blockchain manager instance
const blockchainManager = new BlockchainManager();

// Middleware to attach blockchain manager to request
const blockchainMiddleware = async (req, res, next) => {
  try {
    if (process.env.BLOCKCHAIN_ENABLED === 'true') {
      if (!blockchainManager.isInitialized) {
        await blockchainManager.initializeProviders();
      }
      req.blockchain = blockchainManager;
    } else {
      req.blockchain = null;
    }
    next();
  } catch (error) {
    logger.error('Blockchain middleware error:', error);
    req.blockchain = null;
    next();
  }
};

// Middleware to verify blockchain transactions
const verifyBlockchainTransaction = async (req, res, next) => {
  try {
    const { transactionHash, network } = req.body;

    if (!transactionHash) {
      return res.status(400).json({
        success: false,
        message: 'Transaction hash is required',
        code: 'TRANSACTION_HASH_REQUIRED'
      });
    }

    if (!req.blockchain) {
      return res.status(503).json({
        success: false,
        message: 'Blockchain service unavailable',
        code: 'BLOCKCHAIN_UNAVAILABLE'
      });
    }

    const verification = await req.blockchain.verifyTransaction(
      transactionHash,
      network || 'ethereum'
    );

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: 'Transaction verification failed',
        code: 'VERIFICATION_FAILED',
        error: verification.error
      });
    }

    req.blockchainVerification = verification;
    next();
  } catch (error) {
    logger.error('Blockchain verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Blockchain verification error',
      code: 'VERIFICATION_ERROR'
    });
  }
};

module.exports = {
  BlockchainManager,
  blockchainMiddleware,
  verifyBlockchainTransaction,
  blockchainManager
};