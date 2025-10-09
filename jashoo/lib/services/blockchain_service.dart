import 'dart:convert';
import 'dart:math';
import 'package:web3dart/web3dart.dart';
import 'package:bip39/bip39.dart' as bip39;
import 'package:crypto/crypto.dart';

class BlockchainService {
  static final BlockchainService _instance = BlockchainService._internal();
  factory BlockchainService() => _instance;
  BlockchainService._internal();

  late Web3Client _client;
  late Credentials _credentials;
  late EthereumAddress _contractAddress;
  late DeployedContract _contract;

  // Initialize blockchain connection
  Future<void> initialize() async {
    try {
      // Connect to Ethereum network (you can use testnet for development)
      _client = Web3Client(
        'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Replace with your Infura project ID
        Client(),
      );

      // Load or create wallet
      await _loadOrCreateWallet();

      // Load smart contract
      await _loadSmartContract();
    } catch (e) {
      throw Exception('Blockchain initialization failed: $e');
    }
  }

  // Wallet Management
  Future<void> _loadOrCreateWallet() async {
    try {
      // In a real app, you'd store the private key securely
      // For demo purposes, we'll generate a new wallet
      final mnemonic = bip39.generateMnemonic();
      final seed = bip39.mnemonicToSeed(mnemonic);
      final hdWallet = HDWallet.fromSeed(seed);
      
      _credentials = hdWallet.derivePath("m/44'/60'/0'/0/0");
    } catch (e) {
      throw Exception('Wallet creation failed: $e');
    }
  }

  String getWalletAddress() {
    return _credentials.address.hex;
  }

