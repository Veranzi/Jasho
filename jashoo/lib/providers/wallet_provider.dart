import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

enum Currency { kes, usdt, usd }

class WalletTransaction {
  final String id;
  final String type; // earning, withdrawal, saving, airtime, bill, deposit, convert, transfer
  final double amount;
  final String currencyCode; // KES, USDT, USD
  final DateTime date;
  final String status; // Pending, Success, Failed, Processing
  final String description;
  final String? category; // e.g., Food, Electricity, Internet, Deposit
  final String? method; // e.g., M-PESA, ABSA Bank, Card
  final String? hustle; // which hustle source
  final double? netAmount;
  final Map<String, double>? fees;
  final Map<String, dynamic>? exchangeRate;
  final Map<String, dynamic>? transferInfo;
  final Map<String, dynamic>? blockchain;
  final Map<String, dynamic>? security;

  WalletTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.currencyCode,
    required this.date,
    required this.status,
    required this.description,
    this.category,
    this.method,
    this.hustle,
    this.netAmount,
    this.fees,
    this.exchangeRate,
    this.transferInfo,
    this.blockchain,
    this.security,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['id'],
      type: json['type'],
      amount: (json['amount'] ?? 0).toDouble(),
      currencyCode: json['currencyCode'],
      date: DateTime.parse(json['date']),
      status: json['status'],
      description: json['description'],
      category: json['category'],
      method: json['method'],
      hustle: json['hustle'],
      netAmount: json['netAmount']?.toDouble(),
      fees: json['fees'] != null ? Map<String, double>.from(json['fees']) : null,
      exchangeRate: json['exchangeRate'],
      transferInfo: json['transferInfo'],
      blockchain: json['blockchain'],
      security: json['security'],
    );
  }
}

class WalletBalance {
  final double kesBalance;
  final double usdtBalance;
  final double usdBalance;
  final String? maskedKesBalance;
  final String? maskedUsdtBalance;
  final String? maskedUsdBalance;
  final bool hasPin;
  final bool isPinLocked;
  final bool isFrozen;
  final String status;
  final Map<String, dynamic>? dailyLimits;
  final Map<String, dynamic>? dailyUsage;
  final Map<String, dynamic>? statistics;

  WalletBalance({
    required this.kesBalance,
    required this.usdtBalance,
    required this.usdBalance,
    this.maskedKesBalance,
    this.maskedUsdtBalance,
    this.maskedUsdBalance,
    required this.hasPin,
    required this.isPinLocked,
    required this.isFrozen,
    required this.status,
    this.dailyLimits,
    this.dailyUsage,
    this.statistics,
  });

  factory WalletBalance.fromJson(Map<String, dynamic> json) {
    return WalletBalance(
      kesBalance: (json['kesBalance'] ?? 0).toDouble(),
      usdtBalance: (json['usdtBalance'] ?? 0).toDouble(),
      usdBalance: (json['usdBalance'] ?? 0).toDouble(),
      maskedKesBalance: json['maskedKesBalance'],
      maskedUsdtBalance: json['maskedUsdtBalance'],
      maskedUsdBalance: json['maskedUsdBalance'],
      hasPin: json['hasPin'] ?? false,
      isPinLocked: json['isPinLocked'] ?? false,
      isFrozen: json['isFrozen'] ?? false,
      status: json['status'] ?? 'active',
      dailyLimits: json['dailyLimits'],
      dailyUsage: json['dailyUsage'],
      statistics: json['statistics'],
    );
  }
}

class WalletProvider extends ChangeNotifier {
  WalletBalance? _balance;
  Currency _displayCurrency = Currency.kes;
  final List<WalletTransaction> _transactions = [];
  bool _isLoading = false;
  String? _error;

