import 'package:flutter/foundation.dart';

class AuthProvider extends ChangeNotifier {
  String? _userId;
  bool get isLoggedIn => _userId != null;

  void login(String id) {
    _userId = id;
    notifyListeners();
  }

  void logout() {
    _userId = null;
    notifyListeners();
  }
}
