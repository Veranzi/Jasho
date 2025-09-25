import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/gamification_provider.dart';
import '../../widgets/skeleton.dart';

class RewardsScreen extends StatefulWidget {
  const RewardsScreen({super.key});

  @override
  State<RewardsScreen> createState() => _RewardsScreenState();
}

class _RewardsScreenState extends State<RewardsScreen> with SingleTickerProviderStateMixin {
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
    final g = context.watch<GamificationProvider>();
    final rewards = const [
      {'name': '100MB Safaricom Data', 'cost': 500, 'type': 'airtime'},
      {'name': 'KES 50 Savings Withdrawal Discount', 'cost': 300, 'type': 'discount'},
      {'name': 'Visibility Boost (3 days)', 'cost': 800, 'type': 'goods'},
      {'name': 'USDT Bonus 1', 'cost': 1000, 'type': 'usdt'},
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Rewards Store'), backgroundColor: const Color(0xFF0D47A1)),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _PointsHeader(points: g.points),
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
                itemCount: rewards.length,
                itemBuilder: (_, i) {
                  final r = rewards[i];
                  final canRedeem = g.points >= (r['cost'] as int);
                  return _RewardCard(
                    name: r['name'].toString(),
                    cost: r['cost'] as int,
                    icon: _iconForType(r['type'] as String),
                    canRedeem: canRedeem,
                    onRedeem: canRedeem ? () => g.redeemPoints(r['cost'] as int) : null,
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

class _PointsHeader extends StatelessWidget {
  final int points;
  const _PointsHeader({required this.points});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF0D47A1), Color(0xFF1976D2)]),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          const Icon(Icons.workspace_premium, color: Colors.white),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Your balance', style: TextStyle(color: Colors.white70)),
                Text('$points pts', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          OutlinedButton(
            style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: Colors.white70)),
            onPressed: () {},
            child: const Text('How it works'),
          )
        ],
      ),
    );
  }
}

class _RewardCard extends StatelessWidget {
  final String name;
  final int cost;
  final IconData icon;
  final bool canRedeem;
  final VoidCallback? onRedeem;
  const _RewardCard({required this.name, required this.cost, required this.icon, required this.canRedeem, required this.onRedeem});

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
              Icon(icon, color: Theme.of(context).colorScheme.primary),
              const SizedBox(width: 8),
              Expanded(child: Text(name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold))),
            ],
          ),
          const Spacer(),
          Row(
            children: [
              Text('$cost pts', style: const TextStyle(fontWeight: FontWeight.bold)),
              const Spacer(),
              ElevatedButton(onPressed: onRedeem, child: const Text('Redeem')),
            ],
          )
        ],
      ),
    );
  }
}

IconData _iconForType(String type) {
  switch (type) {
    case 'airtime':
      return Icons.network_cell;
    case 'discount':
      return Icons.discount;
    case 'goods':
      return Icons.star;
    case 'usdt':
      return Icons.currency_exchange;
    default:
      return Icons.card_giftcard;
  }
}

