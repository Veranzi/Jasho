import 'package:flutter/material.dart';
import 'package:jashoo/screens/auth/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/auth/change_password_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/dashboard/transaction_history_screen.dart';
import 'screens/dashboard/earnings_screen.dart';
import 'screens/dashboard/qr_scanner_screen.dart';
import 'screens/settings/help_screen.dart';
import 'screens/dashboard/community.dart';
import 'screens/auth/logout.dart';
import 'screens/settings/profile_update.dart ';
import 'screens/dashboard/jobs.dart';
import 'screens/dashboard/transactions.dart';

// 👈 add splash

final Map<String, WidgetBuilder> appRoutes = {
  '/splash': (_) => const SplashScreen(), // 👈 new route
  '/login': (_) => const LoginScreen(),
  '/signup': (_) => const SignupScreen(),
  '/forgotPassword': (_) => const ForgotPass(),
  '/changePassword': (_) => const ChangePassword(),
  '/dashboard': (_) => const DashBoardScreen(),
  '/transactions': (_) => const Transactions(),
  '/earnings': (_) => const MyEarningsPage(),
  '/qrScanner': (_) => const QrCodeScannerPage(),
  '/help': (_) => const HelpPage(),
  '/community': (_) => const CommunityScreen(),
  '/logout': (_) => const LogoutScreen(),
  '/profileUpdate': (_) => const UpdateProfilePage(),
  '/jobs': (_) => const JobsPage(),
  '/transactionHistory': (_) => const TransactionHistoryScreen(),
};
