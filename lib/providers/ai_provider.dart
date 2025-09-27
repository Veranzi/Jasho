import 'package:flutter/foundation.dart';

class AiSuggestion {
  final String messageEn;
  final String messageSw;
  AiSuggestion({required this.messageEn, required this.messageSw});
}

class AiProvider extends ChangeNotifier {
  String _languageCode = 'en'; // 'en' or 'sw'
  final List<AiSuggestion> _suggestions = [
    AiSuggestion(
      messageEn: 'You earned 20% more than last week, save KES 500 to reach goal.',
      messageSw: 'Ulipata 20% zaidi kuliko wiki iliyopita, weka KES 500 kufikia lengo.',
    ),
    AiSuggestion(
      messageEn: 'Cleaning jobs rise on weekends. Consider opening your availability.',
      messageSw: 'Kazi za usafi huongezeka wikendi. Fikiria kufungua upatikanaji wako.',
    ),
  ];

  String get languageCode => _languageCode;
  List<AiSuggestion> get suggestions => List.unmodifiable(_suggestions);

  void setLanguage(String code) {
    if (code == _languageCode) return;
    _languageCode = code;
    notifyListeners();
  }
}

