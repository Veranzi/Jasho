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
import 'screens/settings/profile_update.dart';
import 'screens/auth/kyc_screen.dart';
import 'screens/auth/phone_auth_screen.dart';
import 'screens/dashboard/ai_assistant_screen.dart';
import 'screens/wallet/deposit_screen.dart';
import 'screens/wallet/withdraw_screen.dart';
import 'screens/wallet/convert_screen.dart';
import 'screens/wallet/set_pin_screen.dart';
import 'screens/savings/savings_screen.dart';
import 'screens/savings/loans_screen.dart';
import 'screens/support/support_chat_screen.dart';
import 'screens/gamification/gamification_screen.dart';
import 'screens/gamification/leaderboard_screen.dart';
import 'screens/gamification/rewards_screen.dart';
import 'screens/jobs/job_detail_screen.dart';
import 'screens/jobs/post_job_screen.dart';
import 'screens/settings/security_screen.dart';
import 'screens/insurance/insurance_screen.dart';
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
  '/kyc': (_) => const KycScreen(),
  '/phoneAuth': (_) => const PhoneAuthScreen(),
  '/aiAssistant': (_) => const AiAssistantScreen(),
  '/deposit': (_) => const DepositScreen(),
  '/withdraw': (_) => const WithdrawScreen(),
  '/convert': (_) => const ConvertScreen(),
  '/setPin': (_) => const SetPinScreen(),
  '/savings': (_) => const SavingsScreen(),
  '/loans': (_) => const LoansScreen(),
  '/supportChat': (_) => const SupportChatScreen(),
  '/gamification': (_) => const GamificationScreen(),
  '/leaderboard': (_) => const LeaderboardScreen(),
  '/rewards': (_) => const RewardsScreen(),
  '/jobDetail': (_) => const JobDetailScreen(),
  '/postJob': (_) => const PostJobScreen(),
  '/security': (_) => const SecurityScreen(),
  '/insurance': (_) => const InsuranceScreen(),
};
