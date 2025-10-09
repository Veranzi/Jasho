import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class AiSuggestion {
  final String messageEn;
  final String messageSw;
  AiSuggestion({required this.messageEn, required this.messageSw});
}

class AiProvider extends ChangeNotifier {
  String _languageCode = 'en'; // 'en' or 'sw'
  final List<AiSuggestion> _suggestions = [];
  bool _isLoading = false;
  String? _error;

  String get languageCode => _languageCode;
  List<AiSuggestion> get suggestions => List.unmodifiable(_suggestions);
  bool get isLoading => _isLoading;
  String? get error => _error;

  void setLanguage(String code) {
    if (code == _languageCode) return;
    _languageCode = code;
    notifyListeners();
  }

  Future<void> loadSuggestions() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final resp = await ApiService().getAISuggestions();
      if (resp['success'] == true) {
        final List list = resp['data']['suggestions'] ?? [];
        _suggestions
          ..clear()
          ..addAll(list.map((e) => AiSuggestion(
                messageEn: e['messageEn'] ?? '',
                messageSw: e['messageSw'] ?? '',
              )));
        _languageCode = (resp['data']['languageCode'] ?? 'en');
      } else {
        _error = resp['message'] ?? 'Failed to load suggestions';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

