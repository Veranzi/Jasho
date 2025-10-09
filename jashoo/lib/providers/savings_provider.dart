import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class SavingsGoal {
  final String id;
  String name;
  double target;
  double saved;
  DateTime? dueDate;
  String? hustle; // optional hustle attribution

  SavingsGoal({
    required this.id,
    required this.name,
    required this.target,
    this.saved = 0,
    this.dueDate,
    this.hustle,
  });
}

class LoanRequest {
  final String id;
  double amount;
  String status; // Pending, Approved, Rejected
  LoanRequest({required this.id, required this.amount, this.status = 'Pending'});
}

class SavingsProvider extends ChangeNotifier {
  final List<SavingsGoal> _goals = [];
  final List<LoanRequest> _loans = [];
  int _pointsEarnedFromSavings = 0;
  final Map<String, double> _hustleToSaved = {}; // hustle -> total saved
  bool _isLoading = false;
  String? _error;

  List<SavingsGoal> get goals => List.unmodifiable(_goals);
  List<LoanRequest> get loans => List.unmodifiable(_loans);
  int get pointsEarnedFromSavings => _pointsEarnedFromSavings;
  Map<String, double> get hustleSavings => Map.unmodifiable(_hustleToSaved);
  bool get isLoading => _isLoading;
  String? get error => _error;

  void addGoal(SavingsGoal goal) {
    _goals.add(goal);
    notifyListeners();
  }

  void contribute(String id, double amount) {
    final goal = _goals.firstWhere((g) => g.id == id, orElse: () => throw ArgumentError('Goal not found'));
    goal.saved += amount;
    // Earn points: 1 KES = 1 point (cap to int)
    _pointsEarnedFromSavings += amount.floor();
    if (goal.hustle != null && goal.hustle!.isNotEmpty) {
      _hustleToSaved.update(goal.hustle!, (v) => v + amount, ifAbsent: () => amount);
    }
    notifyListeners();
  }

  void requestLoan(double amount) {
    _loans.add(LoanRequest(id: DateTime.now().millisecondsSinceEpoch.toString(), amount: amount));
    notifyListeners();
  }

  // Backend integration
  Future<void> loadSavingsGoals({int page = 1, int limit = 20}) async {
    _isLoading = true; _error = null; notifyListeners();
    try {
      final resp = await ApiService().getSavingsGoals(page: page, limit: limit);
      if (resp['success'] == true) {
        final List list = resp['data']['goals'] ?? [];
        _goals
          ..clear()
          ..addAll(list.map((e) => SavingsGoal(
                id: e['id'],
                name: e['name'],
                target: (e['target'] ?? 0).toDouble(),
                saved: (e['saved'] ?? 0).toDouble(),
                hustle: e['hustle'],
                dueDate: e['dueDate'] != null ? DateTime.tryParse(e['dueDate']) : null,
              )));
      } else { _error = resp['message'] ?? 'Failed to load goals'; }
    } catch (e) { _error = e.toString(); }
    _isLoading = false; notifyListeners();
  }

  Future<bool> createSavingsGoal({
    required String name,
    required double target,
    DateTime? dueDate,
    String category = 'Personal',
    String? hustle,
  }) async {
    try {
      final resp = await ApiService().createSavingsGoal(
        name: name, target: target, dueDate: dueDate, category: category, hustle: hustle,
      );
      if (resp['success'] == true) {
        await loadSavingsGoals();
        return true;
      }
      _error = resp['message'] ?? 'Failed to create goal';
      return false;
    } catch (e) { _error = e.toString(); return false; }
  }

  Future<bool> contributeToGoal({required String goalId, required double amount, required String pin, String source = 'manual', String? hustle}) async {
    try {
      final resp = await ApiService().contributeToSavingsGoal(
        goalId: goalId, amount: amount, pin: pin, source: source, hustle: hustle,
      );
      if (resp['success'] == true) {
        await loadSavingsGoals();
        return true;
      }
      _error = resp['message'] ?? 'Failed to contribute';
      return false;
    } catch (e) { _error = e.toString(); return false; }
  }

  Future<void> loadLoanRequests({int page = 1, int limit = 20, String? status}) async {
    try {
      final resp = await ApiService().getLoanRequests(page: page, limit: limit, status: status);
      if (resp['success'] == true) {
        final List list = resp['data']['loans'] ?? [];
        _loans
          ..clear()
          ..addAll(list.map((e) => LoanRequest(
                id: e['id'],
                amount: (e['amount'] ?? 0).toDouble(),
                status: e['status'] ?? 'Pending',
              )));
      }
    } catch (_) {}
    notifyListeners();
  }

  Future<bool> requestLoanBackend({required double amount, required String purpose, int termMonths = 12, String? collateral, Map<String, String>? guarantor}) async {
    try {
      final resp = await ApiService().requestLoan(amount: amount, purpose: purpose, termMonths: termMonths, collateral: collateral, guarantor: guarantor);
      if (resp['success'] == true) {
        await loadLoanRequests();
        return true;
      }
      _error = resp['message'] ?? 'Failed to request loan';
      return false;
    } catch (e) { _error = e.toString(); return false; }
  }
}

