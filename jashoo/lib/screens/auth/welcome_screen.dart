import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  late final PageController _pageController;
  late final Timer _autoScrollTimer;
  int _currentPage = 0;

  final List<_WorkerShowcase> _workers = const <_WorkerShowcase>[
    _WorkerShowcase(
      icon: Icons.delivery_dining,
      label: 'Rider',
      backgroundColor: Color(0xFF10B981),
      accentColor: Color(0xFF064E3B),
    ),
    _WorkerShowcase(
      icon: Icons.handyman,
      label: 'Handyman',
      backgroundColor: Color(0xFF0EA5E9),
      accentColor: Color(0xFF075985),
    ),
    _WorkerShowcase(
      icon: Icons.cleaning_services,
      label: 'Cleaner',
      backgroundColor: Color(0xFFF59E0B),
      accentColor: Color(0xFF92400E),
    ),
    _WorkerShowcase(
      icon: Icons.local_taxi,
      label: 'Driver',
      backgroundColor: Color(0xFF8B5CF6),
      accentColor: Color(0xFF4C1D95),
    ),
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.82, initialPage: 0);
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 3), (Timer timer) {
      if (!mounted) return;
      final int next = (_currentPage + 1) % _workers.length;
      _pageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _autoScrollTimer.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentPage = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 16.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Welcome to Jasho',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF10B981),
                  ),
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                'Find opportunities, work smarter, and get paid.',
                style: theme.textTheme.bodyMedium?.copyWith(color: Colors.black54),
              ),
              SizedBox(height: 28.h),

              // Animated workers carousel
              SizedBox(
                height: 320.h,
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: _onPageChanged,
                  itemCount: _workers.length,
                  itemBuilder: (context, index) {
                    final item = _workers[index];
                    final bool isActive = index == _currentPage;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 350),
                      margin: EdgeInsets.symmetric(horizontal: isActive ? 8.w : 14.w, vertical: isActive ? 0 : 12.h),
                      decoration: BoxDecoration(
                        color: item.backgroundColor.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(24.r),
                        border: Border.all(color: item.backgroundColor.withOpacity(0.35), width: 1.5),
                      ),
                      child: _WorkerCard(item: item, isActive: isActive),
                    );
                  },
                ),
              ),
              SizedBox(height: 14.h),

              // Dots indicator + label
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_workers.length, (i) {
                  final bool active = i == _currentPage;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    width: active ? 22.w : 8.w,
                    height: 8.h,
                    margin: EdgeInsets.symmetric(horizontal: 4.w),
                    decoration: BoxDecoration(
                      color: active ? const Color(0xFF10B981) : Colors.black12,
                      borderRadius: BorderRadius.circular(8.r),
                    ),
                  );
                }),
              ),
              SizedBox(height: 10.h),
              Center(
                child: Text(
                  _workers[_currentPage].label,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
              ),
              const Spacer(),

              // CTA buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF10B981),
                        side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                        padding: EdgeInsets.symmetric(vertical: 14.h),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
                      ),
                      onPressed: () => Navigator.of(context).pushReplacementNamed('/login'),
                      child: const Text('Login'),
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(vertical: 14.h),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
                      ),
                      onPressed: () => Navigator.of(context).pushReplacementNamed('/signup'),
                      child: const Text('Sign Up'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WorkerCard extends StatefulWidget {
  final _WorkerShowcase item;
  final bool isActive;
  const _WorkerCard({required this.item, required this.isActive});

  @override
  State<_WorkerCard> createState() => _WorkerCardState();
}

class _WorkerCardState extends State<_WorkerCard> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _floatAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
    _floatAnimation = Tween<double>(begin: 0, end: 10.h).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = 180.w;
    return Center(
      child: AnimatedScale(
        scale: widget.isActive ? 1.0 : 0.95,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedBuilder(
              animation: _floatAnimation,
              builder: (context, child) {
                return Transform.translate(
                  offset: Offset(0, widget.isActive ? -_floatAnimation.value : 0),
                  child: child,
                );
              },
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      widget.item.backgroundColor.withOpacity(0.85),
                      widget.item.accentColor.withOpacity(0.85),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: widget.item.backgroundColor.withOpacity(0.28),
                      blurRadius: 24,
                      spreadRadius: 2,
                      offset: const Offset(0, 10),
                    )
                  ],
                ),
                child: Icon(
                  widget.item.icon,
                  size: 98.sp,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WorkerShowcase {
  final IconData icon;
  final String label;
  final Color backgroundColor;
  final Color accentColor;
  const _WorkerShowcase({
    required this.icon,
    required this.label,
    required this.backgroundColor,
    required this.accentColor,
  });
}
