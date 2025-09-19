import 'package:flutter/material.dart';
import 'dart:async';
import 'login_screen.dart'; // Make sure this path is correct

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Wait for 3 seconds and then navigate to the LoginScreen
    Timer(
      const Duration(seconds: 3),
      () => Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (BuildContext context) => const LoginScreen(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // This is the dark teal background color from your design
      backgroundColor: const Color(0xFF0D47A1),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Your Logo Widget
            SizedBox(
              width: 150.0,
              height: 150.0,
              child: Image.asset(
                'assets/logo.png', // Ensure this path matches your asset in pubspec.yaml
              ),
            ),
            const SizedBox(height: 24),
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