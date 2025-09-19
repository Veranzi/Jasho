import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/gamification_provider.dart';

class RewardsScreen extends StatelessWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final g = context.watch<GamificationProvider>();
    final rewards = const [
      {'name': '100MB Safaricom Data', 'cost': 500},
      {'name': 'KES 50 fee discount', 'cost': 300},
      {'name': 'Visibility Boost (3 days)', 'cost': 800},
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Rewards')),
      body: ListView.builder(
        itemCount: rewards.length,
        itemBuilder: (_, i) {
          final r = rewards[i];
          return ListTile(
            title: Text(r['name'].toString()),
            subtitle: Text('${r['cost']} pts'),
            trailing: ElevatedButton(
              onPressed: g.points >= (r['cost'] as int)
                  ? () => g.redeemPoints(r['cost'] as int)
                  : null,
              child: const Text('Redeem'),
            ),
          );
        },
      ),
    );
  }
}

