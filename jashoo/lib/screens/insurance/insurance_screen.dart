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
    final covers = const [
      {'name': 'Personal Accident Cover', 'premium': 'KES 50/week'},
      {'name': 'Medical Micro-Insurance', 'premium': 'KES 100/week'},
      {'name': 'Income Protection', 'premium': 'KES 80/week'},
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Insurance'), backgroundColor: const Color(0xFF10B981)),
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
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 0.95,
                      ),
                      itemCount: 6,
                      itemBuilder: (_, __) => const Skeleton(height: 160),
                    )
                  : FadeTransition(
                      opacity: _fade,
                      child: GridView.builder(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.95,
                        ),
                        itemCount: covers.length,
                        itemBuilder: (_, i) {
                          final c = covers[i];
                          return _CoverCard(
                            name: c['name'] as String,
                            premium: c['premium'] as String,
                            onApply: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Applied (stub)'))),
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

class _CoverCard extends StatelessWidget {
  final String name;
  final String premium;
  final VoidCallback onApply;
  const _CoverCard({required this.name, required this.premium, required this.onApply});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.2)),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.shield, color: Theme.of(context).colorScheme.primary),
              const SizedBox(width: 8),
              Expanded(child: Text(name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold))),
            ],
          ),
          const Spacer(),
          Text(premium, style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(onPressed: onApply, child: const Text('Apply')),
          )
        ],
      ),
    );
  }
}