  WalletBalance? get balance => _balance;
  Currency get displayCurrency => _displayCurrency;
  List<WalletTransaction> get transactions => List.unmodifiable(_transactions);
  bool get hasPin => _balance?.hasPin ?? false;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Get current balance for display currency
  double get currentBalance {
    if (_balance == null) return 0.0;
    
    switch (_displayCurrency) {
      case Currency.kes:
        return _balance!.kesBalance;
      case Currency.usdt:
        return _balance!.usdtBalance;
      case Currency.usd:
        return _balance!.usdBalance;
    }
  }

  // Get masked balance for display currency
  String? get maskedBalance {
    if (_balance == null) return null;
    
    switch (_displayCurrency) {
      case Currency.kes:
        return _balance!.maskedKesBalance;
      case Currency.usdt:
        return _balance!.maskedUsdtBalance;
      case Currency.usd:
        return _balance!.maskedUsdBalance;
    }
  }

  // Load wallet balance from API
  Future<void> loadBalance() async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().getWalletBalance();
      
      if (response['success'] == true) {
        final balanceData = response['data']['balance'];
        _balance = WalletBalance.fromJson(balanceData);
        notifyListeners();
      } else {
        _setError(response['message'] ?? 'Failed to load balance');
      }
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  // Load transaction history
  Future<void> loadTransactions({
    int page = 1,
    int limit = 20,
    String? type,
    String? status,
    String? startDate,
    String? endDate,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().getTransactionHistory(
        page: page,
        limit: limit,
        type: type,
        status: status,
        startDate: startDate,
        endDate: endDate,
      );
      
      if (response['success'] == true) {
        final transactionsData = response['data']['transactions'] as List;
        _transactions.clear();
        _transactions.addAll(
          transactionsData.map((json) => WalletTransaction.fromJson(json))
        );
        notifyListeners();
      } else {
        _setError(response['message'] ?? 'Failed to load transactions');
      }
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  // Set transaction PIN
  Future<bool> setTransactionPin({required String pin}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().setTransactionPin(pin: pin);
      
      if (response['success'] == true) {
        // Reload balance to get updated PIN status
        await loadBalance();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to set PIN');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Verify transaction PIN
  Future<bool> verifyTransactionPin({required String pin}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().verifyTransactionPin(pin: pin);
      
      if (response['success'] == true) {
        return true;
      } else {
        _setError(response['message'] ?? 'Invalid PIN');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Deposit money
  Future<bool> depositKes({
    required double amount,
    String description = 'Deposit',
    String? method,
    String? hustle,
    String category = 'Deposit',
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().deposit(
        amount: amount,
        currencyCode: 'KES',
        description: description,
        method: method,
        hustle: hustle,
        category: category,
      );
      
      if (response['success'] == true) {
        // Reload balance and transactions
        await loadBalance();
        await loadTransactions();
        return true;
      } else {
        _setError(response['message'] ?? 'Deposit failed');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Withdraw money
  Future<bool> withdrawKes({
    required double amount,
    required String pin,
    String category = 'Expense',
    String? method,
    String? hustle,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().withdraw(
        amount: amount,
        pin: pin,
        currencyCode: 'KES',
        category: category,
        method: method,
        hustle: hustle,
      );
      
      if (response['success'] == true) {
        // Reload balance and transactions
        await loadBalance();
        await loadTransactions();
        return true;
      } else {
        _setError(response['message'] ?? 'Withdrawal failed');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Convert currency
  Future<bool> convertKesToUsdt({
    required double kesAmount,
    required double rate,
    required String pin,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().convertCurrency(
        amount: kesAmount,
        pin: pin,
        rate: rate,
        fromCurrency: 'KES',
        toCurrency: 'USDT',
      );
      
      if (response['success'] == true) {
        // Reload balance and transactions
        await loadBalance();
        await loadTransactions();
        return true;
      } else {
        _setError(response['message'] ?? 'Currency conversion failed');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Transfer to another user
  Future<bool> transfer({
    required String recipientUserId,
    required double amount,
    required String pin,
    String currencyCode = 'KES',
    String? description,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().transfer(
        recipientUserId: recipientUserId,
        amount: amount,
        pin: pin,
        currencyCode: currencyCode,
        description: description,
      );
      
      if (response['success'] == true) {
        // Reload balance and transactions
        await loadBalance();
        await loadTransactions();
        return true;
      } else {
        _setError(response['message'] ?? 'Transfer failed');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Toggle display currency
  void toggleCurrency() {
    switch (_displayCurrency) {
      case Currency.kes:
        _displayCurrency = Currency.usdt;
        break;
      case Currency.usdt:
        _displayCurrency = Currency.usd;
        break;
      case Currency.usd:
        _displayCurrency = Currency.kes;
        break;
    }
    notifyListeners();
  }

  // Set display currency
  void setDisplayCurrency(Currency currency) {
    _displayCurrency = currency;
    notifyListeners();
  }

  // Get currency symbol
  String getCurrencySymbol() {
    switch (_displayCurrency) {
      case Currency.kes:
        return 'KES';
      case Currency.usdt:
        return 'USDT';
      case Currency.usd:
        return 'USD';
    }
  }

  // Get currency name
  String getCurrencyName() {
    switch (_displayCurrency) {
      case Currency.kes:
        return 'Kenyan Shilling';
      case Currency.usdt:
        return 'Tether USD';
      case Currency.usd:
        return 'US Dollar';
    }
  }

  // Check if user has sufficient balance
  bool hasSufficientBalance(double amount) {
    return currentBalance >= amount;
  }

  // Get transaction by ID
  WalletTransaction? getTransactionById(String id) {
    try {
      return _transactions.firstWhere((txn) => txn.id == id);
    } catch (e) {
      return null;
    }
  }

  // Get transactions by type
  List<WalletTransaction> getTransactionsByType(String type) {
    return _transactions.where((txn) => txn.type == type).toList();
  }

  // Get transactions by status
  List<WalletTransaction> getTransactionsByStatus(String status) {
    return _transactions.where((txn) => txn.status == status).toList();
  }

  // Get recent transactions (last 10)
  List<WalletTransaction> getRecentTransactions() {
    final sortedTransactions = List<WalletTransaction>.from(_transactions);
    sortedTransactions.sort((a, b) => b.date.compareTo(a.date));
    return sortedTransactions.take(10).toList();
  }

  // Get total earnings
  double getTotalEarnings() {
    return _transactions
        .where((txn) => txn.type == 'earning' && txn.status == 'Success')
        .fold(0.0, (sum, txn) => sum + txn.amount);
  }

  // Get total withdrawals
  double getTotalWithdrawals() {
    return _transactions
        .where((txn) => txn.type == 'withdrawal' && txn.status == 'Success')
        .fold(0.0, (sum, txn) => sum + txn.amount);
  }

  // Get total deposits
  double getTotalDeposits() {
    return _transactions
        .where((txn) => txn.type == 'deposit' && txn.status == 'Success')
        .fold(0.0, (sum, txn) => sum + txn.amount);
  }

  // Private helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }

  // Legacy methods for backward compatibility
  void depositKesLegacy(double amount, {String description = 'Deposit', String? method, String? hustle, String category = 'Deposit'}) {
    // This is kept for backward compatibility but should not be used
    // Use depositKes() instead for real API integration
  }

  void withdrawKesLegacy(double amount, {String category = 'Expense', String? method, String? hustle}) {
    // This is kept for backward compatibility but should not be used
    // Use withdrawKes() instead for real API integration
  }

  void convertKesToUsdtLegacy(double kesAmount, double rate) {
    // This is kept for backward compatibility but should not be used
    // Use convertKesToUsdt() instead for real API integration
  }

  void setPinHash(String hash) {
    // This is kept for backward compatibility but should not be used
    // Use setTransactionPin() instead for real API integration
  }

  bool verifyPinHash(String hash) {
    // This is kept for backward compatibility but should not be used
    // Use verifyTransactionPin() instead for real API integration
    return false;
  }
}