  // Smart Contract Operations
  Future<void> _loadSmartContract() async {
    try {
      // Contract ABI (Application Binary Interface)
      final contractABI = jsonEncode([
        {
          "inputs": [
            {"name": "userId", "type": "string"},
            {"name": "transactionId", "type": "string"},
            {"name": "amount", "type": "uint256"},
            {"name": "timestamp", "type": "uint256"}
          ],
          "name": "recordTransaction",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{"name": "userId", "type": "string"}],
          "name": "getUserTransactions",
          "outputs": [
            {
              "components": [
                {"name": "transactionId", "type": "string"},
                {"name": "amount", "type": "uint256"},
                {"name": "timestamp", "type": "uint256"}
              ],
              "name": "",
              "type": "tuple[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ]);

      // Contract address (replace with your deployed contract address)
      _contractAddress = EthereumAddress.fromHex('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
      
      _contract = DeployedContract(
        ContractAbi.fromJson(contractABI, 'HustleOSContract'),
        _contractAddress,
      );
    } catch (e) {
      throw Exception('Smart contract loading failed: $e');
    }
  }

  // Record Transaction on Blockchain
  Future<String> recordTransaction({
    required String userId,
    required String transactionId,
    required double amount,
    required DateTime timestamp,
  }) async {
    try {
      final function = _contract.function('recordTransaction');
      
      final transaction = Transaction.callContract(
        contract: _contract,
        function: function,
        parameters: [
          userId,
          transactionId,
          BigInt.from((amount * 100).round()), // Convert to wei (assuming 2 decimal places)
          BigInt.from(timestamp.millisecondsSinceEpoch ~/ 1000), // Convert to seconds
        ],
      );

      final txHash = await _client.sendTransaction(
        _credentials,
        transaction,
        chainId: 1, // Ethereum mainnet
      );

      return txHash;
    } catch (e) {
      throw Exception('Transaction recording failed: $e');
    }
  }

  // Get User Transactions from Blockchain
  Future<List<BlockchainTransaction>> getUserTransactions(String userId) async {
    try {
      final function = _contract.function('getUserTransactions');
      
      final result = await _client.call(
        contract: _contract,
        function: function,
        params: [userId],
      );

      final transactions = <BlockchainTransaction>[];
      final transactionList = result.first as List;

      for (final tx in transactionList) {
        final txData = tx as List;
        transactions.add(BlockchainTransaction(
          transactionId: txData[0] as String,
          amount: (txData[1] as BigInt).toDouble() / 100, // Convert from wei
          timestamp: DateTime.fromMillisecondsSinceEpoch(
            (txData[2] as BigInt).toInt() * 1000,
          ),
        ));
      }

      return transactions;
    } catch (e) {
      throw Exception('Failed to fetch transactions: $e');
    }
  }

  // Verify Transaction Integrity
  Future<bool> verifyTransaction({
    required String transactionId,
    required String userId,
    required double amount,
    required DateTime timestamp,
  }) async {
    try {
      final blockchainTransactions = await getUserTransactions(userId);
      
      final matchingTransaction = blockchainTransactions.firstWhere(
        (tx) => tx.transactionId == transactionId,
        orElse: () => throw Exception('Transaction not found'),
      );

      // Verify amount and timestamp
      final amountMatches = (matchingTransaction.amount - amount).abs() < 0.01;
      final timestampMatches = matchingTransaction.timestamp.difference(timestamp).inSeconds.abs() < 60;

      return amountMatches && timestampMatches;
    } catch (e) {
      return false;
    }
  }

  // Generate Transaction Hash
  String generateTransactionHash({
    required String userId,
    required String transactionId,
    required double amount,
    required DateTime timestamp,
    required String previousHash,
  }) {
    final data = '$userId$transactionId$amount${timestamp.millisecondsSinceEpoch}$previousHash';
    final bytes = utf8.encode(data);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  // Create Merkle Tree for Transaction Verification
  List<String> createMerkleTree(List<String> transactionHashes) {
    if (transactionHashes.isEmpty) return [];
    if (transactionHashes.length == 1) return transactionHashes;

    final List<String> currentLevel = List.from(transactionHashes);
    final List<String> nextLevel = [];

    while (currentLevel.length > 1) {
      for (int i = 0; i < currentLevel.length; i += 2) {
        final left = currentLevel[i];
        final right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        
        final combined = left + right;
        final bytes = utf8.encode(combined);
        final digest = sha256.convert(bytes);
        nextLevel.add(digest.toString());
      }
      
      currentLevel.clear();
      currentLevel.addAll(nextLevel);
      nextLevel.clear();
    }

    return currentLevel;
  }

  // Verify Merkle Proof
  bool verifyMerkleProof({
    required String transactionHash,
    required String merkleRoot,
    required List<String> merklePath,
    required List<int> pathIndices,
  }) {
    String currentHash = transactionHash;

    for (int i = 0; i < merklePath.length; i++) {
      final sibling = merklePath[i];
      final isLeft = pathIndices[i] == 0;

      final combined = isLeft ? currentHash + sibling : sibling + currentHash;
      final bytes = utf8.encode(combined);
      final digest = sha256.convert(bytes);
      currentHash = digest.toString();
    }

    return currentHash == merkleRoot;
  }

  // Get Account Balance
  Future<double> getAccountBalance() async {
    try {
      final balance = await _client.getBalance(_credentials.address);
      return balance.getInWei.toDouble() / 1e18; // Convert from wei to ETH
    } catch (e) {
      throw Exception('Failed to get account balance: $e');
    }
  }

  // Estimate Gas for Transaction
  Future<BigInt> estimateGas({
    required String userId,
    required String transactionId,
    required double amount,
    required DateTime timestamp,
  }) async {
    try {
      final function = _contract.function('recordTransaction');
      
      final transaction = Transaction.callContract(
        contract: _contract,
        function: function,
        parameters: [
          userId,
          transactionId,
          BigInt.from((amount * 100).round()),
          BigInt.from(timestamp.millisecondsSinceEpoch ~/ 1000),
        ],
      );

      return await _client.estimateGas(
        sender: _credentials.address,
        to: _contractAddress,
        data: transaction.data,
      );
    } catch (e) {
      throw Exception('Gas estimation failed: $e');
    }
  }

  // Get Current Gas Price
  Future<double> getCurrentGasPrice() async {
    try {
      final gasPrice = await _client.getGasPrice();
      return gasPrice.getInWei.toDouble() / 1e18; // Convert from wei to ETH
    } catch (e) {
      throw Exception('Failed to get gas price: $e');
    }
  }

  // Batch Transaction Recording
  Future<List<String>> recordBatchTransactions({
    required String userId,
    required List<Map<String, dynamic>> transactions,
  }) async {
    final txHashes = <String>[];
    
    for (final tx in transactions) {
      try {
        final txHash = await recordTransaction(
          userId: userId,
          transactionId: tx['transactionId'],
          amount: tx['amount'],
          timestamp: tx['timestamp'],
        );
        txHashes.add(txHash);
      } catch (e) {
        // Log error but continue with other transactions
        print('Failed to record transaction ${tx['transactionId']}: $e');
      }
    }
    
    return txHashes;
  }

  // Get Transaction Receipt
  Future<TransactionReceipt?> getTransactionReceipt(String txHash) async {
    try {
      return await _client.getTransactionReceipt(txHash);
    } catch (e) {
      return null;
    }
  }

  // Check Transaction Status
  Future<TransactionStatus> getTransactionStatus(String txHash) async {
    try {
      final receipt = await getTransactionReceipt(txHash);
      
      if (receipt == null) {
        return TransactionStatus.pending;
      }
      
      if (receipt.status == true) {
        return TransactionStatus.confirmed;
      } else {
        return TransactionStatus.failed;
      }
    } catch (e) {
      return TransactionStatus.unknown;
    }
  }

  // Cleanup
  Future<void> dispose() async {
    await _client.dispose();
  }
}

// Data classes
class BlockchainTransaction {
  final String transactionId;
  final double amount;
  final DateTime timestamp;

  BlockchainTransaction({
    required this.transactionId,
    required this.amount,
    required this.timestamp,
  });
}

enum TransactionStatus {
  pending,
  confirmed,
  failed,
  unknown,
}

// HD Wallet implementation for key derivation
class HDWallet {
  final Uint8List seed;
  
  HDWallet.fromSeed(this.seed);
  
  Credentials derivePath(String path) {
    // Simplified HD wallet implementation
    // In production, use a proper HD wallet library
    final hash = sha256.convert(seed).bytes;
    return EthPrivateKey(hash);
  }
}
