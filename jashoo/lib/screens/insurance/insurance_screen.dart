import 'package:flutter/material.dart';
import '../../widgets/skeleton.dart';

class InsuranceScreen extends StatefulWidget {
  const InsuranceScreen({super.key});

  @override
  State<InsuranceScreen> createState() => _InsuranceScreenState();
}

class _InsuranceScreenState extends State<InsuranceScreen> with SingleTickerProviderStateMixin {
  bool _loading = true;
  late final AnimationController _controller;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    Future.delayed(const Duration(milliseconds: 450), () {
      if (mounted) {
        setState(() => _loading = false);
        _controller.forward();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final insuranceCategories = [
      {
        'title': 'Medical Insurance',
        'icon': Icons.health_and_safety,
        'providers': ['SHA', 'AAR', 'APA', 'Jubilee', 'Britam'],
        'premium': 'From KES 100/week'
      },
      {
        'title': 'Personal Accident Cover',
        'icon': Icons.emergency,
        'providers': ['AAR', 'Madison', 'Standard Chartered', 'Britam'],
        'premium': 'From KES 50/week'
      },
      {
        'title': 'Income Protection',
        'icon': Icons.security,
        'providers': ['Britam', 'Pioneer', 'Stanbic'],
        'premium': 'From KES 80/week'
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: Image.asset('assets/logo1.png', height: 28),
        centerTitle: true,
        backgroundColor: const Color(0xFF10B981),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _InsuranceHeader(),
            const SizedBox(height: 16),
            Expanded(
              child: _loading
                  ? GridView.builder(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 1,
                        childAspectRatio: 2.5,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: 3,
                      itemBuilder: (_, __) => const Skeleton(height: 120),
                    )
                  : FadeTransition(
                      opacity: _fade,
                      child: ListView.builder(
                        itemCount: insuranceCategories.length,
                        itemBuilder: (_, i) {
                          final category = insuranceCategories[i];
                          return _InsuranceCategoryCard(
                            title: category['title'] as String,
                            icon: category['icon'] as IconData,
                            providers: category['providers'] as List<String>,
                            premium: category['premium'] as String,
                            onApply: () => ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Applied for ${category['title']} (stub)'))
                            ),
                          );
                        },
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InsuranceHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF00695C), Color(0xFF26A69A)]),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: const [
          Icon(Icons.health_and_safety, color: Colors.white),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Protect your hustle with micro-insurance tailored for you',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}

class _InsuranceCategoryCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<String> providers;
  final String premium;
  final VoidCallback onApply;
  
  const _InsuranceCategoryCard({
    required this.title,
    required this.icon,
    required this.providers,
    required this.premium,
    required this.onApply,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[300]!),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with icon and title
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: const Color(0xFF10B981), size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      premium,
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Providers section
          Text(
            'Available Providers:',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
              fontSize: 14,
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Provider chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: providers.map((provider) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
              ),
              child: Text(
                provider,
                style: const TextStyle(
                  color: Color(0xFF10B981),
                  fontWeight: FontWeight.w500,
                  fontSize: 12,
                ),
              ),
            )).toList(),
          ),
          
          const SizedBox(height: 16),
          
          // Apply button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onApply,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'View Options & Apply',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

