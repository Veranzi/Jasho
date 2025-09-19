import 'package:flutter/foundation.dart';

class LocaleProvider extends ChangeNotifier {
  String _languageCode = 'en';
  String get languageCode => _languageCode;

  void setLanguage(String code) {
    if (_languageCode == code) return;
    _languageCode = code;
    notifyListeners();
  }
}

