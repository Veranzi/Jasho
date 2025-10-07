import 'package:flutter/foundation.dart';

class PinProvider extends ChangeNotifier {
  String? _pinHash;
  String? get lastPin => _pinHash;

  bool get hasPin => _pinHash != null;

  void setPinHash(String hash) {
    _pinHash = hash;
    notifyListeners();
  }

  bool verify(String hash) => _pinHash != null && _pinHash == hash;
}

