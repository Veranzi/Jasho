import 'package:flutter/foundation.dart';

enum Currency { kes, usdt }

class WalletTransaction {
  final String id;
  final String type; // earning, withdrawal, saving, airtime, bill
  final double amount;
  final String currencyCode; // KES or USDT
  final DateTime date;
  final String status; // Pending, Success, Failed
  final String description;

  WalletTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.currencyCode,
    required this.date,
    required this.status,
    required this.description,
  });
}

class WalletProvider extends ChangeNotifier {
  double _kesBalance = 12500;
  double _usdtBalance = 100; // demo
  Currency _displayCurrency = Currency.kes;
  final List<WalletTransaction> _transactions = [];
  String? _transactionPinHash; // mock hashed PIN

  double get kesBalance => _kesBalance;
  double get usdtBalance => _usdtBalance;
  Currency get displayCurrency => _displayCurrency;
  List<WalletTransaction> get transactions => List.unmodifiable(_transactions);
  bool get hasPin => _transactionPinHash != null;

  void toggleCurrency() {
    _displayCurrency = _displayCurrency == Currency.kes ? Currency.usdt : Currency.kes;
    notifyListeners();
  }

  void depositKes(double amount, {String description = 'Deposit'}) {
    _kesBalance += amount;
    _transactions.add(WalletTransaction(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      type: 'deposit',
      amount: amount,
      currencyCode: 'KES',
      date: DateTime.now(),
      status: 'Success',
      description: description,
    ));
    notifyListeners();
  }

  void withdrawKes(double amount) {
    if (amount <= 0 || amount > _kesBalance) return;
    _kesBalance -= amount;
    _transactions.add(WalletTransaction(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      type: 'withdrawal',
      amount: amount,
      currencyCode: 'KES',
      date: DateTime.now(),
      status: 'Success',
      description: 'Withdraw to M-PESA',
    ));
    notifyListeners();
  }

  void convertKesToUsdt(double kesAmount, double rate) {
    if (kesAmount <= 0 || kesAmount > _kesBalance) return;
    final usdt = kesAmount / rate;
    _kesBalance -= kesAmount;
    _usdtBalance += usdt;
    _transactions.add(WalletTransaction(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      type: 'convert',
      amount: kesAmount,
      currencyCode: 'KES',
      date: DateTime.now(),
      status: 'Success',
      description: 'Convert KES to USDT',
    ));
    notifyListeners();
  }

  void setPinHash(String hash) {
    _transactionPinHash = hash;
    notifyListeners();
  }

  bool verifyPinHash(String hash) {
    return _transactionPinHash != null && _transactionPinHash == hash;
  }
}

