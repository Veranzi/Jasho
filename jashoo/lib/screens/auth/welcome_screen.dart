import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final List<String> _backgroundImages = const <String>[
    'assets/login.png',
    'assets/signup.png',
    'assets/sign_illustration.jpg',
    'assets/login_illustration.png',
  ];

  // Captions corresponding to each background image
  final List<String> _captions = const <String>[
    'Powering your hustle',
    'Savings better',
    'Get Gig',
    'Smart tool',
  ];

  late final Timer _backgroundTimer;
  int _currentBackgroundIndex = 0;

  static const Color _primaryGreen = Color(0xFF10B981);

  @override
  void initState() {
    super.initState();
    _backgroundTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted) return;
      setState(() {
        _currentBackgroundIndex =
            (_currentBackgroundIndex + 1) % _backgroundImages.length;
      });
    });
  }

  @override
  void dispose() {
    _backgroundTimer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Size screenSize = MediaQuery.of(context).size;
    final double sheetHeight = screenSize.height * 0.38;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1) Animated background with smooth fade
          Positioned.fill(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 900),
              switchInCurve: Curves.easeIn,
              switchOutCurve: Curves.easeOut,
              layoutBuilder: (currentChild, previousChildren) {
                return Stack(
                  fit: StackFit.expand,
                  children: <Widget>[
                    ...previousChildren,
                    if (currentChild != null) currentChild,
                  ],
                );
              },
              child: Image.asset(
                _backgroundImages[_currentBackgroundIndex],
                key: ValueKey<int>(_currentBackgroundIndex),
                fit: BoxFit.cover,
              ),
            ),
          ),

          // Top gradient overlay for readability
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color.fromARGB(140, 0, 0, 0),
                    Color.fromARGB(40, 0, 0, 0),
                    Colors.transparent,
                  ],
                  stops: [0.0, 0.2, 0.5],
                ),
              ),
            ),
          ),

          // 2) Caption text centered near bottom of background section
          Positioned(
            left: 0,
            right: 0,
            bottom: sheetHeight + 52,
            child: Center(
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.35),
                  borderRadius: BorderRadius.circular(16.r),
                ),
                child: Text(
                  _captions[_currentBackgroundIndex % _captions.length],
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14.sp,
                  ),
                ),
              ),
            ),
          ),

          // 3) Progress dots centered near bottom of background section
          Positioned(
            left: 0,
            right: 0,
            bottom: sheetHeight + 18.h,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_backgroundImages.length, (int index) {
                final bool isActive = index == _currentBackgroundIndex;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: EdgeInsets.symmetric(horizontal: 4.w),
                  width: isActive ? 12.w : 6.w,
                  height: 6.w,
                  decoration: BoxDecoration(
                    color: isActive
                        ? _primaryGreen
                        : Colors.white.withOpacity(0.55),
                    borderRadius: BorderRadius.circular(4.r),
                  ),
                );
              }),
            ),
          ),

          // 4) Bottom white sheet with content
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SafeArea(
              top: false,
              child: Container(
                height: sheetHeight,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(
                    top: Radius.circular(24.r),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, -6),
                    )
                  ],
                ),
                child: Padding(
                  padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 24.h),
                  child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Back arrow
                      Align(
                        alignment: Alignment.centerLeft,
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back),
                          color: Colors.black,
                          splashRadius: 24.r,
                          onPressed: () {
                            if (Navigator.of(context).canPop()) {
                              Navigator.of(context).pop();
                            }
                          },
                        ),
                      ),
                      SizedBox(height: 6.h),
                      // Title + Subtitle centered
                      Center(
                        child: Column(
                          children: [
                            Text(
                              'Welcome Back',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.w600,
                                fontSize: 22.sp,
                              ),
                            ),
                            SizedBox(height: 8.h),
                            Text(
                              'Empower your hustle with smart financial tool',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.black.withOpacity(0.65),
                                fontSize: 14.sp,
                                height: 1.4,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      // Primary button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _primaryGreen,
                            foregroundColor: Colors.white,
                            padding: EdgeInsets.symmetric(vertical: 14.h),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12.r),
                            ),
                          ),
                          onPressed: () {
                            Navigator.of(context).pushReplacementNamed('/login');
                          },
                          child: Text('Login',
                              style: TextStyle(
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w600,
                              )),
                        ),
                      ),
                      SizedBox(height: 12.h),
                      // Secondary button
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: _primaryGreen,
                            side: const BorderSide(
                              color: _primaryGreen,
                              width: 1.0,
                            ),
                            padding: EdgeInsets.symmetric(vertical: 14.h),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12.r),
                            ),
                          ),
                          onPressed: () {
                            Navigator.of(context).pushReplacementNamed('/signup');
                          },
                          child: Text(
                            'Sign Up',
                            style: TextStyle(
                              fontSize: 16.sp,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
