import 'package:flutter/widgets.dart';

class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  static const Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'language': 'Language',
      'english': 'English',
      'swahili': 'Swahili',
      'login': 'Login',
      'signup': 'Sign Up',
      'full_name': 'Full Name',
      'phone_number': 'Phone Number',
      'email': 'Email',
      'password': 'Password',
      'confirm_password': 'Confirm Password',
      'register': 'Register',
      'already_have_account': 'Already have an account?',
      'forgot_password': 'Forgot password?',
      'create_account': 'Create Account',
      'login_with_phone': 'Login with Phone',
      'wallet_balance': 'Wallet Balance',
      'logout': 'Logout',
      'community': 'Community',
      'jobs_marketplace': 'Jobs Marketplace',
      'update_profile': 'Update Profile',
      'change_password': 'Change Password',
      'help_support': 'Help & Support',
      'phone_verification': 'Phone Verification',
      'sms_code': 'SMS Code',
      'send_code': 'Send Code',
      'verify': 'Verify',
      'country': 'Country',
      'county_province': 'County / Province',
      'ward_constituency': 'Constituency / Ward',
    },
    'sw': {
      'language': 'Lugha',
      'english': 'Kiingereza',
      'swahili': 'Kiswahili',
      'login': 'Ingia',
      'signup': 'Jisajili',
      'full_name': 'Jina Kamili',
      'phone_number': 'Nambari ya Simu',
      'email': 'Barua pepe',
      'password': 'Nywila',
      'confirm_password': 'Thibitisha Nywila',
      'register': 'Jisajili',
      'already_have_account': 'Tayari una akaunti?',
      'forgot_password': 'Umesahau nywila?',
      'create_account': 'Unda Akaunti',
      'login_with_phone': 'Ingia kwa Simu',
      'wallet_balance': 'Salio la Pochi',
      'logout': 'Toka',
      'community': 'Jumuiya',
      'jobs_marketplace': 'Soko la Kazi',
      'update_profile': 'Sasisha Wasifu',
      'change_password': 'Badilisha Nywila',
      'help_support': 'Msaada',
      'phone_verification': 'Uthibitisho wa Simu',
      'sms_code': 'Nambari ya SMS',
      'send_code': 'Tuma Nambari',
      'verify': 'Thibitisha',
      'country': 'Nchi',
      'county_province': 'Kaunti / Mkoa',
      'ward_constituency': 'Wadi / Eneo Bunge',
    },
  };

  String t(String key) {
    final map = _localizedValues[locale.languageCode] ?? _localizedValues['en']!;
    return map[key] ?? _localizedValues['en']![key] ?? key;
  }
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['en', 'sw'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async => AppLocalizations(locale);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

