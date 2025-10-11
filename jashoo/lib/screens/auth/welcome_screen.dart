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

  late final Timer _backgroundTimer;
  int _currentBackgroundIndex = 0;

  static const Color _primaryGreen = Color(0xFF0B9E6D);

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

          // 2) Progress dots centered near bottom of background section
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

          // 3) Bottom white sheet with content
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
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Back arrow
                      IconButton(
                        icon: const Icon(Icons.arrow_back),
                        color: Colors.black,
                        splashRadius: 24.r,
                        onPressed: () {
                          if (Navigator.of(context).canPop()) {
                            Navigator.of(context).pop();
                          }
                        },
                      ),
                      SizedBox(height: 6.h),
                      // Title
                      Text(
                        'Welcome Back',
                        style: TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.w800,
                          fontSize: 26.sp,
                        ),
                      ),
                      SizedBox(height: 8.h),
                      // Subtitle
                      Text(
                        'Easier Income Tracking',
                        style: TextStyle(
                          color: Colors.black.withOpacity(0.65),
                          fontSize: 14.sp,
                          height: 1.4,
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
                          child: Text(
                            'Log in as 254745***00',
                            style: TextStyle(
                              fontSize: 16.sp,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: 12.h),
                      // Secondary button
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: Colors.black,
                            side: const BorderSide(
                              color: Color(0x26000000), // #00000026
                              width: 1.0,
                            ),
                            padding: EdgeInsets.symmetric(vertical: 14.h),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12.r),
                            ),
                          ),
                          onPressed: () {
                            Navigator.of(context).pushReplacementNamed('/login');
                          },
                          child: Text(
                            'Switch Account',
                            style: TextStyle(
                              fontSize: 16.sp,
                              fontWeight: FontWeight.w700,
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
