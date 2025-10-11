import 'package:flutter/material.dart';
import 'dart:async';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart' as app_auth;
import 'package:flutter_screenutil/flutter_screenutil.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    // brief splash delay
    await Future<void>.delayed(const Duration(seconds: 2));
    try {
      final auth = Provider.of<app_auth.AuthProvider>(context, listen: false);
      await auth.initialize();
      if (!mounted) return;
      if (auth.isLoggedIn) {
        Navigator.of(context).pushReplacementNamed('/dashboard');
      } else {
        Navigator.of(context).pushReplacementNamed('/welcome');
      }
    } catch (_) {
      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed('/welcome');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // This is the dark teal background color from your design
      backgroundColor: const Color(0xFF10B981),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Your Logo Widget
            SizedBox(
              width: 150.w,
              height: 150.w,
              child: Image.asset(
                'assets/logo1.png', // Ensure this path matches your asset in pubspec.yaml
              ),
            ),
            SizedBox(height: 24.h),
            // Optional: Add a loading indicator
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}
