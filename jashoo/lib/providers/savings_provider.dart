import 'package:flutter/foundation.dart';

class SavingsGoal {
  final String id;
  String name;
  double target;
  double saved;
  DateTime? dueDate;

  SavingsGoal({
    required this.id,
    required this.name,
    required this.target,
    this.saved = 0,
    this.dueDate,
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

  List<SavingsGoal> get goals => List.unmodifiable(_goals);
  List<LoanRequest> get loans => List.unmodifiable(_loans);
  int get pointsEarnedFromSavings => _pointsEarnedFromSavings;

  void addGoal(SavingsGoal goal) {
    _goals.add(goal);
    notifyListeners();
  }

  void contribute(String id, double amount) {
    final goal = _goals.firstWhere((g) => g.id == id, orElse: () => throw ArgumentError('Goal not found'));
    goal.saved += amount;
    // Earn points: 1 KES = 1 point (cap to int)
    _pointsEarnedFromSavings += amount.floor();
    notifyListeners();
  }

  void requestLoan(double amount) {
    _loans.add(LoanRequest(id: DateTime.now().millisecondsSinceEpoch.toString(), amount: amount));
    notifyListeners();
  }
}

