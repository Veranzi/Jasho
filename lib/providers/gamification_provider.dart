import 'package:flutter/foundation.dart';

class Badge {
  final String id;
  final String name;
  final String description;
  Badge(this.id, this.name, this.description);
}

class GamificationProvider extends ChangeNotifier {
  int _points = 0;
  int _level = 1;
  final List<Badge> _badges = [];
  int _loginStreakDays = 0;

  int get points => _points;
  int get level => _level;
  List<Badge> get badges => List.unmodifiable(_badges);
  int get loginStreakDays => _loginStreakDays;

  void earnPoints(int value) {
    _points += value;
    _checkLevelUps();
    notifyListeners();
  }

  void redeemPoints(int value) {
    if (value <= 0 || value > _points) return;
    _points -= value;
    notifyListeners();
  }

  void recordLogin() {
    _loginStreakDays += 1;
    earnPoints(10); // daily login bonus
  }

  void awardBadge(Badge badge) {
    if (_badges.any((b) => b.id == badge.id)) return;
    _badges.add(badge);
    notifyListeners();
  }

  void _checkLevelUps() {
    // Simple leveling: every 1000 points -> +1 level
    final newLevel = 1 + (_points ~/ 1000);
    if (newLevel != _level) {
      _level = newLevel;
    }
  }
}

