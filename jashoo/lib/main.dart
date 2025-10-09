import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'l10n/app_localizations.dart';
import 'package:responsive_framework/responsive_framework.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'routes.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'providers/auth_provider.dart' as app_auth;
import 'providers/user_provider.dart';
import 'providers/wallet_provider.dart';
import 'providers/jobs_provider.dart';
import 'providers/gamification_provider.dart';
import 'providers/ai_provider.dart';
import 'providers/savings_provider.dart';
import 'providers/locale_provider.dart';
import 'providers/pin_provider.dart';
import 'screens/auth/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (kIsWeb) {
    // Skip Firebase on web if options are not provided to avoid crash
    debugPrint('Firebase init skipped on web.');
  } else {
    try {
      await Firebase.initializeApp();
    } catch (e) {
      debugPrint('Firebase initialization skipped: $e');
    }
  }
  runApp(const JashoApp());
}

class JashoApp extends StatelessWidget {
  const JashoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => app_auth.AuthProvider()),
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => WalletProvider()),
        ChangeNotifierProvider(create: (_) => JobsProvider()),
        ChangeNotifierProvider(create: (_) => GamificationProvider()),
        ChangeNotifierProvider(create: (_) => AiProvider()),
        ChangeNotifierProvider(create: (_) => SavingsProvider()),
        ChangeNotifierProvider(create: (_) => LocaleProvider()),
        ChangeNotifierProvider(create: (_) => PinProvider()),
      ],
      child: Consumer<LocaleProvider>(
        builder: (context, localeProvider, _) => ScreenUtilInit(
          designSize: const Size(390, 844),
          minTextAdapt: true,
          splitScreenMode: true,
          builder: (_, __) => MaterialApp(
            debugShowCheckedModeBanner: false,
            title: 'Jasho',
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF10B981)),
              useMaterial3: true,
              visualDensity: VisualDensity.adaptivePlatformDensity,
            ),
            locale: Locale(localeProvider.languageCode),
            supportedLocales: const [
              Locale('en'),
              Locale('sw'),
            ],
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: const SplashScreen(),
            routes: appRoutes,
            builder: (context, child) => ResponsiveBreakpoints.builder(
              child: child ?? const SizedBox.shrink(),
              breakpoints: const [
                Breakpoint(start: 0, end: 600, name: MOBILE),
                Breakpoint(start: 601, end: 900, name: TABLET),
                Breakpoint(start: 901, end: 1200, name: DESKTOP),
                Breakpoint(start: 1201, end: double.infinity, name: '4K'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
