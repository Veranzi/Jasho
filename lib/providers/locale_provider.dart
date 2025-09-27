import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleProvider extends ChangeNotifier {
  String _languageCode = 'en';
  String get languageCode => _languageCode;

  LocaleProvider() {
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString('languageCode');
      if (saved != null && saved.isNotEmpty && saved != _languageCode) {
        _languageCode = saved;
        notifyListeners();
      }
    } catch (_) {
      // ignore read errors; default to 'en'
    }
  }

  Future<void> setLanguage(String code) async {
    if (_languageCode == code) return;
    _languageCode = code;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('languageCode', code);
    } catch (_) {
      // ignore write errors
    }
  }
}

